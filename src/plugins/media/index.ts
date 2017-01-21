import { BehaviorSubject, Subject } from '@reactivex/rxjs';
import { Service, Resource } from "../viwiPlugin";

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

interface RendererObject {
  id: string;
  name: string;
  uri: string;
  media?: Object;
  currentMediaItem?: Object;
  offset?: number;
  scan?: "off"|"up"|"down";
  state?: "idle"|"play"|"pause"|"stop"|"ff"|"fr";
  repeat?: "off"|"repeatall"|"repeatone";
  shuffle?: "on"|"off";
  type?: "track"|"video"|"image";
}

class Renderers implements Resource {
  private _name:string;
  private _renderers:BehaviorSubject<{}>[] = [];
  private _change:Subject<string> = new Subject();

  constructor(private service:Service) {

    const rendererId = "d6ebfd90-d2c1-11e6-9376-df943f51f0d8";//uuid.v1();  // FIXED for now
    //const collections = service.resources.map<Collections>(resource => resource.name === "collections");
    //const initialCollection = collections.map( element => element.name === "default");
    let netfluxRenderer = new BehaviorSubject<RendererObject>({
        uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + rendererId,
        id: rendererId,
        name: "Netflux",
        state: "idle",
        offset: 0,
        media: "initialCollection"
      });
    this._renderers.push(netfluxRenderer);
    this._change.next("add");
  }

  get name():string {
      return this.constructor.name;
  };

  get elementSubscribable():Boolean {
    return true;
  };

  get change():Subject<string> {
    return this._change;
  }

  getElement(elementId:string):BehaviorSubject<{}> {
    // find the element requested by the client
    return this._renderers.find((element:BehaviorSubject<{}>) => {
      return (<{id:string}>element.getValue()).id === elementId;
    });
  };

  getResource(offset?:string|number, limit?:string|number):BehaviorSubject<{}>[]{
    // retriev all element
    let resp:BehaviorSubject<{}>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._renderers.slice(<number>offset, <number>limit);
    }

    return resp;
  };


  private _interval:NodeJS.Timer; //@TODO has to become per-renderer
  updateElement(elementId:string, difference:any):Boolean {
    let element = this.getElement(elementId);
    let renderer:any = element.getValue();
      if (difference.hasOwnProperty("state")) {
        renderer.state = difference.state;
        if (difference.state === "play") {
          const speed = 1000;
          this._interval = setInterval(() => {
            renderer.offset = renderer.hasOwnProperty("offset") ? renderer.offset + speed : 0;
            element.next(renderer);
          }, speed);
        }
        else {
          clearInterval(this._interval);
        }
        element.next(renderer); // @TODO: check diffs bevor updating without a need
      }
      else {
        return false;
      }
    return true;
  }
}


interface CollectionObject {
  id: string;
  name: string;
  uri: string;
  items?: Object[];
}
class Collections implements Resource {
  private _collections:BehaviorSubject<{}>[] = [];
  private _change:Subject<string> = new Subject();

  constructor(private service:Service) {

    const rendererId = "deadbeef-d2c1-11e6-9376-df943f51f0d8";//uuid.v1();  // FIXED for now
    let initialCollection = new BehaviorSubject<CollectionObject>({
        uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + rendererId,
        id: rendererId,
        name: "default",
        items: []
      });
    this._collections.push(initialCollection);
    this._change.next("add");
  }

  get name():string {
      return this.constructor.name;
  };

  get elementSubscribable():Boolean {
    return true;
  };

  get change():Subject<string> {
    return this._change;
  }

  getElement(elementId:string):BehaviorSubject<{}> {
    // find the element requested by the client
    return this._collections.find((element:BehaviorSubject<{}>) => {
      return (<{id:string}>element.getValue()).id === elementId;
    });
  };

  getResource(offset?:string|number, limit?:string|number):BehaviorSubject<{}>[]{
    // retriev all element
    let resp:BehaviorSubject<{}>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._collections.slice(<number>offset, <number>limit);
    }

    return resp;
  };
}

export = Media;