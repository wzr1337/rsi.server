import {viwiPlugin} from "../viwiPlugin";

class Renderer implements viwiPlugin {
  private name_:string;

  constructor() {
    this.name_ = "abcdef";
  }

  name() {
      return this.name_;
  }
}

export = Renderer;