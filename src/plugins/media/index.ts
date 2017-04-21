import { BehaviorSubject, Subject } from '@reactivex/rxjs';
import * as uuid from "uuid";
import { viwiLogger } from "../../log";
import * as stupid from 'stupid-player'; // a cross platform media player

import { Service, Resource, Element, ResourceUpdate, StatusCode, ElementResponse, CollectionResponse } from "../viwiPlugin";
import { RendererObject, CollectionObject, ItemObject } from "./schema";

class Media extends Service {
  constructor() {
    super();
    this.id = "f9a1073f-e90c-4c56-8368-f4c6bd1d8c96"; //random id
    this.resources.push(new Renderers(this));
    this.resources.push(new Collections(this));
  }
}

interface RendererElement extends Element {
  data: RendererObject;
  player?: any
}

class Renderers implements Resource {

  static netfluxRendererId = "d6ebfd90-d2c1-11e6-9376-df943f51f0d8";//uuid.v1();  // FIXED for now
  static stdpRendererId = "deadbeef-d2c1-11e6-9376-beefdead";//uuid.v1();  // FIXED for now

  private _name:string;
  private _renderers:BehaviorSubject<RendererElement>[] = [];
  private _change:BehaviorSubject<ResourceUpdate>;

  private _logger = viwiLogger.getInstance().getLogger("media");

  constructor(private service:Service) {

    //const collections = service.resources.map<Collections>(resource => resource.name === "collections");
    //const initialCollection = collections.map( element => element.name === "default");
    let netfluxRenderer = new BehaviorSubject<RendererElement>({
      lastUpdate: Date.now(),
      propertiesChanged: [],
      data: {
        uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + Renderers.netfluxRendererId,
        id: Renderers.netfluxRendererId,
        name: "Netflux",
        state: "idle",
        shuffle: "off",
        repeat: "off",
        offset: 0,
        media: "initialCollection"
      }
    });
    this._renderers.push(netfluxRenderer);

    ///add an actual renderer for playback
    let stpdId = Renderers.stdpRendererId;
    let stpdRenderer = new BehaviorSubject<RendererElement>({
      lastUpdate: Date.now(),
      propertiesChanged: [],
      player: new stupid(),
      data: {
        uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + stpdId,
        id: stpdId,
        name: "stpd",
        state: "idle",
        shuffle: "off",
        repeat: "off",
        offset: 0,
        media: []
      }
    });
    this._renderers.push(stpdRenderer);
    
    this._change = new BehaviorSubject(<ResourceUpdate>{lastUpdate: Date.now(), action: 'init'});
  }

  get name():string {
    return this.constructor.name;
  };

  get elementSubscribable():Boolean {
    return true;
  };

  get change():BehaviorSubject<ResourceUpdate> {
    return this._change;
  }

  getElement(elementId:string):ElementResponse {
    // find the element requested by the client
    return {
      status: "ok",
      data: this._renderers.find((element:BehaviorSubject<RendererElement>) => {
      return (<{id:string}>element.getValue().data).id === elementId;
    })
    };
  };

  getResource(offset?:string|number, limit?:string|number):CollectionResponse{
    // retriev all element
    let resp:BehaviorSubject<RendererElement>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._renderers.slice(<number>offset, <number>limit);
    }

