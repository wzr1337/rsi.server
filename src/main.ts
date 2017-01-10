import { Observable, Observer, BehaviorSubject} from '@reactivex/rxjs';
import * as express from 'express';
import { WebServer } from "./expressapp";
import * as uuid from "uuid";
import * as fs from "fs";
import * as path from "path";

declare function require(moduleName: string): any;

const PLUGINDIR = path.join(__dirname, "plugins");


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
    console.error(err);
  }
  files.forEach(file => {
    let module = path.join(PLUGINDIR, file);
    if(fs.lstatSync(module).isDirectory()) {
      let _module = require(module);
      console.log("Loading Plugin:", file);
      console.log(new _module().name());
    }
  });
});



const URIREGEX = /^\/(\w+)\/(\w+)\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fAF]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?#?\w*\??([\w$=&\(\)\:\,\;\-\+]*)?$/; //Group1: Servicename, Group2: Resourcename, Group3: element id, Group4: queryparameter list



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

server.app.get('/media/renderers/?:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // find the element requested by the client
  let element = renderers.find((element:BehaviorSubject<{}>) => {
    return (<{id:string}>element.getValue()).id === rendererId;
  });

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
});

var interval:NodeJS.Timer; //@TODO has to become per-renderer
server.app.post('/media/renderers/?:id', (req: express.Request, res: express.Response, next: express.NextFunction) => {

  // find the element requested by the client
  let element = renderers.find((element:BehaviorSubject<{}>) => {
    return (<{id:string}>element.getValue()).id === rendererId;
  });

  if(element){
    let renderer:any = element.getValue();

    if (req.body.hasOwnProperty("state")) {
      renderer.state = req.body.state;
      if (req.body.state === "play") {
        const speed = 1000;
        interval = setInterval(() => {
          renderer.offset = renderer.hasOwnProperty("offset") ? renderer.offset + speed : 0;
          element.next(renderer);
        }, speed);
      }
      else {
        clearInterval(interval);
      }
    }

    element.next(renderer); // @TODO: check diffs bevor updating without a need 
    res.status(200);
    res.json({
      status: "ok",
      data: renderers[0].getValue()
    });
  }
  else {
    res.status(404).send();
  }
});

server.app.get('/media/renderers/', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  
  // get all available renderes and map their representation to JSON compatible values
  let resp = renderers.map((value) => {
    return value.getValue();
  });
  
  res.status(200);
  res.json({
    status: "ok",
    data: resp
  });
});



/*var subscribers:{
  [ws: WebSocket]: BehaviorSubject<{}>
} = {};*/


class Media {
  /**
   * Renderer specific element retrieval
   * 
   */
  static getElement(collection, elementId) {
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



// register an Object
var subscription = renderers[0].subscribe(
  (x:any) => {
    console.log('Next: ' + JSON.stringify(x));
  },
  (err:any) => {
    console.log('Error: ' + err);
  },
  () => {
    console.log('Completed');
  });

