///<reference path="./stupid-player.d.ts" />

import * as stupid from 'stupid-player'; // a cross platform media player
//import * as player from './stupid-player';
import { BehaviorSubject } from '@reactivex/rxjs';
import * as path from 'path';

interface StupidPlayerState {
  offset: number;
  scan?: "off"|"up"|"down";
  state: "idle"|"play"|"pause"|"stop"|"ff"|"fr";
  repeat: "off"|"repeatall"|"repeatone";
  shuffle: "on"|"off";
  type?: "track"|"video"|"image";
}


class StupidPlayer {
  private _id:string;
  private _stupidPlayer:any;//player.StupidPlayer;
  private _state:BehaviorSubject<StupidPlayerState>;
  private _queue:{file:string}[]= [{
    file: './data/dimitriVegas.mp3'}
  ];
  private _playerInterval:NodeJS.Timer;
  private _index:number = 0;

  constructor() {
    this._id = "deadbeef-d2c1-11e6-9376-beefdead";//uuid.v1();  // FIXED for now
    this._stupidPlayer = new stupid();

        //initial state
    this._state = new BehaviorSubject(<StupidPlayerState>{
      offset: 0,
      state: "idle",
      repeat: "off",
      shuffle: "off"
    });
    this._state.subscribe( data => console.log(data))


    const REFRESHRATE = 250/*ms*/; 
    // listen for events
    this._stupidPlayer.on('play', () => {
      console.log("playing");//, player.EVENT_PLAY)
      this._playerInterval = <NodeJS.Timer>setInterval(() => {
        let currentState = this._state.getValue();
        this._state.next(Object.assign(currentState, {
          offset: currentState.offset + REFRESHRATE,
          state: 'play'
        }));
      }, REFRESHRATE);
    });

    this._stupidPlayer.on('stop', () => {
      if (this._playerInterval) {
        console.log("stopping")
        clearInterval(this._playerInterval);
        let currentState = this._state.getValue();
        this._state.next(Object.assign(currentState, {
          offset: 0,
          state: 'stop'
        }));
      }
    });

    this._stupidPlayer.on('pause', () => {
      if (this._playerInterval) {
        console.log("pausing")
        clearInterval(this._playerInterval);
        let currentState = this._state.getValue();
        this._state.next(Object.assign(currentState, {
          offset: currentState.offset,
          state: 'pause'
        }));
      }
    });
  }

  get id() {
    return this._id;
  }

  get name() {
    return "StpdPlayer";
  }

  // state ertrievale, use .getValue() for current value or subscribe for updates
  get state() {
    return this._state;
  }

  /**
   * command & control
   * 
   * ==================
   * /

  /**
   * start the player at a given queue index
   * 
   * @param index:number the index to play from the queue
   * 
   * @return Promise
   */
  play(index?:number):Promise<void> {
    index = index ? index : this._index;
    let filepath = path.join(__dirname, this._queue[index].file);
    // @TODO reject promise, if file does not exist
    return this._stupidPlayer.play(filepath);
  }

  /**
   * stop the player
   * 
   * @return Promise
   */
  stop():Promise<void> {
    return this._stupidPlayer.stop();
  }

  /**
   * resume the player
   * 
   * @return Promise
   */
  resume():Promise<void> {
    return this._stupidPlayer.resume();
  }

  /**
   * pause the player
   * 
   * @return Promise
   */
  pause():Promise<void> {
    return this._stupidPlayer.pause();
  }

}

export {StupidPlayer as Player}