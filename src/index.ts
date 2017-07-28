import { BehaviorSubject, Subject} from '@reactivex/rxjs';
import * as express from 'express';
import { WebServer } from "./expressapp";
import { rsiWebSocket } from './rsiWebSocket';
import { rsiClientWebSocketMessage } from "./types";
import * as uuid from "uuid";
import * as fs from "fs";
import * as path from "path";
import { Service, Resource, Element, ResourceUpdate, StatusCode } from "./plugins/rsiPlugin";
import { rsiLogger } from "./log";
import { splitEvent } from "./helpers";
import * as queryString from "query-string";
import * as globby from 'globby';

declare function require(moduleName: string): any;

// constants
const PLUGINDIRS = ['./rsp/*/', './plugins/*/'].map(dir => { return path.join(__dirname, dir); });
const BASEURI = "/";

// globals
var availableServices:{id:string;name:string;uri:string}[] = [];
var server:WebServer;
const logger = rsiLogger.getInstance().getLogger("general");
var serviceMap:any = {};

/**
 * options to run the server
 */
export interface runOptions {
  port?:number,
  verbosity?:'silly'|'debug'|'verbose'|'info'|'warn'|'error'
}

/**
 * runs a server
 *
 * @param options the instance options
 *
 * @returns a Promise that resolve on succesful startup of the server
 */
var run = (options?:runOptions):Promise<void> => {
  logger.transports["console"].level = options.verbosity || 'warn';
  return new Promise<void>((resolve, reject) => {
    server = new WebServer(options.port);
    server.init(); // need to init

    server.app.get(BASEURI, (req: express.Request, res: express.Response, next: express.NextFunction) => {
      // respond
      res.status(StatusCode.OK);
      res.json({
        status: "ok",
        data: availableServices
      });
    });

    var wsMapping:{[path:string]: wsHandler} = {};

    /**
     * Plugin loader
     *
     * browses the PLUGINDIR for available plugins and registers them with the rsi sevrer
     */
    globby(PLUGINDIRS).then((paths:string[]) => {

      paths.forEach((plugin:string) => {
        if(fs.lstatSync(plugin).isDirectory()) {
          let _plugin = require(plugin);
          let service:Service = new _plugin.Service();
          availableServices.push({
            id: service.id,
            name: service.name,
            uri: BASEURI + service.name.toLowerCase() + "/"
          });
          serviceMap[service.name] = service;
          server.app.get(BASEURI + service.name.toLowerCase() + "/", serviceGET(service));
          logger.info("Loading Plugin:", service.name);
          service.resources.map((resource:Resource) => {
            let basePath = BASEURI + service.name.toLowerCase() + "/" + resource.name.toLowerCase() + "/";
            server.app.get(basePath, resourceGET(service, resource));               //READ
            server.app.post(basePath, resourcePOST(service, resource));             //CREATE
            server.app.post(basePath + ':id', elementPOST(service, resource));      //READ
            server.app.get(basePath + ':id', elementGET(service, resource));        //UPDATE
            server.app.delete(basePath + ':id', elementDELETE(service, resource));  //DELETE
            wsMapping[basePath] = new wsHandler(service, resource);
          });
        }
      });

      server.ws.on('connection', (ws:any) => {                                //subscribe|unsubscribe
        var _rsiWebSocket = new rsiWebSocket(ws);
        ws.on("close", () => {
          for (let prop in wsMapping) {
            wsMapping[prop].unsubscribeWebSocket(_rsiWebSocket);
          }
        });

        ws.on("message", (message:string) => {
          let msg:rsiClientWebSocketMessage;
          // make sure we actually parse the incomming message
          try {
            msg = JSON.parse(message);
          }
          catch(err) {
            _rsiWebSocket.sendError(msg ? msg.event : '', StatusCode.BAD_REQUEST, new Error(err));
            return;
          }
          let event = splitEvent(msg.event);
          let basePath = BASEURI + event.service + "/" + event.resource + "/";
          if(wsMapping[basePath] && wsMapping[basePath].isHandlingEvent(msg.event))
          {
            wsMapping[basePath].handleWebSocketMessages(msg, _rsiWebSocket);
          }
          else {
            _rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error("Not Found"));
          }
        });
      });
      resolve();
    }, (err:any) => {
      logger.log("error", err);
    });
  });
};

