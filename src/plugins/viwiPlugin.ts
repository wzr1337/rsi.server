import { BehaviorSubject, Subject } from '@reactivex/rxjs';

export enum Status {
  "OK" = 200,
  "CREATED" = 201,
  "ACCEPTED" = 202,
  "MALFORMED_REQUEST" = 400,
  "FORBIDDEN" = 403,
  "NOT_FOUND" = 404,
  "INTERNAL_SERVER_ERROR" = 500
}

export interface Service {
  name:string;
  id: string;
  resources:Resource[];
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

  //@TODO: return a promise and handle success/failure accordingly
  getResource?(offset?:string|number, limit?:string|number):BehaviorSubject<Element>[]; //GET /<service>/<resource>/
  createElement?(state:{}):Element|Status;                                          //POST /<service>/<resource>/
  //@TODO: return a promise and handle success/failure accordingly
  getElement(elementId:string):BehaviorSubject<Element>;                                //GET /<service>/<resource>/<element>
  updateElement?(elementId:string, difference:any):Boolean;                             //POST /<service>/<resource>/<element>
  deleteElement?(elementId:string):Boolean;                                             //DELETE /<service>/<resource>/<element>

  resourceSubscribable?:Boolean;    //subscribe /<service>/<resource>/
  elementSubscribable?:Boolean;     //subscribe /<service>/<resource>/<element>
}