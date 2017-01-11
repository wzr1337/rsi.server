import { BehaviorSubject } from '@reactivex/rxjs';

declare namespace viwiPlugin {

  interface Service {
    name:string;
    resources:Resource[];
  }

  interface Resource {
    name:string;
    getElement(elementId:string):BehaviorSubject<any>;
    isGetable?:Boolean;
    isSetable?:Boolean;
    isDeletable?:Boolean;
  }
}
export = viwiPlugin;