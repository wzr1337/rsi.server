import { BehaviorSubject, Subject } from '@reactivex/rxjs';
import * as uuid from "uuid";

import { Service, Resource, Element, ResourceUpdate, Status } from "../viwiPlugin";
import { RendererObject, CollectionObject, ItemObject } from "./schema";

class Media implements Service {
  private _resources:Resource[]=[];
  private _id:string;

  constructor() {
    this._id = "f9a1073f-e90c-4c56-8368-f4c6bd1d8c96"; //random id
    this._resources.push(new Renderers(this));
    this._resources.push(new Collections(this));
  }

  get name() {
      return this.constructor.name;
  }

  get id() {
      return this._id;
  }

  get resources() {
    return this._resources;
  }
}

interface RendererElement extends Element {
  data: RendererObject
}

class Renderers implements Resource {
  private _name:string;
  private _renderers:BehaviorSubject<RendererElement>[] = [];
  private _change:BehaviorSubject<ResourceUpdate>;

  constructor(private service:Service) {

    const rendererId = "d6ebfd90-d2c1-11e6-9376-df943f51f0d8";//uuid.v1();  // FIXED for now
    //const collections = service.resources.map<Collections>(resource => resource.name === "collections");
    //const initialCollection = collections.map( element => element.name === "default");
    let netfluxRenderer = new BehaviorSubject<RendererElement>({
      lastUpdate: Date.now(),
      propertiesChanged: [],
      data: {
        uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + rendererId,
        id: rendererId,
        name: "Netflux",
        state: "idle",
        offset: 0,
        media: "initialCollection"
      }
    });
    this._renderers.push(netfluxRenderer);
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

  getElement(elementId:string):BehaviorSubject<RendererElement> {
    // find the element requested by the client
    return this._renderers.find((element:BehaviorSubject<RendererElement>) => {
      return (<{id:string}>element.getValue().data).id === elementId;
    });
  };

  getResource(offset?:string|number, limit?:string|number):BehaviorSubject<RendererElement>[]{
    // retriev all element
    let resp:BehaviorSubject<RendererElement>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._renderers.slice(<number>offset, <number>limit);
    }

    return resp;
  };


  private _interval:NodeJS.Timer; //@TODO has to become per-renderer
  updateElement(elementId:string, difference:any):Boolean {
    let element = this.getElement(elementId);
    let renderer:RendererObject = element.getValue().data;
      if (difference.hasOwnProperty("state")) {
        renderer.state = difference.state;
        if (difference.state === "play") {
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
        }
        else {
          clearInterval(this._interval);
        }
        element.next({
                lastUpdate: Date.now(),
                propertiesChanged: ["state"],
                data: renderer
              }); // @TODO: check diffs bevor updating without a need
      }
      else {
        return false;
      }
    return true;
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

  getElement(elementId:string):BehaviorSubject<CollectionElement> {
    // find the element requested by the client
    return this._collections.find((element:BehaviorSubject<CollectionElement>) => {
      return (<{id:string}>element.getValue().data).id === elementId;
    });
  };

  createElement(state:{name:string}):Element|Status {
    if (!state.name) return Status.INTERNAL_SERVER_ERROR;
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
    return initialCollection.getValue();
  };


  deleteElement(elementId:string):boolean {
    let idx = this._collections.findIndex((element:BehaviorSubject<CollectionElement>, index:number) => {
      return  (<{id:string}>element.getValue().data).id === elementId;
    });
    console.log("index", idx);
    if (-1 !== idx) {
      this._collections.splice(idx, 1); //remove one item from the collections array
      return true;
    }
    return false;
  } 

  getResource(offset?:string|number, limit?:string|number):BehaviorSubject<CollectionElement>[]{
    // retriev all element
    let resp:BehaviorSubject<CollectionElement>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._collections.slice(<number>offset, <number>limit);
    }

    return resp;
  };
}

export {Media as Service, Renderers, Collections};