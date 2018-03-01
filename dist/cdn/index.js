"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var filetype = require("file-type");
var core_1 = require("@rsi/core");
/**
 * The cdn service provides access to binary data (e.g. images)
 */
var Cdn = /** @class */ (function () {
    function Cdn() {
        this.fileRegistry = {};
        this.logger = core_1.RsiLogger.getInstance().getLogger("cdn");
        if (Cdn.instance) {
            throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
        }
        Cdn.instance = this;
    }
    /**
     * The Cdn is a singleton, get an instance by calling the method.
     *
     * @return {Cdn} instance of cdn service
     */
    Cdn.getInstance = function () {
        return Cdn.instance;
    };
    /**
     * This method process es Cdn calls
     *
     * @return {express.RequestHandler} a function that takes a response, request and next argument
     */
    Cdn.prototype.process = function () {
        var _this = this;
        var FILENAME_REGEX = /^.*\/([\w,\s-]+)\/([\w,\s-]+)\/([\w,\s-]+\.[A-Za-z]{3,4})(?:\?.*)?$/;
        return function (req, res, next) {
            var origUrl = req.originalUrl;
            if (null === origUrl.match(FILENAME_REGEX)) {
                res.status(501);
                res.json({
                    message: "Directory listing not supported",
                    status: "error"
                });
                return;
            }
            var filename = origUrl.match(FILENAME_REGEX)[3];
            var resourcename = origUrl.match(FILENAME_REGEX)[2];
            var path = resourcename + "/" + filename;
            if (_this.fileRegistry[path]) {
                var img = _this.fileRegistry[path](resourcename, filename);
                res.writeHead(200, {
                    "Content-Length": img.length,
                    "Content-Type": filetype(img).mime
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
     * Other services use this method to register callbacks for file access
     *
     * @param resourceName {string} The resource of the file to be made available (e.g. "images")
     * @param fileName {string} The name of the file to be made available
     * @param callback {ICdnCallback} The callback to be called on route access
     *
     * @return {Boolean} true on success
     */
    Cdn.prototype.register = function (resourceName, fileName, callback) {
        var path = resourceName + "/" + fileName;
        this.logger.silly("registering a handler for " + path);
        var lookup = typeof this.fileRegistry[path] === "function";
        if (!lookup && typeof callback === "function") {
            // filename not yet registered
            this.fileRegistry[path] = callback;
            return true;
        }
        return false;
    };
    Cdn.instance = new Cdn();
    return Cdn;
}());
exports.Cdn = Cdn;
//# sourceMappingURL=index.js.map