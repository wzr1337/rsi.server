import { BehaviorSubject } from '@reactivex/rxjs';
import { Service, Resource } from "../viwiPlugin";

class Media implements Service {
  private _resources:Renderer[]=[];

  constructor() {
    this._resources.push(new Renderer(this))
  }

  get name() {
      return this.constructor.name;
  }

  get resources() {
    return this._resources;
  }
}

class Renderer implements Resource {
  private _name:string;
  private _renderers:BehaviorSubject<{}>[] = [];

  constructor(private service:Service) {
    this._name = "renderers";

    const rendererId = "d6ebfd90-d2c1-11e6-9376-df943f51f0d8";//uuid.v1();  // FIXED for now
    let netfluxRenderer = new BehaviorSubject<{}>({
        uri: "/" + this.service.name.toLowerCase() + "/" + this._name.toLowerCase() + "/" + rendererId,
        id: rendererId,
        name: "Netflux",
        state: "idle",
        offset: 0
      });
    this._renderers.push(netfluxRenderer)
  }

  get name():string {
      return this._name;
  }

  getElement(elementId:string):BehaviorSubject<{}> {
    // find the element requested by the client
    return this._renderers.find((element:BehaviorSubject<{}>) => {
      return (<{id:string}>element.getValue()).id === elementId;
    });
  }

  getResource(offset?:string|number, limit?:string|number):BehaviorSubject<{}>[]{
    // retriev all element
    let resp:BehaviorSubject<{}>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._renderers.slice(<number>offset, <number>limit);
    }

    return resp;
  }


  private _interval:NodeJS.Timer; //@TODO has to become per-renderer
  updateElement?(elementId:string, difference:any):Boolean {
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

export = Media;