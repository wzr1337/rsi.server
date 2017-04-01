import { BehaviorSubject, Subject } from '@reactivex/rxjs';

export enum StatusCode {
  "OK" = 200,
  "CREATED" = 201,
  "ACCEPTED" = 202,
  "BAD_REQUEST" = 400,
  "FORBIDDEN" = 403,
  "NOT_FOUND" = 404,
  "INTERNAL_SERVER_ERROR" = 500,
  "NOT_IMPLEMENTED" = 501
}

export class responseObject {
  status: "ok" | "error";
  data?: BehaviorSubject<Element> | BehaviorSubject<Element>[];
  error?: Error;
  code?: StatusCode;
  message?: string;
}

export class Service {
  private _resources:Resource[]=[];
  private _id:string;

  get name() {
   return this.constructor.name.toLowerCase();
  }

  get id() {
   return this._id;
  }

  set id(id:string) {
    this._id = id;
  }

  get resources() {
    return this._resources;
  }

  getResource(name:string):Resource {
    return this._resources.find((r:Resource) => {return r.name === name});
  }
}

export interface Element {
  lastUpdate: number;
  propertiesChanged: string[];
  data: any;
}

export interface ResourceUpdate {
  lastUpdate: number;
  action: "init"|"add"|"move"|"remove";
}

export interface Resource {
  name:string;
  change:BehaviorSubject<ResourceUpdate>;

  getResource?(offset?:string|number, limit?:string|number):BehaviorSubject<Element>[]; //GET /<service>/<resource>/
  createElement?(state:{}):responseObject;                                              //POST /<service>/<resource>/
  getElement(elementId:string):responseObject;                                          //GET /<service>/<resource>/<element>
  updateElement?(elementId:string, difference:any):Boolean;                             //POST /<service>/<resource>/<element>
  deleteElement?(elementId:string):Boolean;                                             //DELETE /<service>/<resource>/<element>

  resourceSubscribable?:Boolean;                                                        //subscribe /<service>/<resource>/
  elementSubscribable?:Boolean;                                                         //subscribe /<service>/<resource>/<element>
}