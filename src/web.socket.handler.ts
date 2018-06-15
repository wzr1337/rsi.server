import { IElement, IResourceUpdate, IRsiLoggerInstance, Resource, RsiLogger, Service, StatusCode } from "@rsi/core";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { ElementUtil, filterByKeys, getEventParams, splitEvent } from "./helpers";
import { IRsiClientWebSocketMessage } from "./types";
import { RsiWebSocket } from "./web.socket.server";

export class WsHandler {
  private subscriptions: any = {};
  private logger: IRsiLoggerInstance;

  constructor(private service: Service, private resource: Resource, private elementUtil: ElementUtil) {
    this.logger = RsiLogger.getInstance().getLogger("WsHandler");
  }

  public toString() {
    return this.service.name + "/" + this.resource.name + "/";
  }

  /**
   * check if the Handler is actually handling the event
   * @param event the event url in question
   *
   * return true if instance handles event
   */
  public isHandlingEvent(event: string): boolean {
    const partials = splitEvent(event);
    return (this.service.name.toLowerCase() === partials.service) &&
      (this.resource.name.toLowerCase() === partials.resource);
  }

  /**
   * unsubscribe a given websocket from all it"s subscriptions
   *
   * @param rsiWebSocket  The WebSocket to be unsubscribed.
   */
  public unsubscribeWebSocket = (rsiWebSocket: RsiWebSocket) => {
    if (this.subscriptions[rsiWebSocket.id]) {
      const subscriptions: {} = this.subscriptions[rsiWebSocket.id];
      for (const prop in subscriptions) {
        if (subscriptions.hasOwnProperty(prop)) {
          subscriptions[prop].unsubscribe();
        }
      }
      delete this.subscriptions[rsiWebSocket.id];
    }
  }

  /**
   * handling incoming websocket messages
   *
   * @param service   The service name.
   * @param resource  The resource name.
   * @param ws        The WebSocket the client is sending data on.
   */
  public handleWebSocketMessages = (msg: IRsiClientWebSocketMessage, rsiWebSocket: RsiWebSocket) => {
    const eventObj = splitEvent(msg.event);

    // init if not yet initialized
    this.subscriptions[rsiWebSocket.id] = this.subscriptions[rsiWebSocket.id] || {};

    if (this.subscriptions[rsiWebSocket.id][msg.event] && msg.type === "subscribe") {
      // logger.debug("Already subscribed: ", msg.event);
      return;
    }
    if (!eventObj.service || !eventObj.resource) {
      rsiWebSocket.sendError(msg.event, StatusCode.BAD_REQUEST, new Error("event url malformed"));
      return;
    }

    console.log("MSG TYPE ", msg.type);

    switch (msg.type) {
      case "subscribe":
        if (eventObj.element) {
          this.handleElementSubscriptions(rsiWebSocket, msg, eventObj);
        } else {
          this.handleResourceSubscriptions(rsiWebSocket, msg, eventObj);
        }

        break;

      case "unsubscribe":
        // logger.info("Unsubscription:", msg.event);
        const subscription = this.subscriptions[rsiWebSocket.id][msg.event];
        if (subscription) {
          subscription.unsubscribe();
          rsiWebSocket.acknowledgeUnsubscription(msg.event); // might fail, but not important at this point
        }
        break;
      case "reauthorize":
      default:
        this.logger.error("Unsupported command on ws://:", msg.event);
        rsiWebSocket.sendError(msg.event, StatusCode.NOT_IMPLEMENTED, new Error("Not Implemented"));
        break;
    }

  }

