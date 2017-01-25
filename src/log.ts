import * as winston from "winston";


class viwiLogger {
  private _logger:winston.LoggerInstance;

  static getInstance(loglevel?:string) {
    return new (winston.Logger)({
        transports: [
          new (winston.transports.Console)({ level: loglevel || 'error' }),
          new (winston.transports.File)({ filename: 'viwiServer.log', level: 'info' })
        ]
      });
  }
}

export {viwiLogger}