    return {status: "ok", data: resp};
  };


  private _interval:NodeJS.Timer; //@TODO has to become per-renderer
  private _playerInterval:NodeJS.Timer;//@TODO has to become per-renderer

  updateElement(elementId:string, difference:any):ElementResponse {
    let element = (<BehaviorSubject<RendererElement>> this.getElement(elementId).data);
    var renderer:RendererObject = element.getValue().data;
    let propertiesChanged:string[]=[];

    if (difference.hasOwnProperty("state")) {
      renderer.state = difference.state;
      if (difference.state === "play") {
        if (renderer.id === Renderers.netfluxRendererId)
        {
          const speed = 1000;
          this._interval = setInterval(() => {
            renderer.offset = renderer.hasOwnProperty("offset") ? renderer.offset + speed : 0;
            element.next(
              {
                lastUpdate: Date.now(),
                propertiesChanged: ["offset"],
                data: renderer
              });
          }, speed);
        } else if(renderer.name === "stpd" && element.getValue().player) {
          let path = require("path");
          let player = element.getValue().player; //might be undefinied, be aware


          var onPlay = ()=> {
            this._playerInterval = setInterval(() => { //@TODO: rather listen to player events..
              renderer.offset = player.getOffset();
              if(player.state) {
                element.next({
                  lastUpdate: Date.now(),
                  propertiesChanged: ["offset"],
                  data: renderer,
                  player: player
                });
              }
            }, 250);
          };

          var onPlayError = (err:Error)=>{
            console.log("Player.play():", err.message);
          };

          switch (player.state) {
            case "paus":
              player.resume().then(onPlay, onPlayError);
              break;
            case "stop":
              player.play(path.join(__dirname, '../../../samples/dimitriVegas.mp3')).then(onPlay, onPlayError);
              break;
            default:
              return {status: "error", code: 500, error: new Error("unknown player state:" + player.state)}
          }
        }
      }
      else {
        switch (renderer.id) {
          case Renderers.netfluxRendererId:
             clearInterval(this._interval);
            break;
          case Renderers.stdpRendererId:
            let player = element.getValue().player; //might be undefinied, be aware
            console.log(player);
            switch (difference.state) {
              case "pause":
                if(player.state === "play") {
                  player.pause();
                  clearInterval(this._playerInterval); //@TODO: rather listen to player events..
                } else {
                  return {status: "error", error: new Error("Renderer not playing"), code: 500};
                }
                break;
              case "stop":
                if(player.state === "play") {
                  player.stop();
                  clearInterval(this._playerInterval); //@TODO: rather listen to player events..
                } else {
                  return {status: "error", error: new Error("Renderer not playing"), code: 500};
                }
                break;
              default:
                return {status: "error", error: new Error("Renderer state not supported"), code: 400};
            }
            break;
          default:
            return {status: "error", error: new Error("Renderer not found"), code: 404};
        }
      }
      propertiesChanged.push("state");
    }
    if (difference.hasOwnProperty("shuffle")) {
      if (-1 !== ["off", "on"].indexOf(difference.shuffle)) {
        renderer.shuffle = difference.shuffle;
        propertiesChanged.push("shuffle");
      }
    }
    if (difference.hasOwnProperty("repeat")) {
      if (-1 !== ["off", "one", "all"].indexOf(difference.repeat)) {
        renderer.repeat = difference.repeat;
        propertiesChanged.push("repeat");
      }
    }
    let resp = {
      lastUpdate: Date.now(),
      propertiesChanged: propertiesChanged,
      data: renderer
    };
    element.next(resp); // @TODO: check diffs bevor updating without a need
    return {status: "ok"};
  }
}


interface CollectionElement extends Element {
  data: CollectionObject
}

class Collections implements Resource {
  private _collections:BehaviorSubject<CollectionElement>[] = [];
  private _change:BehaviorSubject<ResourceUpdate>;

  constructor(private service:Service) {

    const collectionId = "deadbeef-d2c1-11e6-9376-df943f51f0d8";
    let initialCollection = new BehaviorSubject<CollectionElement>(
      {
        lastUpdate: Date.now(),
        propertiesChanged: [],
        data: {
        uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + collectionId,
        id: collectionId,
        name: "default",
        items: []
      }
    });
    this._collections.push(initialCollection);
    this._change = new BehaviorSubject(<ResourceUpdate>{lastUpdate: Date.now(), action: 'init'});

  }

  get name():string {
      return this.constructor.name;
  };

  get elementSubscribable():Boolean {
    return true;
  };

  get resourceSubscribable():Boolean {
    return true;
  };

  get change():BehaviorSubject<ResourceUpdate> {
    return this._change;
  }

  getElement(elementId:string):ElementResponse {
    // find the element requested by the client
    return {
      status: "ok",
      data: this._collections.find((element:BehaviorSubject<CollectionElement>) => {
      return (<{id:string}>element.getValue().data).id === elementId;
    })};
  };

  createElement(state:{name:string}):ElementResponse{
    if (!state.name) return {
      status: "error",
      code: StatusCode.INTERNAL_SERVER_ERROR
    };
    const collectionId = uuid.v1();
    let initialCollection = new BehaviorSubject<CollectionElement>(
      {
        lastUpdate: Date.now(),
        propertiesChanged: [],
        data: {
        uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + collectionId,
        id: collectionId,
        name: state.name,
        items: []
      }
    });
    this._collections.push(initialCollection);
    this._change.next({lastUpdate: Date.now(), action: "add"});
    return {status:"ok", data: initialCollection};
  };


  deleteElement(elementId:string):ElementResponse {
    let idx = this._collections.findIndex((element:BehaviorSubject<CollectionElement>, index:number) => {
      return  (<{id:string}>element.getValue().data).id === elementId;
    });
    if (-1 !== idx) {
      this._collections.splice(idx, 1); //remove one item from the collections array
      return {status: "ok"};
    }
    return {status: "error", code: 404, message: "Element can not be found"};
  } 

  getResource(offset?:string|number, limit?:string|number):CollectionResponse {
    // retriev all element
    let resp:BehaviorSubject<CollectionElement>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._collections.slice(<number>offset, <number>limit);
    }

    return {status: "ok", data: resp};
  };
}

export {Media as Service, Renderers, Collections};