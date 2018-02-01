"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var winston = require("winston");
;
var LOGFILE = 'server.log';
var rsiLogger = /** @class */ (function () {
    function rsiLogger() {
        this._loggers = {};
        if (rsiLogger._instance) {
            throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
        }
        rsiLogger._instance = this;
    }
    rsiLogger.getInstance = function () {
        return rsiLogger._instance;
    };
    rsiLogger.prototype.getLogger = function (name) {
        if (!this._loggers.hasOwnProperty(name)) {
            this._loggers[name] = new (winston.Logger)({
                transports: [
                    new (winston.transports.Console)({
                        level: 'error',
                        colorize: true,
                        prettyPrint: true,
                        timestamp: true,
                        label: name
                    }),
                    new (winston.transports.File)({
                        filename: LOGFILE,
                        level: 'error',
                        timestamp: true,
                        label: name
                    })
                ]
            });
        }
        return this._loggers[name];
    };
    rsiLogger._instance = new rsiLogger();
    return rsiLogger;
}());
exports.rsiLogger = rsiLogger;
//# sourceMappingURL=log.js.map