class wsHandler {
  private _subscriptions:any = {};

  constructor(private service:Service, private resource:Resource) {
  }

  toString() {
    return this.service.name + "/" + this.resource.name + "/";
  }

  /**
   * check if the Handler is actually handling the event
   * @param event the event url in question
   *
   * return true if instance handles event
   */
  isHandlingEvent(event:string):boolean {
    let partials = splitEvent(event);
    return (this.service.name.toLowerCase() === partials.service) && (this.resource.name.toLowerCase() === partials.resource);
  }

  /**
   * unsubscribe a given websocket from all it's subscriptions
   *
   * @param _rsiWebSocket  The WebSocket to be unsubscribed.
   */
  unsubscribeWebSocket = (_rsiWebSocket:rsiWebSocket) => {
    if (this._subscriptions[_rsiWebSocket.id]) {
      let subscriptions:any = this._subscriptions[_rsiWebSocket.id];
      for (let prop in subscriptions) {
        subscriptions[prop].unsubscribe();
      }
      delete this._subscriptions[_rsiWebSocket.id];
    }
  };

  /**
   * handling incoming websocket messages
   *
   * @param service   The service name.
   * @param resource  The resource name.
   * @param ws        The WebSocket the client is sending data on.
   */
  handleWebSocketMessages = (msg:rsiClientWebSocketMessage, _rsiWebSocket:rsiWebSocket) => {
      var eventObj = splitEvent(msg.event);

      this._subscriptions[_rsiWebSocket.id] = this._subscriptions[_rsiWebSocket.id] || {}; // init if not yet initialized

      if (!eventObj.service || !eventObj.resource) {
        _rsiWebSocket.sendError(msg.event, StatusCode.BAD_REQUEST, new Error("event url malformed"));
        return;
      }

      switch (msg.type) {
        case "subscribe":
          // check if  processing needed at all
          if (eventObj.element && this.resource.elementSubscribable) {
              // this is an element subscription
              let element = this.resource.getElement(eventObj.element);
              let subject:BehaviorSubject<Element> = <BehaviorSubject<Element>>element.data;
              if (element && subject) {
                logger.debug("New element level subscription:", msg.event);
                _rsiWebSocket.acknowledgeSubscription(msg.event);

                this._subscriptions[_rsiWebSocket.id][msg.event] = subject
                  .subscribe((data:Element) => {
                    const params = getEventParams(msg.event);
                    let d:any = data.data;
                    const expandLevel: any = params.$expand ? params.$expand : 0;
                    traverse(d, expandLevel, 0);

                    if (! _rsiWebSocket.sendData(msg.event, data.data)) subject.complete();
                    },
                    (err:any) => {
                      if (! _rsiWebSocket.sendError(msg.event, StatusCode.INTERNAL_SERVER_ERROR, new Error(err))) subject.complete();
                    });
              }
              else {
                if (! _rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error("Not Found"))) subject.complete();
              }
          }
          else if (eventObj.element && !this.resource.elementSubscribable)
          {
            _rsiWebSocket.sendError(msg.event, StatusCode.SERVICE_UNAVAILABLE, new Error("Service unavailable"));
          }
          if (!eventObj.element && this.resource.resourceSubscribable) {
            // resource subscription
            logger.info("New resource level subscription:", msg.event);
            _rsiWebSocket.acknowledgeSubscription(msg.event);

            this._subscriptions[_rsiWebSocket.id][msg.event] = this.resource.change
              .subscribe((change:ResourceUpdate) => {
                //@TODO: needs rate limit by comparing last update timestamp with last update
                logger.info("New resource data:", change);
                let elements = this.resource.getResource(/*parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit)*/);
                if(elements) {
                  let resp = elements.data.map((value:BehaviorSubject<Element>) => {
                    return value.getValue().data;
                  });

                  const params = getEventParams(msg.event);
                  const expandLevel: any = params.$expand ? params.$expand : 0;

                  resp = resp.map((x: any) =>{
                      traverse(x, expandLevel, 0);
                      return x;
                  });

                  if(! _rsiWebSocket.sendData(msg.event, resp)) this.resource.change.complete();
                }
                else {;
                  if(! _rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error("Not found"))) this.resource.change.complete();
                }
            },
            (err:any) => {
              if(! _rsiWebSocket.sendError(msg.event, StatusCode.INTERNAL_SERVER_ERROR, new Error(err))) this.resource.change.complete();
            });
          }
          else if (!eventObj.element && !this.resource.resourceSubscribable)
          {
            _rsiWebSocket.sendError(msg.event, StatusCode.NOT_IMPLEMENTED, new Error("Not Implemented"));
          }
        break;

