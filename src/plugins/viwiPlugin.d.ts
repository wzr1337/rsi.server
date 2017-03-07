import { BehaviorSubject, Subject } from '@reactivex/rxjs';

declare namespace viwiPlugin {

  enum Status {
    "OK" = 200,
    "CREATED" = 201,
    "ACCEPTED" = 202,
    "MALFORMED_REQUEST" = 400,
    "FORBIDDEN" = 403,
    "NOT_FOUND" = 404,
    "INTERNAL_SERVER_ERROR" = 500
  }

  interface Service {
    name:string;
    id: string;
    resources:Resource[];
  }

  interface Element {
    lastUpdate: number;
    propertiesChanged: string[];
    data: any;
  }

  interface ResourceUpdate {
    lastUpdate: number;
    action: "init"|"add"|"move"|"remove";
  }

  interface Resource {
    name:string;
    change:Subject<ResourceUpdate>;

    //@TODO: will returning promises make sense???
    getResource?(offset?:string|number, limit?:string|number):BehaviorSubject<Element>[]; //GET /<service>/<resource>/
    createElement?(state:{}):Element|Status;                                          //POST /<service>/<resource>/
    getElement(elementId:string):BehaviorSubject<Element>;                                //GET /<service>/<resource>/<element>
    updateElement?(elementId:string, difference:any):Boolean;                             //POST /<service>/<resource>/<element>
    deleteElement?(elementId:string):Boolean;                                             //DELETE /<service>/<resource>/<element>

    resourceSubscribable?:Boolean;    //subscribe /<service>/<resource>/
    elementSubscribable?:Boolean;     //subscribe /<service>/<resource>/<element>
  }
}
export = viwiPlugin;