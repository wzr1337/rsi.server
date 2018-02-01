"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var filetype = require("file-type");
var core_1 = require("@rsi/core");
;
/**
 * The cdn service provides access to binary data (e.g. images)
 */
var Cdn = /** @class */ (function () {
    function Cdn() {
        this._fileRegistry = {};
        this._logger = core_1.rsiLogger.getInstance().getLogger("cdn");
        if (Cdn._instance) {
            throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
        }
        Cdn._instance = this;
    }
    /**
     * The Cdn is a singleton, get an instance by calling the method.
     */
    Cdn.getInstance = function () {
        return Cdn._instance;
    };
    /**
     * This method
     *
     * @return a function that takes a response, request and next argument
     */
    Cdn.prototype.process = function () {
        var _this = this;
        var FILENAME_REGEX = /^.*\/([\w,\s-]+)\/([\w,\s-]+)\/([\w,\s-]+\.[A-Za-z]{3,4})(?:\?.*)?$/;
        return function (req, res, next) {
            var origUrl = req.originalUrl;
            if (null === origUrl.match(FILENAME_REGEX)) {
                res.status(501);
                res.json({
                    status: "error",
                    message: "Directory listing not supported"
                });
                return;
            }
            var filename = origUrl.match(FILENAME_REGEX)[3];
            var resourcename = origUrl.match(FILENAME_REGEX)[2];
            var path = resourcename + "/" + filename;
            if (_this._fileRegistry[path]) {
                var img = _this._fileRegistry[path](resourcename, filename);
                res.writeHead(200, {
                    'Content-Type': filetype(img).mime,
                    'Content-Length': img.length
                });
                res.end(img);
            }
            else {
                res.status(404);
                res.send("File not found");
            }
        };
    };
    /**
     *
     * Other service use this method to register callbacks for file access
     *
     * @param resourceName [string] The resource o the file to be made available (e.g. 'images')
     * @param fileName [string] The name of the file to be made available
     * @param callback [CdnCallback] The callback to be called on route access
     */
    Cdn.prototype.register = function (resourceName, fileName, callback) {
        var path = resourceName + '/' + fileName;
        var lookup = typeof this._fileRegistry[path] === "function";
        if (!lookup && typeof callback === "function") {
            //filename not yet registered
            this._fileRegistry[path] = callback;
            return true;
        }
        return false;
    };
    Cdn._instance = new Cdn();
    return Cdn;
}());
exports.Cdn = Cdn;
//# sourceMappingURL=index.js.map