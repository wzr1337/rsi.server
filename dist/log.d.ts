import * as winston from "winston";
export interface rsiLoggerInstance extends winston.LoggerInstance {
}
export declare class rsiLogger {
    private static _instance;
    _loggers: {
        [name: string]: rsiLoggerInstance;
    };
    constructor();
    static getInstance(): rsiLogger;
    getLogger(name: string): rsiLoggerInstance;
}
