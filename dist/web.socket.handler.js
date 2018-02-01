"use strict";
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
        var _this = this;
        if (this.resource.elementSubscribable) {
            // this is an element subscription
            var element = this.resource.getElement(eventObj.element);
            var subject_1 = element.data;
            if (element && subject_1) {
                //logger.debug("New element level subscription:", msg.event);
                rsiWebSocket.acknowledgeSubscription(msg.event);
                var subscription$ = void 0;
                if (msg.interval && msg.interval > 0) {
                    subscription$ = subject_1.combineLatest(Observable_1.Observable.interval(msg.interval), function (s, t) { return s; });
                }
                else if (msg.updatelimit) {
                    subscription$ = subject_1.throttle(function () { return Observable_1.Observable.timer(msg.updatelimit); });
                }
                else {
                    subscription$ = subject_1;
                }
                this._subscriptions[rsiWebSocket.id][msg.event] = subscription$.subscribe(function (data) {
                    var params = helpers_1.getEventParams(msg.event);
                    var d = data.data;
                    if (params.$fields) {
                        var fields = params.$fields.split(',');
                        d = helpers_1.filterByKeys(d, ['id', 'name', 'uri'].concat(fields));
                    }
                    var expandLevel = params.$expand ? params.$expand : 0;
                    _this.elementUtil.traverse(d, expandLevel, 0);
                    if (!rsiWebSocket.sendData(msg.event, d))
                        subject_1.complete();
                }, function (err) {
                    if (!rsiWebSocket.sendError(msg.event, core_1.StatusCode.INTERNAL_SERVER_ERROR, new Error(err)))
                        subject_1.complete();
                });
            }
            else {
                if (!rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_FOUND, new Error('Not Found')))
                    subject_1.complete();
            }
        }
        else {
            rsiWebSocket.sendError(msg.event, core_1.StatusCode.SERVICE_UNAVAILABLE, new Error('Service unavailable'));
        }
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
                .subscribe(function (change) {
                //logger.info("New resource data:", change);
                var elements = _this.resource.getResource();
                if (elements) {
                    var resp = elements.data.map(function (value) {
                        return value.getValue().data;
                    });
                    var params_1 = helpers_1.getEventParams(msg.event);
                    var expandLevel_1 = params_1.$expand ? params_1.$expand : 0;
                    if (params_1.$q) {
                        resp = resp.filter(function (item) {
                            var stringValue = JSON.stringify(item);
                            if (stringValue.indexOf(params_1.$q) != -1) {
                                return item;
                            }
                        });
                    }
                    resp = resp.map(function (x) {
                        _this.elementUtil.traverse(x, expandLevel_1, 0);
                        return x;
                    });
                    if (!rsiWebSocket.sendData(msg.event, resp))
                        _this.resource.change.complete();
                }
                else {
                    if (!rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_FOUND, new Error('Not found')))
                        _this.resource.change.complete();
                }
            }, function (err) {
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
