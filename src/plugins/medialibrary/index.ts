'use strict'

import { BehaviorSubject, Subject } from '@reactivex/rxjs';
import * as uuid from "uuid";
import * as path from "path";
import * as fs from "fs";
import { rsiLogger } from "../../log";

import { Service, Resource, Element, ResourceUpdate, StatusCode, ElementResponse, CollectionResponse } from "../rsiPlugin";
import { trackObject } from "./schema";

class Medialibrary extends Service {
  constructor() {
    super();
    this.id = "ea65d5eb-d5fb-4ceb-a568-ed24fcf37e20"; //random id
    this.resources.push(new Tracks(this));
  }
}

interface TracksElement extends Element {
  data: trackObject;
}

class Tracks implements Resource {

  private _name:string;
  private _tracks:BehaviorSubject<TracksElement>[] = [];
  private _change:BehaviorSubject<ResourceUpdate>;

  private _logger = rsiLogger.getInstance().getLogger("media");

  constructor(private service:Service) {
    let mocksPath = path.join(__dirname, "data", "mocks.json");

    let mocks = JSON.parse(fs.readFileSync(mocksPath).toString());
    for (var idx in mocks.tracks) {
      if (mocks.tracks.hasOwnProperty(idx)) {
        let track = mocks.tracks[idx];
        let trackObject = new BehaviorSubject<TracksElement>({
          lastUpdate: Date.now(),
          propertiesChanged: [],
          data: Object.assign({
            uri: "/" + this.service.name.toLowerCase() + "/" + this.name.toLowerCase() + "/" + track.id
          }, track)
        });
        this._tracks.push(trackObject);
      }
    }

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
      data: this._tracks.find((element:BehaviorSubject<TracksElement>) => {
      return (<{id:string}>element.getValue().data).id === elementId;
    })
    };
  };

  getResource(offset?:string|number, limit?:string|number):CollectionResponse{
    // retriev all element
    let resp:BehaviorSubject<TracksElement>[];

    if((typeof offset === "number" && typeof limit === "number") || (typeof limit === "number" && !offset) || (typeof offset === "number" && !limit) || (!offset && !limit)) {
      resp = this._tracks.slice(<number>offset, <number>limit);
    }

    return {status: "ok", data: resp};
  };
}


export {Medialibrary as Service, Tracks};