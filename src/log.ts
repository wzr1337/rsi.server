import * as winston from "winston";

export interface rsiLoggerInstance extends winston.LoggerInstance {};

const LOGFILE = 'server.log';


export class rsiLogger {

  private static _instance:rsiLogger = new rsiLogger();
  public _loggers:{[name: string]:rsiLoggerInstance} = {};

  constructor() {
    if(rsiLogger._instance){
      throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
    }
    rsiLogger._instance = this;
  }

  public static getInstance():rsiLogger
  {
    return rsiLogger._instance;
  }

  getLogger(name:string):rsiLoggerInstance {
    if (! this._loggers.hasOwnProperty(name)) {
      this._loggers[name] = new (winston.Logger)({
        transports: [
          new (winston.transports.Console)({
            level: 'error',
            colorize: true,
            prettyPrint: true,
            timestamp: true,
            label: name }),
          new (winston.transports.File)({
            filename: LOGFILE,
            level: 'error',
            timestamp: true,
            label: name })
        ]
      });
    }
    return this._loggers[name];
  }
}

