"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var WebSocketServer = require("ws");
var cors = require("cors");
var compression = require("compression");
var http = require("http");
var core_1 = require("@rsi/core");
var cdn_1 = require("./cdn");
// create server and listen on provided port (on all network interfaces).
var WebServer = /** @class */ (function () {
    function WebServer(_port, _BASEURI) {
        if (_BASEURI === void 0) { _BASEURI = '/'; }
        var _this = this;
        this._BASEURI = _BASEURI;
        /**
        * Event listener for HTTP server "listening" event.
        */
        this.onListening = function () {
            var addr = _this._server.address();
            var bind = typeof addr === 'string'
                ? 'pipe ' + addr
                : 'port ' + addr.port;
            console.log('Listening on ' + bind);
        };
        /**
        * Shutdown the server
        */
        this.close = function () {
            _this.ws.close(function () {
                //console.log("Closed WS");
            });
            _this._server.close();
            _this.app = null;
        };
        this._logger = core_1.rsiLogger.getInstance().getLogger('general');
        this.app = express();
        var whitelist = ['127.0.0.1', 'localhost'];
        var corsOpts = {
            origin: function (origin, callback) {
                if (1 || typeof (origin) === 'undefined') {
                    /**
                    * The origin may be hidden if the user comes from an ssl encrypted website.
                    *
                    * Also: Some browser extensions remove origin and referer from the http-request headers, and therefore the origin property will be empty.
                    */
                    callback(null, true);
                }
                else {
                    // subdomains and tlds need to be whitelisted explicitly
                    var hostRegex = new RegExp('(https?://)([^:^/]*)(:\\d*)?(.*)?', 'gi');
                    var result = hostRegex.exec(origin);
                    var host = (result && result.length >= 2) ? result[2] : undefined;
                    var originIsWhitelisted = whitelist.indexOf(host) !== -1;
                    callback(originIsWhitelisted ? null : new Error('Bad Request'), originIsWhitelisted);
                }
            },
            exposedHeaders: 'Location'
        };
        this.app.use(cors(corsOpts));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(function (req, res, next) {
            _this._logger.info('Query:', req.method, req.url);
            next();
        });
        this.app.use(compression());
        //serve static content for cdn
        this.app.use(this._BASEURI + 'cdn/images', cdn_1.Cdn.getInstance().process());
        // Get port from environment and store in Express.
        this._port = this.normalizePort(process.env.PORT || _port || '3000');
        this.app.set('port', this._port);
        this._server = http.createServer(this.app);
        this.ws = new WebSocketServer.Server({ server: this._server });
    }
    WebServer.prototype.init = function () {
        this._server.listen(this._port);
        this._server.on('listening', this.onListening);
    };
    /**
    * Normalize a port into a number, string, or false.
    */
    WebServer.prototype.normalizePort = function (val) {
        var port = parseInt(val, 10);
        if (isNaN(port)) {
            // named pipe
            return val;
        }
        if (port >= 0) {
            // port number
            return port;
        }
        return false;
    };
    return WebServer;
}());
exports.WebServer = WebServer;
;
//# sourceMappingURL=web.server.js.map