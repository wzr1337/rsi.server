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
var helpers_1 = require("./helpers");
var core_1 = require("@rsi/core");
var Observable_1 = require("rxjs/Observable");
var WsHandler = /** @class */ (function () {
    function WsHandler(service, resource, elementUtil) {
        var _this = this;
        this.service = service;
        this.resource = resource;
        this.elementUtil = elementUtil;
        this._subscriptions = {};
        /**
         * unsubscribe a given websocket from all it's subscriptions
         *
         * @param rsiWebSocket  The WebSocket to be unsubscribed.
         */
        this.unsubscribeWebSocket = function (rsiWebSocket) {
            if (_this._subscriptions[rsiWebSocket.id]) {
                var subscriptions = _this._subscriptions[rsiWebSocket.id];
                for (var prop in subscriptions) {
                    subscriptions[prop].unsubscribe();
                }
                delete _this._subscriptions[rsiWebSocket.id];
            }
        };
        /**
         * handling incoming websocket messages
         *
         * @param service   The service name.
         * @param resource  The resource name.
         * @param ws        The WebSocket the client is sending data on.
         */
        this.handleWebSocketMessages = function (msg, _rsiWebSocket) {
            var eventObj = helpers_1.splitEvent(msg.event);
            _this._subscriptions[_rsiWebSocket.id] = _this._subscriptions[_rsiWebSocket.id] || {}; // init if not yet initialized
            if (_this._subscriptions[_rsiWebSocket.id][msg.event] && msg.type === 'subscribe') {
                //logger.debug("Already subscribed: ", msg.event);
                return;
            }
            if (!eventObj.service || !eventObj.resource) {
                _rsiWebSocket.sendError(msg.event, core_1.StatusCode.BAD_REQUEST, new Error('event url malformed'));
                return;
            }
            console.log('MSG TYPE ', msg.type);
            switch (msg.type) {
                case 'subscribe':
                    if (eventObj.element) {
                        _this.handleElementSubscriptions(_rsiWebSocket, msg, eventObj);
                    }
                    else {
                        _this.handleResourceSubscriptions(_rsiWebSocket, msg, eventObj);
                    }
                    break;
                case 'unsubscribe':
                    //logger.info("Unsubscription:", msg.event);
                    var subscription = _this._subscriptions[_rsiWebSocket.id][msg.event];
                    if (subscription) {
                        subscription.unsubscribe();
                        _rsiWebSocket.acknowledgeUnsubscription(msg.event); //might fail, but not important at this point
                    }
                    break;
                case 'reauthorize':
                default:
                    console.error('Unsupported command on ws://:', msg.event);
                    _rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_IMPLEMENTED, new Error('Not Implemented'));
                    break;
            }
        };
    }
    WsHandler.prototype.toString = function () {
        return this.service.name + '/' + this.resource.name + '/';
    };
    /**
     * check if the Handler is actually handling the event
     * @param event the event url in question
     *
     * return true if instance handles event
     */
    WsHandler.prototype.isHandlingEvent = function (event) {
        var partials = helpers_1.splitEvent(event);
        return (this.service.name.toLowerCase() === partials.service) && (this.resource.name.toLowerCase() === partials.resource);
    };
    WsHandler.prototype.handleElementSubscriptions = function (rsiWebSocket, msg, eventObj) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var element, subject_1, subscription$;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.resource.elementSubscribable) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.resource.getElement(eventObj.element)];
                    case 1:
                        element = _a.sent();
                        subject_1 = element.data;
                        if (element && subject_1) {
                            //logger.debug("New element level subscription:", msg.event);
                            rsiWebSocket.acknowledgeSubscription(msg.event);
                            subscription$ = void 0;
                            if (msg.interval && msg.interval > 0) {
                                subscription$ = subject_1.combineLatest(Observable_1.Observable.interval(msg.interval), function (s, t) { return s; });
                            }
                            else if (msg.updatelimit) {
                                subscription$ = subject_1.throttle(function () { return Observable_1.Observable.timer(msg.updatelimit); });
                            }
                            else {
                                subscription$ = subject_1;
                            }
                            this._subscriptions[rsiWebSocket.id][msg.event] = subscription$.subscribe(function (data) { return __awaiter(_this, void 0, void 0, function () {
                                var params, d, fields, expandLevel;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            params = helpers_1.getEventParams(msg.event);
                                            d = data.data;
                                            if (params.$fields) {
                                                fields = params.$fields.split(',');
                                                d = helpers_1.filterByKeys(d, ['id', 'name', 'uri'].concat(fields));
                                            }
                                            expandLevel = params.$expand ? params.$expand : 0;
                                            return [4 /*yield*/, this.elementUtil.traverse(d, expandLevel, 0)];
                                        case 1:
                                            _a.sent();
                                            if (!rsiWebSocket.sendData(msg.event, d))
                                                subject_1.complete();
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, function (err) {
                                if (!rsiWebSocket.sendError(msg.event, core_1.StatusCode.INTERNAL_SERVER_ERROR, new Error(err)))
                                    subject_1.complete();
                            });
                        }
                        else {
                            if (!rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_FOUND, new Error('Not Found')))
                                subject_1.complete();
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        rsiWebSocket.sendError(msg.event, core_1.StatusCode.SERVICE_UNAVAILABLE, new Error('Service unavailable'));
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    WsHandler.prototype.handleResourceSubscriptions = function (rsiWebSocket, msg, eventObj) {
        var _this = this;
        if (this.resource.resourceSubscribable) {
            // resource subscription
            //logger.info("New resource level subscription:", msg.event);
            rsiWebSocket.acknowledgeSubscription(msg.event);
            var resourceStream$ = void 0;
            // TODO: Should element updates trigger resource subscriptions?
            var resource$ = this.resource.change.filter(function (x) { return x.action !== 'update'; });
            if (msg.interval && msg.interval > 0) {
                resourceStream$ = resource$.combineLatest(Observable_1.Observable.interval(msg.interval), function (s, t) { return s; });
            }
            else if (msg.updatelimit) {
                resourceStream$ = resource$.throttle(function () { return Observable_1.Observable.timer(msg.updatelimit); });
            }
            else {
                resourceStream$ = resource$;
            }
            // filter only updates because resource subscription should only fire on add and remove
            this._subscriptions[rsiWebSocket.id][msg.event] = resourceStream$
                .subscribe(function (change) { return __awaiter(_this, void 0, void 0, function () {
                var _this = this;
                var elements, resp, params_1, expandLevel_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.resource.getResource()];
                        case 1:
                            elements = _a.sent();
                            if (!elements) return [3 /*break*/, 3];
                            resp = elements.data.map(function (value) {
                                return value.getValue().data;
                            });
                            params_1 = helpers_1.getEventParams(msg.event);
                            expandLevel_1 = params_1.$expand ? params_1.$expand : 0;
                            if (params_1.$q) {
                                resp = resp.filter(function (item) {
                                    var stringValue = JSON.stringify(item);
                                    if (stringValue.indexOf(params_1.$q) != -1) {
                                        return item;
                                    }
                                });
                            }
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
                            if (!rsiWebSocket.sendData(msg.event, resp))
                                this.resource.change.complete();
                            return [3 /*break*/, 4];
                        case 3:
                            if (!rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_FOUND, new Error('Not found')))
                                this.resource.change.complete();
                            _a.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            }); }, function (err) {
                if (!rsiWebSocket.sendError(msg.event, core_1.StatusCode.INTERNAL_SERVER_ERROR, new Error(err)))
                    _this.resource.change.complete();
            });
        }
        else {
            rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_IMPLEMENTED, new Error('Not Implemented'));
        }
    };
    return WsHandler;
}());
exports.WsHandler = WsHandler;
//# sourceMappingURL=web.socket.handler.js.map