  public async handleElementSubscriptions(rsiWebSocket: RsiWebSocket, msg: IRsiClientWebSocketMessage,
                                          eventObj: any) {
    if (this.resource.elementSubscribable) {
      // this is an element subscription
      const element = await this.resource.getElement(eventObj.element);
      const subject: BehaviorSubject < IElement > = element.data;
      if (element && subject) {
        // logger.debug("New element level subscription:", msg.event);
        rsiWebSocket.acknowledgeSubscription(msg.event);

        let subscription$;

        if (msg.interval && msg.interval > 0) {
          subscription$ = subject.combineLatest(Observable.interval(msg.interval), (s: any, t: any) => s);
        } else if (msg.updatelimit) {
          subscription$ = subject.throttle(() => Observable.timer(msg.updatelimit));
        } else {
          subscription$ = subject;
        }

        this.subscriptions[rsiWebSocket.id][msg.event] = subscription$.subscribe(async (data: any) => {
            const params = getEventParams(msg.event);
            let d: any = data.data;

            if (params.$fields) {
              const fields: string[] = params.$fields.split(",");
              d = filterByKeys(d, ["id", "name", "uri"].concat(fields));
            }

            const expandLevel: any = params.$expand ? params.$expand : 0;
            await this.elementUtil.traverse(d, expandLevel, 0);

            if (!rsiWebSocket.sendData(msg.event, d)) {
              subject.complete();
            }
          },
          (err: any) => {
            if (!rsiWebSocket.sendError(msg.event, StatusCode.INTERNAL_SERVER_ERROR, new Error(err))) {
              subject.complete();
            }
          });
      } else {
        if (!rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error("Not Found"))) {
          subject.complete();
        }
      }
    } else {
      rsiWebSocket.sendError(msg.event, StatusCode.SERVICE_UNAVAILABLE, new Error("Service unavailable"));
    }
  }

  public handleResourceSubscriptions(rsiWebSocket, msg: IRsiClientWebSocketMessage, eventObj: any) {
    if (this.resource.resourceSubscribable) {
      // resource subscription
      // logger.info("New resource level subscription:", msg.event);
      rsiWebSocket.acknowledgeSubscription(msg.event);

      let resourceStream$;
      // @@TODO: Should element updates trigger resource subscriptions?
      const resource$ = this.resource.change.filter((x) => x.action !== "update");

      if (msg.interval && msg.interval > 0) {
        resourceStream$ = resource$.combineLatest(Observable.interval(msg.interval), (s: any, t: any) => s);
      } else if (msg.updatelimit) {
        resourceStream$ = resource$.throttle(() => Observable.timer(msg.updatelimit));
      } else {
        resourceStream$ = resource$;
      }

      // filter only updates because resource subscription should only fire on add and remove
      this.subscriptions[rsiWebSocket.id][msg.event] = resourceStream$
        .subscribe(async (change: IResourceUpdate) => {
            // logger.info("New resource data:", change);
            const elements = await this.resource.getResource(
              /*parseNumberOrId(req.query.$offset),
              parseNumberOrId(req.query.$limit)*/
            );
            if (elements) {
              let resp = elements.data.map((value: BehaviorSubject < IElement > ) => {
                return value.getValue().data;
              });

              const params = getEventParams(msg.event);
              const expandLevel: any = params.$expand ? params.$expand : 0;

              if (params.$q) {
                resp = resp.filter((item: any) => {
                  const stringValue: string = JSON.stringify(item);
                  if (stringValue.indexOf(params.$q) !== -1) {
                    return item;
                  }
                });
              }

              resp = await Promise.all(resp.map(async (x: any) => {
                await this.elementUtil.traverse(x, expandLevel, 0);
                return x;
              }));

              if (!rsiWebSocket.sendData(msg.event, resp)) {
                this.resource.change.complete();
              }
            } else {
              if (!rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND,
                  new Error("Not found"))) {
                this.resource.change.complete();
              }
            }
          },
          (err: any) => {
            if (!rsiWebSocket.sendError(msg.event, StatusCode.INTERNAL_SERVER_ERROR, new Error(err))) {
              this.resource.change.complete();
            }
          });
    } else {
      rsiWebSocket.sendError(msg.event, StatusCode.NOT_IMPLEMENTED, new Error("Not Implemented"));
    }
  }
}
