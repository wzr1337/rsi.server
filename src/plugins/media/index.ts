import { BehaviorSubject } from '@reactivex/rxjs';
import { Service, Resource } from "../viwiPlugin";
import * as express from 'express';

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

  get isGetable():Boolean {
    return true;
  }

  getElement(elementId:string):BehaviorSubject<{}> {
    // find the element requested by the client
    return this._renderers.find((element:BehaviorSubject<{}>) => {
      return (<{id:string}>element.getValue()).id === elementId;
    });
  }
}

export = Media;