        case "unsubscribe":
          logger.info("Unsubscription:", msg.event);
          let subscription = this._subscriptions[_rsiWebSocket.id][msg.event];
          if (subscription) {
            subscription.unsubscribe();
            _rsiWebSocket.acknowledgeUnsubscription(msg.event); //might fail, but not important at this point
          }
        break;
        case "reauthorize":
        default:
          logger.error("Unsupported command on ws://:", msg.event);
          _rsiWebSocket.sendError(msg.event, StatusCode.NOT_IMPLEMENTED, new Error("Not Implemented"));
        break;
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
const serviceGET = (service:Service) => {

  let resources:Array<any> = service.resources.map((res:Resource)=>{
    return {
      name: res.name.toLowerCase(),
      uri: BASEURI + service.name.toLowerCase() + "/" + res.name.toLowerCase() + "/"
    }
  });

  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.status(StatusCode.OK);
    res.json({
      status: "ok",
      data: resources
    });
  };
};

/**
 * handling GET requests on element level (retrieve element details).
 *
 * @param service   The service name.
 * @param resource  The resource name.
 */
const elementGET = (service:Service, resource:Resource) => {
  let elementPath = pathof(BASEURI, service, resource) + "/:id";
  if(resource.getElement) { logger.info("GET   ", elementPath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {

    if(!resource.getElement) {
      res.status(StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
      return;
    }

    // proprietary element fetching
    let element = resource.getElement(req.params.id);
    if(element){
      let data = (<BehaviorSubject<Element>>element.data).getValue().data;
      // filter the result before responding if needed
      if (req.query.hasOwnProperty("$fields")) {
        data = filterByKeys(data ,["id", "name", "uri"].concat(req.query["$fields"].split(",")));
      }

      const expandLevel: any = req.query['$expand'] ? req.query['$expand'] : 0;
      traverse(data, expandLevel, 0);

      //respond
      res.status(StatusCode.OK);
      res.json({
        status: "ok",
        data: data
      });
    }
    else {
      res.status(404).send();
    }
  };
};


/**
 * handling GET requests on resource level (element listing).
 *
 * @param service   The service name.
 * @param resource  The resource name.
 */
const resourceGET = (service:Service, resource:Resource) => {
  let resourcePath = pathof(BASEURI, service, resource);
  if(resource.getResource ) { logger.info("GET   ", resourcePath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if(!resource.getResource) {
      res.status(StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
      return;
    }
    // get all available renderes and map their representation to JSON compatible values
    function parseNumberOrId(n:string|number):string|number {
      return (typeof n === "undefined") ? undefined : ((!isNaN(parseFloat(<string>n)) && isFinite(<number>n)) ? parseFloat(<string>n) : n.toString());
    }

    let elements = resource.getResource(parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit));

    if(elements) {
      let resp = elements.data.map((value:BehaviorSubject<Element>) => {
        return value.getValue().data;
      });

      const expandLevel: any = req.query['$expand'] ? req.query['$expand'] : 0;
      resp = resp.map((x: any) => {
          traverse(x, expandLevel, 0);
          return x;
      });

      // Object ref search
      for (var propName in req.query) {
        if (req.query.hasOwnProperty(propName)) {
          if (propName.charAt(0) != '$') {
            resp = resp.filter((item) => {
              if (!item.hasOwnProperty(propName)) {
                return false;
              }
              if (typeof item[propName] === 'object') {
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
      if (req.query.hasOwnProperty('$q')) {
        resp = resp.filter((item: any) => {
          let stringValue: string = JSON.stringify(item);
          if (stringValue.indexOf(req.query['$q']) != -1) {
            return item;
          }
        });
      }

      // $fields filtering
      if (req.query.hasOwnProperty('$fields')) {
        const fieldsList: Array<string> = req.query['$fields'];
        const medatoryFields: Array<string> = ['name', 'id', 'uri'];
        resp = resp.map((item: any) => {
          let newItem: any = {};
          for (var i in item) {
            if (fieldsList.indexOf(i) != -1 || medatoryFields.indexOf(i) != -1) {
              newItem[i] = item[i];
            }
          }
          return newItem;
        });
      }

      // $sorting
      if (req.query.hasOwnProperty('$sorting')) {
        const sort: string = req.query['$sorting'];
        resp = resp.sort((a: any, b: any) => {
          if (sort.indexOf('-') === 0) {
            return b[sort] - a[sort];
          } else {
            return a[sort] - b[sort];
          }
        });
      }

      res.status(StatusCode.OK);
      res.json({
        status: "ok",
        data: resp
      });
      return;
    }
    else {
      res.status(StatusCode.NOT_FOUND).send("Not found");
    }
  };
};

/**
 * handling POST requests on resource level (elment creation).
 *
 * @param service   The service name.
 * @param resource  The resource name.
 */
const resourcePOST = (service:Service, resource:Resource) => {
  let resourcePath = pathof(BASEURI, service, resource);
  if(resource.createElement) { logger.info("POST  ", resourcePath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if(!resource.createElement) {
      res.status(StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
      return;
    }
    let newElement = resource.createElement(req.body);
    if(newElement.status === "ok") {
      res.status(StatusCode.CREATED);
      res.header({"Location": (<BehaviorSubject<Element>>newElement.data).getValue().data.uri});
      res.json({
        status: "ok"
      });
    }
    else if (newElement.status) {
        res.json(newElement);
      }
    else {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send("Internal Server Error");
    }
  };
};

/**
 * handling DELETE requests on element level (element removal or property reset).
 *
 * @param service   The service name.
 * @param resource  The resource name.
 */
const elementDELETE = (service:Service, resource:Resource) => {
  let elementPath = pathof(BASEURI, service, resource) + "/:id"
  if(resource.deleteElement) { logger.info("DELETE", elementPath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {

    if(!resource.deleteElement) {
      res.status(501).send("Not Implemented");
      return;
    }
    // proprietary element deletion
    let deletionResponse = resource.deleteElement(req.params.id);

    // respond
    if(deletionResponse.status && deletionResponse.status === "ok" || deletionResponse.status === "error") {
      res.status(deletionResponse.code || (deletionResponse.status === "ok") ? StatusCode.OK : StatusCode.INTERNAL_SERVER_ERROR);
      res.json(deletionResponse);
    }
    else {
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send("Internal Server Error");
      return;
    }
  };
};


/**
 * handling POST requests on element level (modify an existing element).
 *
 * @param service   The service name.
 * @param resource  The resource name.
 */
const elementPOST = (service:Service, resource:Resource) => {
  let elementPath = pathof(BASEURI, service, resource) + "/:id"
  if(resource.updateElement) { logger.info("POST  ", elementPath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {

    // find the element requested by the client
    let element = resource.getElement(req.params.id);
    if (element && element.status === "ok"){
      let resp = resource.updateElement(req.params.id, req.body);
      res.status(resp.code || StatusCode.OK);
      res.json({
        code: resp.code || undefined,
        status: resp.status,
        message: resp.error ? (resp.error.message || undefined) : undefined
      });
    }
    else {
      res.status(element ? element.code : StatusCode.NOT_FOUND).json({
        code: element ? element.code : StatusCode.NOT_FOUND,
        status: element ? element.status : "error",
        message: element ? element.message : "Not found."
      });
    }
  };
};


/**
 * helper for generating a route string
 *
 * @param service   The service name.
 * @param resource  The resource name.
 * @returns         The combined path use as a route.
 */
function pathof(baseUri: string, service:Service, resource:Resource) {
  return baseUri + service.name.toLowerCase() + "/" + resource.name.toLowerCase();
}


/**
 * filters an object by keys
 *
 * @param inputObject   the input object
 * @param keep          an array of strings (keys) to keep
 * @returns             the filtered object
 */
function filterByKeys(inputObject:any, keep:string[]):Object {
  if (! Array.isArray(keep) || keep.length === 0) return inputObject;
  let result:any = {};
  for (var i = 0, len = keep.length; i < len; i++) {
    let key:string = keep[i];
    if (inputObject.hasOwnProperty(key)) {
      result[key] = inputObject[key];
    }
  }
  return result;
};


/**
 * Globally retrieves an element by it`s id across all services and resources
 *
 * @param {string} id the id of the object to get
 * @returns {any} the raw data of the object
 */
function getElementById(id: string): any {
    let el: any;
    availableServices.forEach((s: any) => {
        serviceMap[s.name].resources.forEach((r: Resource) => {
            let element: any = r.getElement(id);
            if (element && element.data) {
                let data = (<BehaviorSubject<Element>>element.data).getValue().data;
                el = data;
            }
        });
    });
    return el;
}

/**
 * Traverses an element object and resolves all object references and optionally expands them.
 * @param obj the object to traverse
 * @param maxLevel maximum expand level (this can be a number for level expansion or field string for field expansion)
 * @param {number} level the current level of expansion
 */
function traverse(obj: any, maxLevel: any = Number.POSITIVE_INFINITY, level: number = 0) {
    const byLevel: boolean = /^\d+$/.test(maxLevel);
    let keywords: Array<string>;
    if (!byLevel) {
        keywords = maxLevel.split(',');
    }
    for (var property in obj) {
        if (obj.hasOwnProperty(property)) {
            if (typeof obj[property] == 'object' && !Array.isArray(obj[property])) {
                let expandNode: boolean = byLevel ? level < maxLevel : keywords.indexOf(property) != -1;
                let fullObj: any = getElementById(obj[property].id);

                if (expandNode) {
                    if (fullObj) {
                        obj[property] = fullObj;
                    }
                } else {
                    if (fullObj) {
                        obj[property] = {
                            id: obj[property].id,
                            uri: obj[property].uri
                        };
                    }

                }
                traverse(obj[property], maxLevel, level + 1);
            } else if (Array.isArray(obj[property])) {
                for (let i = 0; i < obj[property].length; i++) {
                    if (typeof obj[property][i] == 'object') {
                        let expandNode: boolean = byLevel ? level < maxLevel : keywords.indexOf(property) != -1;
                        if (expandNode) {
                            let fullObj: any = getElementById(obj[property][i].id);
                            if (fullObj) {
                                obj[property][i] = fullObj;
                            }
                        } else {
                            obj[property][i] = {
                                id: obj[property][i].id,
                                uri: obj[property][i].uri
                            };
                        }
                        traverse(obj[property][i], maxLevel, level + 1);
                    }
                }
            }
        }
    }
}

const getEventParams = (value:string)=> {
    value = value.substring(value.lastIndexOf('?'));
    const parsed = queryString.parse(value);
    return parsed;
}


export {server, run, pathof}
