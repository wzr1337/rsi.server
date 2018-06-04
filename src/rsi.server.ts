
import { ElementResponse, IElement, Resource, RsiLogger, Service, StatusCode } from "@rsi/core";
import * as express from "express";
import * as request from "request";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { ElementUtil, filterByKeys, pathof, splitEvent } from "./helpers";
import { IErrorObject, IRsiClientWebSocketMessage, IRunOptions } from "./types";
import { WebServer } from "./web.server";
import { WsHandler } from "./web.socket.handler";
import { RsiWebSocket } from "./web.socket.server";

/**
 * The rsiServer class to be instantiated for running a server
 */
export class RsiServer {

  private logger = RsiLogger.getInstance().getLogger("general");
  private server: WebServer;
  private BASEURI: string = "/";
  private availableServices: Array<{ id: string; name: string; uri: string }> = [];
  private wsMapping: { [path: string]: WsHandler } = {};
  private shuttingDown: boolean;
  private clientWebsockets: RsiWebSocket[] = [];
  private serviceMap: any = {};
  private elementUtil: ElementUtil;
  private port: number = 3000;
  private serviceRegistry: string = "";
  /** the servers id */
  private ID = "50182B97-1AE1-4701-A6CE-017648990969";

  constructor() {
    this.elementUtil = new ElementUtil(this.availableServices, this.serviceMap);
  }

  /**
   * stop the server and disconnect all clients gracefully
   */
  public stop() {
    if (this.server) {
      this.clientWebsockets.forEach((c: RsiWebSocket) => c.close(1001));
      this.clientWebsockets.length = 0;
      this.server.close();
    }
  }

