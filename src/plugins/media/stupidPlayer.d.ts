// Type definitions for stupid-player
// Project: https://github.com/???
// Definitions by: Dr. Patrck Bartsch <https://github.com/wzr1337/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

declare function M():void;

declare namespace M {

  interface StupidPlayerStatic {
    new() : StupidPlayerStatic;
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
  const EVENT_PLAY = 'play';

  /**
   * @const {string}
   */
  const EVENT_PAUSE = 'pause';

  /**
   * @const {string}
   */
  const EVENT_STOP = 'stop';

  /**
   * Fired with: {number} volume
   * @const {string}
   */
  const EVENT_VOLUME_CHANGE = 'volume-change';

  /**
   * Fired with: string
   * @const {string}
   */
  const EVENT_ERROR = 'error';
}

export = M;