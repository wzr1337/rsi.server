"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@rsi/core");
var request = require("request");
var helpers_1 = require("./helpers");
var web_server_1 = require("./web.server");
var web_socket_handler_1 = require("./web.socket.handler");
var web_socket_server_1 = require("./web.socket.server");
/**
 * The rsiServer class to be instantiated for running a server
 */
var RsiServer = /** @class */ (function () {
    function RsiServer() {
        this.logger = core_1.RsiLogger.getInstance().getLogger("general");
        this.BASEURI = "/";
        this.availableServices = [];
        this.wsMapping = {};
        this.clientWebsockets = [];
        this.serviceMap = {};
        this.port = 3000;
        this.serviceRegistry = "";
        /** the servers id */
        this.ID = "50182B97-1AE1-4701-A6CE-017648990969".toLowerCase();
        this.elementUtil = new helpers_1.ElementUtil(this.availableServices, this.serviceMap);
    }
    /**
     * stop the server and disconnect all clients gracefully
     */
    RsiServer.prototype.stop = function () {
        if (this.server) {
            this.clientWebsockets.forEach(function (c) { return c.close(1001); });
            this.clientWebsockets.length = 0;
            this.server.close();
        }
    };
    /**
     *
     * @param options {IRunOptions} the
     *
     * @return {Promise<void>} resolves after proper startup
     */
    RsiServer.prototype.run = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.logger.transports.console.level = options.verbosity || "warn";
        this.BASEURI = options.base ? options.base : this.BASEURI;
        this.port = options.port ? options.port : this.port;
        this.serviceRegistry = options.serviceRegistry ? options.serviceRegistry : "";
        return new Promise(function (resolve, reject) {
            _this.shuttingDown = false;
            _this.server = new web_server_1.WebServer(options.port, _this.BASEURI);
            _this.server.init(); // need to init
            // repsonse to /$id queries with the servers ID
            _this.server.app.get(_this.BASEURI + "([\$])id", function (req, res, next) {
                // respond
                if (req.get("Accept") !== "text/plain") {
                    res.status(core_1.StatusCode.NOT_FOUND);
                    res.send();
                    return;
                }
                res.status(core_1.StatusCode.OK);
                res.set("content-type", "text/plain");
                res.send(_this.ID);
            });
            _this.server.app.get(_this.BASEURI, function (req, res, next) {
                // respond
                res.status(core_1.StatusCode.OK);
                res.json({
                    data: _this.availableServices,
                    status: "ok"
                });
            });
            _this.server.app.all(_this.BASEURI, function (req, res, next) {
                // respond
                res.status(core_1.StatusCode.NOT_IMPLEMENTED);
                res.json({
                    code: 501,
                    message: "Not implemented",
                    status: "error"
                });
            });
            _this.server.ws.on("connection", function (ws) {
                var rsiWebSocket = new web_socket_server_1.RsiWebSocket(ws);
                _this.clientWebsockets.push(rsiWebSocket);
                ws.on("close", function () {
                    for (var prop in _this.wsMapping) {
                        if (_this.wsMapping.hasOwnProperty(prop)) {
                            _this.wsMapping[prop].unsubscribeWebSocket(rsiWebSocket);
                        }
                    }
                    // remove the client websocket from the collection
                    _this.clientWebsockets.splice(_this.clientWebsockets.indexOf(rsiWebSocket), 1);
                });
                ws.on("message", function (message) {
                    var msg;
                    // make sure we actually parse the incomming message
                    try {
                        msg = JSON.parse(message);
                    }
                    catch (err) {
                        rsiWebSocket.sendError(msg ? msg.event : "", core_1.StatusCode.BAD_REQUEST, new Error(err));
                        return;
                    }
                    var event = helpers_1.splitEvent(msg.event);
                    var basePath = _this.BASEURI + event.service + "/" + event.resource + "/";
                    if (_this.wsMapping[basePath] && _this.wsMapping[basePath].isHandlingEvent(msg.event)) {
                        _this.wsMapping[basePath].handleWebSocketMessages(msg, rsiWebSocket);
                    }
                    else {
                        rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_FOUND, new Error("Not Found"));
                    }
                });
            });
            resolve();
        });
    };
    RsiServer.prototype.addService = function (service) {
        var _this = this;
        var availableService = this.availableServices.find(function (s) {
            return s.name === service.name;
        });
        if (availableService) {
            var i = this.availableServices.indexOf(availableService);
            this.availableServices.splice(i, 1);
        }
        this.availableServices.push({
            id: service.id,
            name: service.name,
            uri: this.BASEURI + service.name.toLowerCase() + "/"
        });
        this.serviceMap[service.name] = service;
        this.server.app.get(this.BASEURI + service.name.toLowerCase() + "/", this.serviceGET(service));
        this.server.app.get(this.BASEURI + service.name.toLowerCase() + "/spec", this.serviceGETSpec(service));
        // repsonse to {{basePath}}/$id queries with the services ID
        this.server.app.get(this.BASEURI + service.name.toLowerCase() + "/([\$])id", function (req, res, next) {
            // respond
            res.status(core_1.StatusCode.OK);
            res.send(service.id);
        });
        if (this.serviceRegistry !== "") {
            this.announceService(service);
        }
        service.resources.map(function (resource) {
            var basePath = _this.BASEURI + service.name.toLowerCase() + "/" + resource.name.toLowerCase() + "/";
            _this.server.app.get(basePath, _this.resourceGET(service, resource)); // READ
            _this.server.app.post(basePath, _this.resourcePOST(service, resource)); // CREATE
            _this.server.app.post(basePath + ":id", _this.elementPOST(service, resource)); // READ
            _this.server.app.get(basePath + ":id", _this.elementGET(service, resource)); // UPDATE
            _this.server.app.delete(basePath + ":id", _this.elementDELETE(service, resource)); // DELETE
            _this.wsMapping[basePath] = new web_socket_handler_1.WsHandler(service, resource, _this.elementUtil);
        });
    };
    RsiServer.prototype.announceService = function (service) {
        var _this = this;
        var jsonBody = {
            name: service.name,
            port: this.port
        };
        var options = {
            body: jsonBody,
            json: true,
            method: "PUT",
            uri: this.serviceRegistry
        };
        request(options, function (err, response) {
            if (err) {
                _this.logger.error("Error registering", err);
                setTimeout(function () {
                    _this.announceService(service);
                }, 2000);
            }
            else {
                if (response.statusCode === 404) {
                    setTimeout(function () {
                        _this.announceService(service);
                    }, 2000);
                }
                else {
                    // console.log("Service 2 " + service.name + " Registered!");
                }
            }
        });
    };
    /**
     * handling GET requests on resource level (element listing).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.resourceGET = function (service, resource) {
        var _this = this;
        var resourcePath = helpers_1.pathof(this.BASEURI, service, resource);
        // if(resource.getResource ) { logger.info("GET   ", resourcePath, "registered") };
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            // get all available renderes and map their representation to JSON compatible values
            function parseNumberOrId(n) {
                return (typeof n === "undefined") ? undefined : ((!isNaN(parseFloat(n)) && isFinite(n)) ?
                    parseFloat(n) : n.toString());
            }
            var elements, resp, expandLevel_1, _loop_1, propName, fieldsList_1, medatoryFields_1, sort_1, dec_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (req.query.hasOwnProperty("$spec") && resource.getResourceSpec) {
                            res.status(core_1.StatusCode.OK);
                            res.json({
                                data: resource.getResourceSpec(),
                                status: "ok"
                            });
                            return [2 /*return*/];
                        }
                        if (!resource.getResource) {
                            res.status(core_1.StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, resource.getResource(parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit))];
                    case 1:
                        elements = _a.sent();
                        if (!elements) return [3 /*break*/, 3];
                        resp = elements.data.map(function (value) {
                            return value.getValue().data;
                        });
                        expandLevel_1 = req.query.$expand ? req.query.$expand : 0;
                        return [4 /*yield*/, Promise.all(resp.map(function (x) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.elementUtil.traverse(x, expandLevel_1, 0)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/, x];
                                    }
                                });
                            }); }))];
                    case 2:
                        resp = _a.sent();
                        _loop_1 = function (propName) {
                            if (req.query.hasOwnProperty(propName)) {
                                if (propName.charAt(0) !== "$") {
                                    resp = resp.filter(function (item) {
                                        if (!item.hasOwnProperty(propName)) {
                                            return false;
                                        }
                                        if (typeof item[propName] === "object") {
                                            if (item[propName].id === req.query[propName]) {
                                                return true;
                                            }
                                        }
                                        else if (item[propName] === req.query[propName]) {
                                            return true;
                                        }
                                    });
                                }
                            }
                        };
                        // Object ref search
                        for (propName in req.query) {
                            _loop_1(propName);
                        }
                        // $q Freesearch
                        if (req.query.hasOwnProperty("$q")) {
                            resp = resp.filter(function (item) {
                                var stringValue = JSON.stringify(item);
                                if (stringValue.indexOf(req.query.$q) !== -1) {
                                    return item;
                                }
                            });
                        }
                        // $fields filtering
                        if (req.query.hasOwnProperty("$fields")) {
                            fieldsList_1 = req.query.$fields;
                            medatoryFields_1 = ["name", "id", "uri"];
                            resp = resp.map(function (item) {
                                var newItem = {};
                                for (var i in item) {
                                    if (fieldsList_1.indexOf(i) !== -1 || medatoryFields_1.indexOf(i) !== -1) {
                                        newItem[i] = item[i];
                                    }
                                }
                                return newItem;
                            });
                        }
                        // $sorting
                        if (req.query.hasOwnProperty("$sortby")) {
                            sort_1 = req.query.$sortby;
                            dec_1 = 1;
                            if (sort_1.indexOf("-") === 0) {
                                sort_1 = sort_1.substring(1);
                                dec_1 = -1;
                            }
                            if (sort_1.indexOf("+") === 0) {
                                sort_1 = sort_1.substring(1);
                                dec_1 = 1;
                            }
                            resp = resp.sort(function (a, b) {
                                var val1 = "z";
                                var val2 = "z";
                                if (a.hasOwnProperty(sort_1)) {
                                    val1 = a[sort_1];
                                }
                                if (b.hasOwnProperty(sort_1)) {
                                    val2 = b[sort_1];
                                }
                                val1 = val1.toLowerCase();
                                val2 = val2.toLowerCase();
                                if (val1 < val2) {
                                    return -1 * dec_1;
                                }
                                if (val1 > val2) {
                                    return 1 * dec_1;
                                }
                                return 0;
                            });
                        }
                        res.status(core_1.StatusCode.OK);
                        res.json({
                            data: resp,
                            status: "ok"
                        });
                        return [2 /*return*/];
                    case 3:
                        res.status(core_1.StatusCode.NOT_FOUND).send("Not found");
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * handling POST requests on resource level (elment creation).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.resourcePOST = function (service, resource) {
        var _this = this;
        var resourcePath = helpers_1.pathof(this.BASEURI, service, resource);
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var newElement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!resource.createElement) {
                            res.status(core_1.StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, resource.createElement(req.body)];
                    case 1:
                        newElement = _a.sent();
                        if (newElement.status === "ok") {
                            res.status(core_1.StatusCode.CREATED);
                            res.header({ Location: newElement.data.getValue().data.uri });
                            res.json({
                                status: "ok"
                            });
                        }
                        else if (newElement.status) {
                            res.json(newElement);
                        }
                        else {
                            res.status(core_1.StatusCode.INTERNAL_SERVER_ERROR).send("Internal Server Error");
                        }
                        return [2 /*return*/];
                }
            });
        }); };
    };
    RsiServer.prototype.serviceGETSpec = function (service) {
        return function (req, res, next) {
            if (service != null) {
                res.status(core_1.StatusCode.OK);
                res.json({
                    data: service.getSpecification(),
                    status: "ok"
                });
            }
            else {
                res.status(core_1.StatusCode.NOT_FOUND).send("Internal Server Error");
            }
        };
    };
    /**
     * handling DELETE requests on element level (element removal or property reset).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.elementDELETE = function (service, resource) {
        var _this = this;
        var elementPath = helpers_1.pathof(this.BASEURI, service, resource) + "/:id";
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var deletionResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!resource.deleteElement) {
                            res.status(501).send("Not Implemented");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, resource.deleteElement(req.params.id)];
                    case 1:
                        deletionResponse = _a.sent();
                        // respond
                        if (deletionResponse.status && deletionResponse.status === "ok" || deletionResponse.status === "error") {
                            // tslint:disable-next-line:max-line-length
                            res.status(deletionResponse.code || (deletionResponse.status === "ok") ? core_1.StatusCode.OK : core_1.StatusCode.INTERNAL_SERVER_ERROR);
                            res.json(deletionResponse);
                        }
                        else {
                            res.status(core_1.StatusCode.INTERNAL_SERVER_ERROR).send("Internal Server Error");
                            return [2 /*return*/];
                        }
                        return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * retrieve all resources of a service
     *
     * @param service the service to discover
     *
     * returns an express route callback
     */
    RsiServer.prototype.serviceGET = function (service) {
        var _this = this;
        var resources = service.resources.map(function (res) {
            return {
                name: res.name.toLowerCase(),
                uri: _this.BASEURI + service.name.toLowerCase() + "/" + res.name.toLowerCase() + "/"
            };
        });
        return function (req, res, next) {
            var result = resources;
            if (req.query.hasOwnProperty("$spec") && service.getSpecification()) {
                result = service.getSpecification();
            }
            res.status(core_1.StatusCode.OK);
            res.json({
                data: result,
                status: "ok"
            });
        };
    };
    /**
     * handling GET requests on element level (retrieve element details).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.elementGET = function (service, resource) {
        var _this = this;
        var elementPath = helpers_1.pathof(this.BASEURI, service, resource) + "/:id";
        // if(resource.getElement) { logger.info("GET   ", elementPath, "registered") };
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var element, data, expandLevel;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!resource.getElement) {
                            res.status(core_1.StatusCode.NOT_IMPLEMENTED).send("Not Implemented");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, resource.getElement(req.params.id)];
                    case 1:
                        element = _a.sent();
                        if (!(element && element.data)) return [3 /*break*/, 3];
                        data = element.data.getValue().data;
                        // filter the result before responding if need
                        // ed
                        if (req.query.hasOwnProperty("$fields")) {
                            data = helpers_1.filterByKeys(data, ["id", "name", "uri"].concat(req.query.$fields.split(",")));
                        }
                        expandLevel = req.query.$expand ? req.query.$expand : 0;
                        return [4 /*yield*/, this.elementUtil.traverse(data, expandLevel, 0)];
                    case 2:
                        _a.sent();
                        // respond
                        res.status(core_1.StatusCode.OK);
                        res.json({
                            data: data,
                            status: "ok"
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        res.status(404).send();
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    };
    /**
     * handling POST requests on element level (modify an existing element).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.elementPOST = function (service, resource) {
        var _this = this;
        var elementPath = helpers_1.pathof(this.BASEURI, service, resource) + "/:id";
        // if(resource.updateElement) { logger.info("POST  ", elementPath, "registered") };
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var element, resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, resource.getElement(req.params.id)];
                    case 1:
                        element = _a.sent();
                        if (!(element && element.status === "ok")) return [3 /*break*/, 3];
                        return [4 /*yield*/, resource.updateElement(req.params.id, req.body)];
                    case 2:
                        resp = _a.sent();
                        res.status(resp.code || core_1.StatusCode.OK);
                        res.json({
                            code: resp.code || undefined,
                            message: resp.error ? (resp.error.message || undefined) : undefined,
                            status: resp.status
                        });
                        return [3 /*break*/, 4];
                    case 3:
                        res.status(element ? element.code : core_1.StatusCode.NOT_FOUND).json({
                            code: element ? element.code : core_1.StatusCode.NOT_FOUND,
                            message: element ? element.message : "Not found.",
                            status: element ? element.status : "error"
                        });
                        _a.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    };
    return RsiServer;
}());
exports.RsiServer = RsiServer;
//# sourceMappingURL=rsi.server.js.map