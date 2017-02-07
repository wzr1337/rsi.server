import * as winston from "winston";

interface viwiLoggerInstance extends winston.LoggerInstance {};

const LOGFILE = 'viwiServer.log';


class viwiLogger {

  private static _instance:viwiLogger = new viwiLogger();
  private _loggers:{[name: string]:viwiLoggerInstance} = {};

  constructor() {
    if(viwiLogger._instance){
      throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
    }
    viwiLogger._instance = this;
  }

  public static getInstance():viwiLogger
  {
    return viwiLogger._instance;
  }

  getLogger(name:string):viwiLoggerInstance {
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
            level: 'info',
            timestamp: true,
            label: name })
        ]
      });
    }
    return this._loggers[name];
  }
}

export {viwiLogger, viwiLoggerInstance}