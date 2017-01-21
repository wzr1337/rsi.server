import { BehaviorSubject, Subject} from '@reactivex/rxjs';
import * as express from 'express';
import { WebServer, viwiWebSocket } from "./expressapp";
import { viwiClientWebSocketMessage } from "./types";
import * as uuid from "uuid";
import * as fs from "fs";
import * as path from "path";
import { Service, Resource } from "./plugins/viwiPlugin";

declare function require(moduleName: string): any;

const PLUGINDIR = path.join(__dirname, "plugins");
const URIREGEX = /^\/(\w+)\/(\w+)\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fAF]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?#?\w*\??([\w$=&\(\)\:\,\;\-\+]*)?$/; //Group1: Servicename, Group2: Resourcename, Group3: element id, Group4: queryparameter list
const BASEURI = "/";

var unsubscriptions:Subject<string> = new Subject();

// set up the server
var server = new WebServer();
server.init(); // need to init


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
      let service:Service = new _plugin();
      console.log("Loading Plugin:", service.name);
      service.resources.map((resource:Resource) => {
        let basePath = "/" + service.name.toLowerCase() + "/" + resource.name.toLowerCase() + "/";
        server.app.get(basePath, resourceGET(service, resource));               //READ
        server.app.post(basePath, resourcePOST(service, resource));             //CREATE
        server.app.post(basePath + ':id', elementPOST(service, resource));      //READ
        server.app.get(basePath + ':id', elementGET(service, resource));        //UPDATE
        server.app.delete(basePath + ':id', elementDELETE(service, resource));  //DELETE
        server.ws.on('connection', (ws:any) => {                                //subscribe
          ws.on("message", handleWebSocketMessages(service, resource, ws));
        });
      });
    }
  });
});


/**
 * handling GET requests on element level (retrieve element details).
 * 
 * @param service   The service name.
 * @param resource  The resource name.
 */
const elementGET = (service:Service, resource:Resource) => {
  let elementPath = pathof(service, resource) + "/:id";
  if(resource.getElement) { console.log("GET   ", elementPath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {

    if(!resource.getElement) {
      res.status(501).send("Not Implemented");
      return;
    }

    // proprietary element fetching
    let element = resource.getElement(req.params.id);

    // respond
    if(element){
      res.status(200);
      res.json({
        status: "ok",
        data: element.getValue()
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
  let resourcePath = pathof(service, resource);
  if(resource.getResource ) { console.log("GET   ", resourcePath, "registered") };
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
      let resp = elements.map((value) => {
        return value.getValue();
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
  let resourcePath = pathof(service, resource);
  if(resource.createElement) { console.log("POST  ", resourcePath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if(!resource.createElement) {
      res.status(501).send("Not Implemented");
      return;
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
  let elementPath = pathof(service, resource) + "/:id"
  if(resource.deleteElement) { console.log("DELETE", elementPath, "registered") };
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {

    if(!resource.deleteElement) {
      res.status(501).send("Not Implemented");
      return;
    }
    // proprietary element deletion
    let succeeded = resource.deleteElement(req.params.id);

    // respond
    if(succeeded){
      res.status(200);
      res.json({
        status: "ok"
      });
      return;
    }
    else {
      res.status(500).send();
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
  let elementPath = pathof(service, resource) + "/:id"
  if(resource.updateElement) { console.log("POST  ", elementPath, "registered") };
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
 * handling incoming websocket messages
 * 
 * @param service   The service name.
 * @param resource  The resource name.
 * @param ws        The WebSocket the client is sending data on.
 */
const handleWebSocketMessages = (service:Service, resource:Resource, ws:WebSocket) => {
  var _viwiWebSocket = new viwiWebSocket(ws);
  return (message:string) => {
    let msg:viwiClientWebSocketMessage;
    // make sure we actually parse the incomming message
    try {
      msg = JSON.parse(message);
    }
    catch(err) {
      _viwiWebSocket.error(400, new Error(err));
      return;
    }
    switch (msg.type) {
      case "subscribe":
        let captureGroups = msg.event.match(URIREGEX);
        if (captureGroups && (service.name.toLowerCase() === captureGroups[1].toLowerCase()) && (resource.name.toLowerCase() === captureGroups[2].toLowerCase())) {
          if (resource.elementSubscribable) {
            let elementId = captureGroups[3];
            if (elementId) {
              // this is an element subscription
              let element = resource.getElement(elementId);
              if (element) {
                console.log("New subscription:", msg.event);
                _viwiWebSocket.subscribeAck(msg.event);
                element.takeUntil(unsubscriptions.map(topic => {topic === msg.event}))
                .subscribe(
                (data:any) => {
                  _viwiWebSocket.data(msg.event, data);
                },
                (err:any) => {
                  _viwiWebSocket.error(500, new Error(err));
                });
              }
              else {
                _viwiWebSocket.error(404, new Error("Not Found"));
              }
            }
            else if (resource.elementSubscribable) {
              // resource subscription
              _viwiWebSocket.error(501, new Error("Not Implemented"));
            }
          }
          else {
            _viwiWebSocket.error(400, new Error("Bad subscription"));
          }
        }
        break;

      case "unsubscribe":
        console.log("Unsubscription:", msg.event);
        unsubscriptions.next(msg.event);
        _viwiWebSocket.unsubscribeAck(msg.event);
      break;
      case "reauthorize":
      default:
        _viwiWebSocket.error(501,new Error("Not Implemented"));
        break;
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
function pathof(service:Service, resource:Resource) {
  return BASEURI + service.name.toLowerCase() + "/" + resource.name.toLowerCase();
}