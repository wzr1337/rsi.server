import * as winston from "winston";

interface viwiLoggerInstance extends winston.LoggerInstance {};

class viwiLogger {
  private _logger:viwiLoggerInstance;

  static getInstance():viwiLoggerInstance {
    return new (winston.Logger)({
        transports: [
          new (winston.transports.Console)({ level: 'error' }),
          new (winston.transports.File)({ filename: 'viwiServer.log', level: 'info' })
        ]
      });
  }
}

export {viwiLogger, viwiLoggerInstance}