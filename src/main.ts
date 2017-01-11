import { BehaviorSubject} from '@reactivex/rxjs';
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
        server.app.post(basePath, resourcePOST(service, resource));              //CREATE
        server.app.post(basePath + ':id', elementPOST(service, resource));      //READ
        server.app.get(basePath + ':id', elementGET(service, resource));        //UPDATE
        server.app.delete(basePath + ':id', elementDELETE(service, resource));  //DELETE
      });
    }
  });
});

const elementGET = (service:Service, resource:Resource) => {
  let elementPath = pathof(service, resource) + "/:id"
  console.log("GET", elementPath, "registered");
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
    console.log(req.params);
    // get all available renderes and map their representation to JSON compatible values
    function parseNumberOrId(n:string|number):string|number {
      return (!isNaN(parseFloat(<string>n)) && isFinite(<number>n)) ? parseFloat(<string>n) : n.toString();
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

function pathof(service:Service, resource:Resource) {
  return BASEURI + service.name.toLowerCase() + "/" + resource.name.toLowerCase();
}

/// TO BE REMOVED
const rendererId = "d6ebfd90-d2c1-11e6-9376-df943f51f0d8";//uuid.v1();  // FIXED for now

var renderers = [
  new BehaviorSubject<{}>({
    uri: "/media/renderers/" + rendererId,
    id: rendererId,
    name: "Netflux",
    state: "idle",
    offset: 0
  })
]
/// TO BE REMOVED


/*var subscribers:{
  [ws: WebSocket]: BehaviorSubject<{}>
} = {};*/


class Media {
  /**
   * Renderer specific element retrieval
   * 
   */
  static getElement(collection:any, elementId:string) {
    return collection.find((element:BehaviorSubject<{}>) => {
      return (<{id:string}>element.getValue()).id === elementId;
  });
  }
}

/**
 * WebSocket stuff
 */
server.ws.on('connection', (ws) => {
  ws.on("message", (message:string) => {
    let msg = JSON.parse(message);
    switch (msg.type) {
      case "subscribe":
        let captureGroups = msg.event.match(URIREGEX);
        if (captureGroups) {
          if (captureGroups[3]) {
            // this is an element subscription
            // === Service sepcific callback goes here ======
            let element = Media.getElement(renderers, rendererId);
            // ==============================================

            element.subscribe( //@TODO keep per client reference for unsubscription etc.
              (data:any) => {
                ws.send(JSON.stringify({type: "data", status: "ok", event: msg.event, data: data}));
              },
              (err:any) => {
                ws.send(JSON.stringify({type: "error", code: "500", data: err}));
              });
            ws.send(JSON.stringify({type: "subscribe", status: "ok", event: msg.event}));
            ws.send(JSON.stringify({type: "data", status: "ok", event: msg.event, data: element.getValue()}));
          }
          else {
            // resource subscription
            ws.send(JSON.stringify({type: "error", code: "501", data: "Not Implemented"}));
          }
        } 
        else { 
          ws.send(JSON.stringify({type: "error", code: "404", data:"Not Found"}));
        }
        break;

      case "unsubscribe":
      case "reauthorize":
      default:
         ws.send(JSON.stringify({type: "error", code: "501", data: "Not Implemented"}));
        break;
    }

  })
});