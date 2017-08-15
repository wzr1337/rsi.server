import * as winston from "winston";

interface rsiLoggerInstance extends winston.LoggerInstance {};

/** The default log file location */
const LOGFILE = 'rsiServer.log';

/**
 * A general Logger class, a singleton, you MUST use getInstance() to get it and retriev a logger by using getLogger().
 */
class rsiLogger {

  private static _instance:rsiLogger = new rsiLogger();
  private _loggers:{[name: string]:rsiLoggerInstance} = {};

  constructor() {
    if(rsiLogger._instance){
      throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
    }
    rsiLogger._instance = this;
  }

  /**
   * the singleton instance getter
   * 
   * @return the logger instance
   */
  public static getInstance():rsiLogger
  {
    return rsiLogger._instance;
  }

  /**
   * Gets you an actual logger
   * 
   * @param name a logger name that is also used as logging scope in the logfile
   */
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
            level: 'info',
            timestamp: true,
            label: name })
        ]
      });
    }
    return this._loggers[name];
  }
}

export {rsiLogger, rsiLoggerInstance}