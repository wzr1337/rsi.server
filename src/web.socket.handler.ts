import { ElementUtil, filterByKeys, getEventParams, splitEvent } from './helpers';
import { RsiWebSocket } from './web.socket.server';
import { Element, Resource, ResourceUpdate, Service, StatusCode } from '@rsi/core';
import { RsiClientWebSocketMessage } from './types';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

export class WsHandler {
    private _subscriptions: any = {};

    constructor(private service: Service, private resource: Resource, private elementUtil: ElementUtil) {

    }

    toString() {
        return this.service.name + '/' + this.resource.name + '/';
    }

    /**
     * check if the Handler is actually handling the event
     * @param event the event url in question
     *
     * return true if instance handles event
     */
    isHandlingEvent(event: string): boolean {
        let partials = splitEvent(event);
        return (this.service.name.toLowerCase() === partials.service) && (this.resource.name.toLowerCase() === partials.resource);
    }

    /**
     * unsubscribe a given websocket from all it's subscriptions
     *
     * @param rsiWebSocket  The WebSocket to be unsubscribed.
     */
    unsubscribeWebSocket = (rsiWebSocket: RsiWebSocket) => {
        if (this._subscriptions[rsiWebSocket.id]) {
            let subscriptions: any = this._subscriptions[rsiWebSocket.id];
            for (let prop in subscriptions) {
                subscriptions[prop].unsubscribe();
            }
            delete this._subscriptions[rsiWebSocket.id];
        }
    };

    /**
     * handling incoming websocket messages
     *
     * @param service   The service name.
     * @param resource  The resource name.
     * @param ws        The WebSocket the client is sending data on.
     */
    handleWebSocketMessages = (msg: RsiClientWebSocketMessage, _rsiWebSocket: RsiWebSocket) => {
        var eventObj = splitEvent(msg.event);

        this._subscriptions[_rsiWebSocket.id] = this._subscriptions[_rsiWebSocket.id] || {}; // init if not yet initialized

        if (this._subscriptions[_rsiWebSocket.id][msg.event] && msg.type === 'subscribe') {
            //logger.debug("Already subscribed: ", msg.event);
            return;
        }
        if (!eventObj.service || !eventObj.resource) {
            _rsiWebSocket.sendError(msg.event, StatusCode.BAD_REQUEST, new Error('event url malformed'));
            return;
        }

        console.log('MSG TYPE ', msg.type);

        switch (msg.type) {
            case 'subscribe':
                if (eventObj.element) {
                    this.handleElementSubscriptions(_rsiWebSocket, msg, eventObj);
                } else {
                    this.handleResourceSubscriptions(_rsiWebSocket, msg, eventObj);
                }

                break;

            case 'unsubscribe':
                //logger.info("Unsubscription:", msg.event);
                let subscription = this._subscriptions[_rsiWebSocket.id][msg.event];
                if (subscription) {
                    subscription.unsubscribe();
                    _rsiWebSocket.acknowledgeUnsubscription(msg.event); //might fail, but not important at this point
                }
                break;
            case 'reauthorize':
            default:
                console.error('Unsupported command on ws://:', msg.event);
                _rsiWebSocket.sendError(msg.event, StatusCode.NOT_IMPLEMENTED, new Error('Not Implemented'));
                break;
        }

    }

    async handleElementSubscriptions(rsiWebSocket: RsiWebSocket, msg: RsiClientWebSocketMessage, eventObj: any) {
        if (this.resource.elementSubscribable) {
            // this is an element subscription
            let element = await this.resource.getElement(eventObj.element);
            let subject: BehaviorSubject<Element> = element.data;
            if (element && subject) {
                //logger.debug("New element level subscription:", msg.event);
                rsiWebSocket.acknowledgeSubscription(msg.event);

                let subscription$;

                if (msg.interval && msg.interval > 0) {
                    subscription$ = subject.combineLatest(Observable.interval(msg.interval), (s: any, t: any) => s);
                } else if (msg.updatelimit) {
                    subscription$ = subject.throttle(() => Observable.timer(msg.updatelimit));
                } else {
                    subscription$ = subject;
                }

                this._subscriptions[rsiWebSocket.id][msg.event] = subscription$.subscribe((data: any) => {
                        const params = getEventParams(msg.event);
                        let d: any = data.data;

                        if (params.$fields) {
                            const fields:Array<string> = params.$fields.split(',');
                            d = filterByKeys(d, ['id', 'name', 'uri'].concat(fields));
                        }

                        const expandLevel: any = params.$expand ? params.$expand : 0;
                        this.elementUtil.traverse(d, expandLevel, 0);


                        if (!rsiWebSocket.sendData(msg.event, d)) subject.complete();
                    },
                    (err: any) => {
                        if (!rsiWebSocket.sendError(msg.event, StatusCode.INTERNAL_SERVER_ERROR, new Error(err))) subject.complete();
                    });
            } else {
                if (!rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error('Not Found'))) subject.complete();
            }
        } else {
            rsiWebSocket.sendError(msg.event, StatusCode.SERVICE_UNAVAILABLE, new Error('Service unavailable'));
        }
    }

    handleResourceSubscriptions(rsiWebSocket, msg: RsiClientWebSocketMessage, eventObj: any) {
        if (this.resource.resourceSubscribable) {
            // resource subscription
            //logger.info("New resource level subscription:", msg.event);
            rsiWebSocket.acknowledgeSubscription(msg.event);

            let resourceStream$;
            // TODO: Should element updates trigger resource subscriptions?
            let resource$ = this.resource.change.filter(x=>x.action!=='update');

            if (msg.interval && msg.interval > 0) {
                resourceStream$ = resource$.combineLatest(Observable.interval(msg.interval), (s: any, t: any) => s);
            } else if (msg.updatelimit) {
                resourceStream$ = resource$.throttle(() => Observable.timer(msg.updatelimit));
            } else {
                resourceStream$ = resource$;
            }

            // filter only updates because resource subscription should only fire on add and remove
            this._subscriptions[rsiWebSocket.id][msg.event] = resourceStream$
                .subscribe(async (change: ResourceUpdate) => {
                        //logger.info("New resource data:", change);
                        let elements = await this.resource.getResource(/*parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit)*/);
                        if (elements) {
                            let resp = elements.data.map((value: BehaviorSubject<Element>) => {
                                return value.getValue().data;
                            });

                            const params = getEventParams(msg.event);
                            const expandLevel: any = params.$expand ? params.$expand : 0;

                            if (params.$q) {
                                resp = resp.filter((item: any) => {
                                    let stringValue: string = JSON.stringify(item);
                                    if (stringValue.indexOf(params.$q) != -1) {
                                        return item;
                                    }
                                });
                            }

                            resp = resp.map((x: any) => {
                                this.elementUtil.traverse(x, expandLevel, 0);
                                return x;
                            });

                            if (!rsiWebSocket.sendData(msg.event, resp)) this.resource.change.complete();
                        }
                        else {
                            if (!rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error('Not found'))) this.resource.change.complete();
                        }
                    },
                    (err: any) => {
                        if (!rsiWebSocket.sendError(msg.event, StatusCode.INTERNAL_SERVER_ERROR, new Error(err))) this.resource.change.complete();
                    });
        } else {
            rsiWebSocket.sendError(msg.event, StatusCode.NOT_IMPLEMENTED, new Error('Not Implemented'));
        }
    }


}