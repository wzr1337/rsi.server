import { BehaviorSubject, Subject } from '@reactivex/rxjs';

declare namespace viwiPlugin {

  interface Service {
    name:string;
    resources:Resource[];
  }

  interface Resource {
    name:string;
    change:Subject<"add"|"move"|"remove">;

    //@TODO: will returning promises make sense???
    getResource?(offset?:string|number, limit?:string|number):BehaviorSubject<any>[];                              //GET /<service>/<resource>/
    createElement?(state:{}):Boolean;                                   //POST /<service>/<resource>/<element>
    getElement(elementId:string):BehaviorSubject<any>;                  //GET /<service>/<resource>/<element>
    updateElement?(elementId:string, difference:any):Boolean;            //POST /<service>/<resource>/<element>
    deleteElement?(elementId:string):Boolean;                           //DELETE /<service>/<resource>/<element>

    resourceSubscribable?:Boolean;    //subscribe /<service>/<resource>/
    elementSubscribable?:Boolean;     //subscribe /<service>/<resource>/<element>
  }
}
export = viwiPlugin;