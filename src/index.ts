import { BehaviorSubject, Subject} from '@reactivex/rxjs';
import * as express from 'express';
import { WebServer } from "./expressapp";
import { viwiWebSocket } from './viwiWebSocket';
import { viwiClientWebSocketMessage } from "./types";
import * as uuid from "uuid";
import * as fs from "fs";
import * as path from "path";
import { Service, Resource, Element, ResourceUpdate, StatusCode } from "./plugins/viwiPlugin";
import { viwiLogger } from "./log";
import { splitEvent } from "./helpers";

declare function require(moduleName: string): any;

// constants
const PLUGINDIR = path.join(__dirname, "plugins");
const BASEURI = "/";

// globals
var availableServices:{id:string;name:string;uri:string}[] = [];
var server:WebServer;
const logger = viwiLogger.getInstance().getLogger("general");

/**
 * options to run the server
 */
export interface runOptions {
  port?:number,
  verbosity?:'silly'|'debug'|'verbose'|'info'|'warn'|'error'
}

/**
 * runs a viwi server 
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
      res.status(200);
      res.json({
        status: "ok",
        data: availableServices
      });
    });

    var wsMapping:{[path:string]: wsHandler} = {};

    /**
     * Plugin loader
     * 
     * browses the PLUGINDIR for available plugins and registers them with the viwi sevrer 
     */
    fs.readdir(path.join(__dirname, "plugins"), (err:NodeJS.ErrnoException, files: string[]) => {
      if(err) {
        throw err;
      }

      files.forEach(file => {
        let plugin = path.join(PLUGINDIR, file);
        if(fs.lstatSync(plugin).isDirectory()) {
          let _plugin = require(plugin);
          let service:Service = new _plugin.Service();
          availableServices.push({
            id: service.id,
            name: service.name,
            uri: BASEURI + service.name.toLowerCase() + "/"
          });
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
        var _viwiWebSocket = new viwiWebSocket(ws);
        ws.on("close", () => {
          for (let prop in wsMapping) {
            wsMapping[prop].unsubscribeWebSocket(_viwiWebSocket);
          }
        });

        ws.on("message", (message:string) => {
          let msg:viwiClientWebSocketMessage;
          // make sure we actually parse the incomming message
          try {
            msg = JSON.parse(message);
          }
          catch(err) {
            _viwiWebSocket.sendError(msg.event, 400, new Error(err));
            return;
          }
          let event = splitEvent(msg.event);
          let basePath = BASEURI + event.service + "/" + event.resource + "/";
          if(wsMapping[basePath] && wsMapping[basePath].isHandlingEvent(msg.event))
          {
            wsMapping[basePath].handleWebSocketMessages(msg, _viwiWebSocket);
          }
          else {
            _viwiWebSocket.sendError(msg.event, 403, new Error("Not Found"));
          }
        });
      });
      resolve();
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
   * @param _viwiWebSocket  The WebSocket to be unsubscribed.
   */
  unsubscribeWebSocket = (_viwiWebSocket:viwiWebSocket) => {
    if (this._subscriptions[_viwiWebSocket.id]) {
      let subscriptions:any = this._subscriptions[_viwiWebSocket.id];
      for (let prop in subscriptions) {
        subscriptions[prop].unsubscribe();
      }
      delete this._subscriptions[_viwiWebSocket.id];
    }
  };

  /**
   * handling incoming websocket messages
   * 
   * @param service   The service name.
   * @param resource  The resource name.
   * @param ws        The WebSocket the client is sending data on.
   */
  handleWebSocketMessages = (msg:viwiClientWebSocketMessage, _viwiWebSocket:viwiWebSocket) => {
      var eventObj = splitEvent(msg.event);

      this._subscriptions[_viwiWebSocket.id] = this._subscriptions[_viwiWebSocket.id] || {}; // init if not yet initialized

      if (!eventObj.service || !eventObj.resource) {
        _viwiWebSocket.sendError(msg.event, 400, new Error("event url malformed"));
        return;
      }

      switch (msg.type) {
        case "subscribe":
          // check if  processing needed at all
          if (eventObj.element && this.resource.elementSubscribable) {
              // this is an element subscription
              let element = this.resource.getElement(eventObj.element);
              let subject:BehaviorSubject<Element> = <BehaviorSubject<Element>>element.data;
              if (element) {
                logger.debug("New element level subscription:", msg.event);
                _viwiWebSocket.acknowledgeSubscription(msg.event);

                this._subscriptions[_viwiWebSocket.id][msg.event] = subject
                  .subscribe((data:Element) => {
                    if (! _viwiWebSocket.sendData(msg.event, data.data)) subject.complete();
                    },
                    (err:any) => {
                      if (! _viwiWebSocket.sendError(msg.event, 500, new Error(err))) subject.complete();
                    });
              }
              else {
                if (! _viwiWebSocket.sendError(msg.event, 404, new Error("Not Found"))) subject.complete();
              }
          }
          else if (eventObj.element && !this.resource.elementSubscribable)
          {
            _viwiWebSocket.sendError(msg.event, 503, new Error("Not Implemented"));
          }
          if (!eventObj.element && this.resource.resourceSubscribable) {
            // resource subscription
            logger.info("New resource level subscription:", msg.event);
            _viwiWebSocket.acknowledgeSubscription(msg.event);

            this._subscriptions[_viwiWebSocket.id][msg.event] = this.resource.change
              .subscribe((change:ResourceUpdate) => {
                //@TODO: needs rate limit by comparing last update timestamp with last update
                logger.info("New resource data:", change);
                let elements = this.resource.getResource(/*parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit)*/);
                if(elements) {
                  let resp = elements.data.map((value:BehaviorSubject<Element>) => {
                    return value.getValue().data;
                  });
                  if(! _viwiWebSocket.sendData(msg.event, resp)) this.resource.change.complete();
                }
                else {;
                  if(! _viwiWebSocket.sendError(msg.event, 404, new Error("Not found"))) this.resource.change.complete();
                }
            },
            (err:any) => {
              if(! _viwiWebSocket.sendError(msg.event, 500, new Error(err))) this.resource.change.complete();
            });
          }
          else if (!eventObj.element && !this.resource.resourceSubscribable)
          {
            _viwiWebSocket.sendError(msg.event, 501, new Error("Not Implemented"));
          }
        break;

        case "unsubscribe":
          logger.info("Unsubscription:", msg.event);
          this._subscriptions[_viwiWebSocket.id][msg.event].unsubscribe();
          _viwiWebSocket.acknowledgeUnsubscription(msg.event); //might fail, but not important at this point
        break;
        case "reauthorize":
        default:
          logger.error("Unsupported command on ws://:", msg.event);
          _viwiWebSocket.sendError(msg.event, 501, new Error("Not Implemented"));
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
    res.status(200);
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
      res.status(501).send("Not Implemented");
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
      //respond
      res.status(200);
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
      res.status(501).send("Not Implemented");
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
      res.status(200);
      res.json({
        status: "ok",
        data: resp
      });
      return;
    }
    else {
      res.status(404).send("Not found");
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
      res.status(201);
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
      res.status(deletionResponse.code || (deletionResponse.status === "ok") ? 200: 500);
      res.json(deletionResponse);
    }
    else {
      res.status(500).send("Internal Server Error");
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
    if (element){
      if(resource.updateElement(req.params.id, req.body)) {
        res.status(200);
        res.json({
          status: "ok"
        });
      }
      else {
        res.status(500).send();
      }
    }
    else {
      res.status(404).send("Not Found");
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

export {server, run, pathof}