  /**
   *
   * @param options {IRunOptions} the
   *
   * @return {Promise<void>} resolves after proper startup
   */
  public run(options: IRunOptions = {}): Promise<void> {
    this.logger.transports.console.level = options.verbosity || "warn";
    this.BASEURI = options.base ? options.base : this.BASEURI;
    this.port = options.port ? options.port : this.port;
    this.serviceRegistry = options.serviceRegistry ? options.serviceRegistry : "";
    return new Promise<void>((resolve, reject) => {
      this.shuttingDown = false;
      this.server = new WebServer(options.port, this.BASEURI);
      this.server.init(); // need to init

      // repsonse to /$id queries with the servers ID
      this.server.app.get(this.BASEURI + "([\$])id",
                          (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // respond
        if (req.get("Accept") !== "text/plain") {
          res.status(StatusCode.NOT_FOUND);
          res.send();
          return;
        }
        res.status(StatusCode.OK);
        res.set("Content-Type", "text/plain");
        res.send(this.ID);
      });

      this.server.app.get(this.BASEURI, (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // respond
        res.status(StatusCode.OK);
        res.json({
          data: this.availableServices,
          status: "ok"
        });
      });

      this.server.app.all(this.BASEURI, (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // respond
        res.status(StatusCode.NOT_IMPLEMENTED);
        res.json({
          code: 501,
          message: "Not implemented",
          status: "error"
        } as IErrorObject);
      });

      this.server.ws.on("connection", (ws: any) => {                                // subscribe|unsubscribe

        const rsiWebSocket = new RsiWebSocket(ws);
        this.clientWebsockets.push(rsiWebSocket);
        ws.on("close", () => {
          for (const prop in this.wsMapping) {
            if (this.wsMapping.hasOwnProperty(prop)) {
              this.wsMapping[prop].unsubscribeWebSocket(rsiWebSocket);
            }
          }
          // remove the client websocket from the collection
          this.clientWebsockets.splice(this.clientWebsockets.indexOf(rsiWebSocket), 1);
        });

        ws.on("message", (message: string) => {
          let msg: IRsiClientWebSocketMessage;
          // make sure we actually parse the incomming message
          try {
            msg = JSON.parse(message);
          } catch (err) {
            rsiWebSocket.sendError(msg ? msg.event : "", StatusCode.BAD_REQUEST, new Error(err));
            return;
          }
          const event = splitEvent(msg.event);
          const basePath = this.BASEURI + event.service + "/" + event.resource + "/";
          if (this.wsMapping[basePath] && this.wsMapping[basePath].isHandlingEvent(msg.event)) {
            this.wsMapping[basePath].handleWebSocketMessages(msg, rsiWebSocket);
          } else {
            rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error("Not Found"));
          }
        });
      });
      resolve();
    });
  }
  public addService(service: Service) {
    const availableService = this.availableServices.find((s: any) => {
      return s.name === service.name;
    });

    if (availableService) {
      const i = this.availableServices.indexOf(availableService);
      this.availableServices.splice(i, 1);
    }

    this.availableServices.push({
      id: service.id,
      name: service.name,
      uri: this.BASEURI + service.name.toLowerCase() + "/"
    });

    this.serviceMap[service.name] = service;
    this.server.app.get(this.BASEURI + service.name.toLowerCase() + "/", this.serviceGET(service));
    this.server.app.get(this.BASEURI + service.name.toLowerCase() + "/spec", this.serviceGETSpec(service));
    // repsonse to {{basePath}}/$id queries with the services ID
    this.server.app.get(this.BASEURI + service.name.toLowerCase() + "/([\$])id",
                        (req: express.Request, res: express.Response, next: express.NextFunction) => {
    // respond
      res.status(StatusCode.OK);
      res.send(service.id);
    });

    if (this.serviceRegistry !== "") {
      this.announceService(service);
    }
    service.resources.map((resource: Resource) => {
      const basePath = this.BASEURI + service.name.toLowerCase() + "/" + resource.name.toLowerCase() + "/";
      this.server.app.get(basePath, this.resourceGET(service, resource));               // READ
      this.server.app.post(basePath, this.resourcePOST(service, resource));             // CREATE
      this.server.app.post(basePath + ":id", this.elementPOST(service, resource));      // READ
      this.server.app.get(basePath + ":id", this.elementGET(service, resource));        // UPDATE
      this.server.app.delete(basePath + ":id", this.elementDELETE(service, resource));  // DELETE
      this.wsMapping[basePath] = new WsHandler(service, resource, this.elementUtil);
    });
  }

  public announceService(service: Service) {
    const jsonBody = {
      name: service.name,
      port: this.port
    };

    const options = {
      body: jsonBody,
      json: true,
      method: "PUT",
      uri: this.serviceRegistry
    };

    request(options, (err, response) => {
      if (err) {
        this.logger.error("Error registering", err);
        setTimeout(() => {
          this.announceService(service);
        }, 2000);
      } else {
        if (response.statusCode === 404) {
          setTimeout(() => {
            this.announceService(service);
          }, 2000);
        } else {
          // console.log("Service 2 " + service.name + " Registered!");
        }
      }
    });
  }

  /**
   * handling GET requests on resource level (element listing).
   *
   * @param service   The service name.
   * @param resource  The resource name.
   */
  public resourceGET(service: Service, resource: Resource) {
    const resourcePath = pathof(this.BASEURI, service, resource);
    // if(resource.getResource ) { logger.info("GET   ", resourcePath, "registered") };
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req.query.hasOwnProperty("$spec") && resource.getResourceSpec) {
        res.status(StatusCode.OK);
        res.json({
          data: resource.getResourceSpec(),
          status: "ok"
        });
        return;
      }

      if (!resource.getResource) {
        res.status(StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
        return;
      }

      // get all available renderes and map their representation to JSON compatible values
      function parseNumberOrId(n: string | number): string | number {
        return (typeof n === "undefined") ? undefined : ((!isNaN(parseFloat(n as string)) && isFinite(n as number)) ?
                                                          parseFloat(n as string) : n.toString());
      }

      // tslint:disable-next-line:max-line-length
      const elements = await resource.getResource(parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit));

      if (elements) {
        let resp: any[] = elements.data.map((value: BehaviorSubject<IElement>) => {
          return value.getValue().data;
        });

        // enrich object refs + $expand handling
        const expandLevel: any = req.query.$expand ? req.query.$expand : 0;
        resp = await Promise.all(resp.map(async (x: any) => {
          await this.elementUtil.traverse(x, expandLevel, 0);
          return x;
        }));

        // Object ref search
        for (const propName in req.query) {
          if (req.query.hasOwnProperty(propName)) {
            if (propName.charAt(0) !== "$") {
              resp = resp.filter((item) => {
                if (!item.hasOwnProperty(propName)) {
                  return false;
                }
                if (typeof item[propName] === "object") {
                  if (item[propName].id === req.query[propName]) {
                    return true;
                  }
                } else if (item[propName] === req.query[propName]) {
                  return true;
                }
              });
            }
          }
        }

        // $q Freesearch
        if (req.query.hasOwnProperty("$q")) {
          resp = resp.filter((item: any) => {
            const stringValue: string = JSON.stringify(item);
            if (stringValue.indexOf(req.query.$q) !== -1) {
              return item;
            }
          });
        }

        // $fields filtering
        if (req.query.hasOwnProperty("$fields")) {
          const fieldsList: string[] = req.query.$fields;
          const medatoryFields: string[] = ["name", "id", "uri"];
          resp = resp.map((item: any) => {
            const newItem: any = {};
            for (const i in item) {
              if (fieldsList.indexOf(i) !== -1 || medatoryFields.indexOf(i) !== -1) {
                newItem[i] = item[i];
              }
            }
            return newItem;
          });
        }

        // $sorting
        if (req.query.hasOwnProperty("$sortby")) {
          let sort: string = req.query.$sortby;
          let dec: number = 1;
          if (sort.indexOf("-") === 0) {
            sort = sort.substring(1);
            dec = -1;
          }
          if (sort.indexOf("+") === 0) {
            sort = sort.substring(1);
            dec = 1;
          }

          resp = resp.sort((a: any, b: any) => {
            let val1: any = "z";
            let val2: any = "z";
            if (a.hasOwnProperty(sort)) {
              val1 = a[sort];
            }

            if (b.hasOwnProperty(sort)) {
              val2 = b[sort];
            }

            val1 = val1.toLowerCase();
            val2 = val2.toLowerCase();

            if (val1 < val2) {
              return -1 * dec;
            }

            if (val1 > val2) {
              return 1 * dec;
            }
            return 0;
          });
        }

        res.status(StatusCode.OK);
        res.json({
          data: resp,
          status: "ok"
        });
        return;
      } else {
        res.status(StatusCode.NOT_FOUND).send("Not found");
      }
    };
  }

  /**
   * handling POST requests on resource level (elment creation).
   *
   * @param service   The service name.
   * @param resource  The resource name.
   */
  public resourcePOST(service: Service, resource: Resource) {
    const resourcePath = pathof(this.BASEURI, service, resource);
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!resource.createElement) {
        res.status(StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
        return;
      }
      const newElement: ElementResponse = await resource.createElement(req.body);
      if (newElement.status === "ok") {
        res.status(StatusCode.CREATED);
        res.header({Location: (newElement.data as BehaviorSubject<IElement>).getValue().data.uri});
        res.json({
          status: "ok"
        });
      } else if (newElement.status) {
        res.json(newElement);
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).send("Internal Server Error");
      }
    };
  }

  public serviceGETSpec(service: Service) {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (service != null) {
        res.status(StatusCode.OK);
        res.json({
          data: service.getSpecification(),
          status: "ok"
        });
      } else {
        res.status(StatusCode.NOT_FOUND).send("Internal Server Error");
      }
    };
  }

  /**
   * handling DELETE requests on element level (element removal or property reset).
   *
   * @param service   The service name.
   * @param resource  The resource name.
   */
  public elementDELETE(service: Service, resource: Resource) {
    const elementPath = pathof(this.BASEURI, service, resource) + "/:id";
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {

      if (!resource.deleteElement) {
        res.status(501).send("Not Implemented");
        return;
      }
      // proprietary element deletion
      const deletionResponse = await resource.deleteElement(req.params.id);

      // respond
      if (deletionResponse.status && deletionResponse.status === "ok" || deletionResponse.status === "error") {
        // tslint:disable-next-line:max-line-length
        res.status(deletionResponse.code || (deletionResponse.status === "ok") ? StatusCode.OK : StatusCode.INTERNAL_SERVER_ERROR);
        res.json(deletionResponse);
      } else {
        res.status(StatusCode.INTERNAL_SERVER_ERROR).send("Internal Server Error");
        return;
      }
    };
  }

  /**
   * retrieve all resources of a service
   *
   * @param service the service to discover
   *
   * returns an express route callback
   */
  private serviceGET(service: Service) {
    const resources: any[] = service.resources.map((res: Resource) => {
      return {
        name: res.name.toLowerCase(),
        uri: this.BASEURI + service.name.toLowerCase() + "/" + res.name.toLowerCase() + "/"
      };
    });

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      let result: any = resources;
      if (req.query.hasOwnProperty("$spec") && service.getSpecification()) {
        result = service.getSpecification();
      }

      res.status(StatusCode.OK);
      res.json({
        data: result,
        status: "ok"
      });
    };
  }

  /**
   * handling GET requests on element level (retrieve element details).
   *
   * @param service   The service name.
   * @param resource  The resource name.
   */
  private elementGET(service: Service, resource: Resource) {
    const elementPath = pathof(this.BASEURI, service, resource) + "/:id";
    // if(resource.getElement) { logger.info("GET   ", elementPath, "registered") };
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (!resource.getElement) {
        res.status(StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
        return;
      }

      // proprietary element fetching
      const element = await resource.getElement(req.params.id);
      if (element && element.data) {
        let data = (element.data as BehaviorSubject<IElement>).getValue().data;
        // filter the result before responding if need
        // ed
        if (req.query.hasOwnProperty("$fields")) {
          data = filterByKeys(data, ["id", "name", "uri"].concat(req.query.$fields.split(",")));
        }

        const expandLevel: any = req.query.$expand ? req.query.$expand : 0;
        await this.elementUtil.traverse(data, expandLevel, 0);

        // respond
        res.status(StatusCode.OK);
        res.json({
          data,
          status: "ok"
        });
      } else {
        res.status(404).send();
      }
    };
  }

  /**
   * handling POST requests on element level (modify an existing element).
   *
   * @param service   The service name.
   * @param resource  The resource name.
   */
  private elementPOST(service: Service, resource: Resource) {
    const elementPath = pathof(this.BASEURI, service, resource) + "/:id";
    // if(resource.updateElement) { logger.info("POST  ", elementPath, "registered") };
    return async (req: express.Request, res: express.Response, next: express.NextFunction) => {

      // find the element requested by the client
      const element: ElementResponse = await resource.getElement(req.params.id);
      if (element && element.status === "ok") {
        const resp = await resource.updateElement(req.params.id, req.body);
        res.status(resp.code || StatusCode.OK);
        res.json({
          code: resp.code || undefined,
          message: resp.error ? (resp.error.message || undefined) : undefined,
          status: resp.status
        });
      } else {
        res.status(element ? element.code : StatusCode.NOT_FOUND).json({
          code: element ? element.code : StatusCode.NOT_FOUND,
          message: element ? element.message : "Not found.",
          status: element ? element.status : "error"
        });
      }
    };
  }
}
