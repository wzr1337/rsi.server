// Type definitions for stupid-player
// Project: https://github.com/???
// Definitions by: Dr. Patrck Bartsch <https://github.com/wzr1337/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare namespace stupidPlayer {

  interface StupidPlayer {
    on: (eventName:string, callback:() => void) => void;
    setVolume(value:number):Promise<number>;
    play(uri: any):Promise<void>;
    pause():Promise<void>;
    stop():Promise<void>;
    resume():Promise<void>;
  }

  /**
   * @const {string}
   */
  export const EVENT_PLAY = 'play';

  /**
   * @const {string}
   */
  export const EVENT_PAUSE = 'pause';

  /**
   * @const {string}
   */
  export const EVENT_STOP = 'stop';

  /**
   * Fired with: {number} volume
   * @const {string}
   */
  export const EVENT_VOLUME_CHANGE = 'volume-change';

  /**
   * Fired with: string
   * @const {string}
   */
  export const EVENT_ERROR = 'error';
}

export = stupidPlayer