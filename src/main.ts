import { BehaviorSubject, Subject} from '@reactivex/rxjs';
import * as express from 'express';
import { WebServer } from "./expressapp";
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
    let module = path.join(PLUGINDIR, file);
    if(fs.lstatSync(module).isDirectory()) {
      let _module = require(module);
      let service:Service = new _module();
      console.log("Loading Plugin:", service.name);
      service.resources.map((resource:Resource) => {
        let basePath = "/" + service.name.toLowerCase() + "/" + resource.name.toLowerCase() + "/";
        console.log("Registering endpoint:", service.name);
        server.app.get(basePath, resourceGET(service, resource));               //READ
        server.app.post(basePath, resourcePOST(service, resource));             //CREATE
        server.app.post(basePath + ':id', elementPOST(service, resource));      //READ
        server.app.get(basePath + ':id', elementGET(service, resource));        //UPDATE
        server.app.delete(basePath + ':id', elementDELETE(service, resource));  //DELETE
        server.ws.on('connection', (ws:any) => {
          ws.on("message", handleWebSocketMessages(service, resource, ws));
        });
      });
    }
  });
});

const elementGET = (service:Service, resource:Resource) => {
  let elementPath = pathof(service, resource) + "/:id"
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

const resourceGET = (service:Service, resource:Resource) => {
  let resourcePath = pathof(service, resource);
  console.log("GET", resourcePath, "registered");
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

const resourcePOST = (service:Service, resource:Resource) => {
  let resourcePath = pathof(service, resource);
  console.log("POST", resourcePath, "registered");
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if(!resource.createElement) {
      res.status(501).send("Not Implemented");
      return;
    }
  };
};

const elementDELETE = (service:Service, resource:Resource) => {
  let elementPath = pathof(service, resource) + "/:id"
  console.log("DELETE", elementPath, "registered");
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

const elementPOST = (service:Service, resource:Resource) => {
  let elementPath = pathof(service, resource) + "/:id"
  console.log("POST", elementPath, "registered");
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
 * 
 */
function handleWebSocketMessages(service:Service, resource:Resource, ws:WebSocket) {
 return (message:string) => {
    let msg = JSON.parse(message);
    switch (msg.type) {
      case "subscribe":
        console.log("New subscription:", msg.event);
        let captureGroups = msg.event.match(URIREGEX);
        if (captureGroups && (service.name === captureGroups[1] || "$") && (resource.name === captureGroups[2] || "$")) {
          if (resource.elementSubscribable) {
            let elementId = captureGroups[3];
            if (elementId) {
              // this is an element subscription

              let element = resource.getElement(elementId);

              if (element) {
                element.takeUntil(unsubscriptions.map(topic => {topic === msg.event}))
                .subscribe(
                (data:any) => {
                  //@TODO client receives data before subscribe acknowledgement
                  ws.send(JSON.stringify({type: "data", status: "ok", event: msg.event, data: data}));
                },
                (err:any) => {
                  ws.send(JSON.stringify({type: "error", code: "500", data: err}));
                });
                ws.send(JSON.stringify({type: "subscribe", status: "ok", event: msg.event}));
              }
              else { 
                ws.send(JSON.stringify({type: "error", code: "404", data:"Not Found"}));
              }
            }
            else if (resource.elementSubscribable) {
              // resource subscription
              ws.send(JSON.stringify({type: "error", code: "501", data: "Not Implemented"}));
            }
          }
          else {
            ws.send(JSON.stringify({type: "error", code: "400", data: "Bad subscription"}));
          }
        }
        break;

      case "unsubscribe":
        console.log("Unsubscription:", msg.event);
        unsubscriptions.next(msg.event);
        ws.send(JSON.stringify({type: "unsubscribe", status: "ok", event: msg.event}));
      break;
      case "reauthorize":
      default:
        ws.send(JSON.stringify({type: "error", code: "501", data: "Not Implemented"}));
        break;
    }
  };
};

function pathof(service:Service, resource:Resource) {
  return BASEURI + service.name.toLowerCase() + "/" + resource.name.toLowerCase();
}