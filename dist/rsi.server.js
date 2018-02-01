"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var log_1 = require("./log");
var web_server_1 = require("./web.server");
var core_1 = require("@rsi/core");
var web_socket_handler_1 = require("./web.socket.handler");
var web_socket_server_1 = require("./web.socket.server");
var helpers_1 = require("./helpers");
var request = require("request");
var RsiServer = /** @class */ (function () {
    function RsiServer() {
        var _this = this;
        this.logger = log_1.rsiLogger.getInstance().getLogger('general');
        this.BASEURI = '/';
        this.availableServices = [];
        this.wsMapping = {};
        this.clientWebsockets = [];
        this.serviceMap = {};
        this.port = 3000;
        this.serviceRegistry = '';
        /**
         * handling POST requests on resource level (elment creation).
         *
         * @param service   The service name.
         * @param resource  The resource name.
         */
        this.resourcePOST = function (service, resource) {
            var resourcePath = helpers_1.pathof(_this.BASEURI, service, resource);
            return function (req, res, next) {
                if (!resource.createElement) {
                    res.status(core_1.StatusCode.NOT_IMPLEMENTED).send('Not Implemented');
                    return;
                }
                var newElement = resource.createElement(req.body);
                if (newElement.status === 'ok') {
                    res.status(core_1.StatusCode.CREATED);
                    res.header({ 'Location': newElement.data.getValue().data.uri });
                    res.json({
                        status: 'ok'
                    });
                }
                else if (newElement.status) {
                    res.json(newElement);
                }
                else {
                    res.status(core_1.StatusCode.INTERNAL_SERVER_ERROR).send('Internal Server Error');
                }
            };
        };
        this.serviceGETSpec = function (service) {
            return function (req, res, next) {
                if (service != null) {
                    res.status(core_1.StatusCode.OK);
                    res.json({
                        status: 'ok',
                        data: service.getSpecification()
                    });
                }
                else {
                    res.status(core_1.StatusCode.NOT_FOUND).send('Internal Server Error');
                }
            };
        };
        /**
         * handling DELETE requests on element level (element removal or property reset).
         *
         * @param service   The service name.
         * @param resource  The resource name.
         */
        this.elementDELETE = function (service, resource) {
            var elementPath = helpers_1.pathof(_this.BASEURI, service, resource) + '/:id';
            return function (req, res, next) {
                if (!resource.deleteElement) {
                    res.status(501).send('Not Implemented');
                    return;
                }
                // proprietary element deletion
                var deletionResponse = resource.deleteElement(req.params.id);
                // respond
                if (deletionResponse.status && deletionResponse.status === 'ok' || deletionResponse.status === 'error') {
                    res.status(deletionResponse.code || (deletionResponse.status === 'ok') ? core_1.StatusCode.OK : core_1.StatusCode.INTERNAL_SERVER_ERROR);
                    res.json(deletionResponse);
                }
                else {
                    res.status(core_1.StatusCode.INTERNAL_SERVER_ERROR).send('Internal Server Error');
                    return;
                }
            };
        };
        this.elementUtil = new helpers_1.ElementUtil(this.availableServices, this.serviceMap);
    }
    RsiServer.prototype.stop = function () {
        if (this.server) {
            this.clientWebsockets.forEach(function (c) { return c.close(1001); });
            this.clientWebsockets.length = 0;
            this.server.close();
        }
    };
    RsiServer.prototype.run = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        this.logger.transports['console'].level = options.verbosity || 'warn';
        this.logger.info("Blub");
        this.BASEURI = options.base ? options.base : this.BASEURI;
        this.port = options.port ? options.port : this.port;
        this.serviceRegistry = options.serviceRegistry ? options.serviceRegistry : '';
        return new Promise(function (resolve, reject) {
            _this.shuttingDown = false;
            _this.server = new web_server_1.WebServer(options.port, _this.BASEURI);
            _this.server.init(); // need to init
            _this.server.app.get(_this.BASEURI, function (req, res, next) {
                // respond
                res.status(core_1.StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: _this.availableServices
                });
            });
            _this.server.ws.on('connection', function (ws) {
                var rsiWebSocket = new web_socket_server_1.RsiWebSocket(ws);
                _this.clientWebsockets.push(rsiWebSocket);
                ws.on('close', function () {
                    for (var prop in _this.wsMapping) {
                        _this.wsMapping[prop].unsubscribeWebSocket(rsiWebSocket);
                    }
                    // remove the client websocket from the collection
                    _this.clientWebsockets.splice(_this.clientWebsockets.indexOf(rsiWebSocket), 1);
                });
                ws.on('message', function (message) {
                    var msg;
                    // make sure we actually parse the incomming message
                    try {
                        msg = JSON.parse(message);
                    }
                    catch (err) {
                        rsiWebSocket.sendError(msg ? msg.event : '', core_1.StatusCode.BAD_REQUEST, new Error(err));
                        return;
                    }
                    var event = helpers_1.splitEvent(msg.event);
                    var basePath = _this.BASEURI + event.service + '/' + event.resource + '/';
                    if (_this.wsMapping[basePath] && _this.wsMapping[basePath].isHandlingEvent(msg.event)) {
                        _this.wsMapping[basePath].handleWebSocketMessages(msg, rsiWebSocket);
                    }
                    else {
                        rsiWebSocket.sendError(msg.event, core_1.StatusCode.NOT_FOUND, new Error('Not Found'));
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
        ;
        this.availableServices.push({
            id: service.id,
            name: service.name,
            uri: this.BASEURI + service.name.toLowerCase() + '/'
        });
        this.serviceMap[service.name] = service;
        this.server.app.get(this.BASEURI + service.name.toLowerCase() + '/', this.serviceGET(service));
        this.server.app.get(this.BASEURI + service.name.toLowerCase() + '/spec', this.serviceGETSpec(service));
        if (this.serviceRegistry !== '') {
            this.announceService(service);
        }
        service.resources.map(function (resource) {
            var basePath = _this.BASEURI + service.name.toLowerCase() + '/' + resource.name.toLowerCase() + '/';
            _this.server.app.get(basePath, _this.resourceGET(service, resource)); //READ
            _this.server.app.post(basePath, _this.resourcePOST(service, resource)); //CREATE
            _this.server.app.post(basePath + ':id', _this.elementPOST(service, resource)); //READ
            _this.server.app.get(basePath + ':id', _this.elementGET(service, resource)); //UPDATE
            _this.server.app.delete(basePath + ':id', _this.elementDELETE(service, resource)); //DELETE
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
            method: 'PUT',
            uri: this.serviceRegistry,
            body: jsonBody,
            json: true
        };
        request(options, function (err, response) {
            if (err) {
                console.log('Error registering ', err);
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
                    //console.log('Service 2 ' + service.name + ' Registered!');
                }
            }
        });
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
                uri: _this.BASEURI + service.name.toLowerCase() + '/' + res.name.toLowerCase() + '/'
            };
        });
        return function (req, res, next) {
            var result = resources;
            if (req.query.hasOwnProperty('$spec') && service.getSpecification()) {
                result = service.getSpecification();
            }
            res.status(core_1.StatusCode.OK);
            res.json({
                status: 'ok',
                data: result
            });
        };
    };
    ;
    /**
     * handling GET requests on element level (retrieve element details).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.elementGET = function (service, resource) {
        var _this = this;
        var elementPath = helpers_1.pathof(this.BASEURI, service, resource) + '/:id';
        //if(resource.getElement) { logger.info("GET   ", elementPath, "registered") };
        return function (req, res, next) {
            if (!resource.getElement) {
                res.status(core_1.StatusCode.NOT_IMPLEMENTED).send('Not Implemented');
                return;
            }
            // proprietary element fetching
            var element = resource.getElement(req.params.id);
            if (element && element.data) {
                var data = element.data.getValue().data;
                // filter the result before responding if need
                // ed
                if (req.query.hasOwnProperty('$fields')) {
                    data = helpers_1.filterByKeys(data, ['id', 'name', 'uri'].concat(req.query['$fields'].split(',')));
                }
                var expandLevel = req.query['$expand'] ? req.query['$expand'] : 0;
                _this.elementUtil.traverse(data, expandLevel, 0);
                //respond
                res.status(core_1.StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: data
                });
            }
            else {
                res.status(404).send();
            }
        };
    };
    ;
    /**
     * handling GET requests on resource level (element listing).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.resourceGET = function (service, resource) {
        var _this = this;
        var resourcePath = helpers_1.pathof(this.BASEURI, service, resource);
        //if(resource.getResource ) { logger.info("GET   ", resourcePath, "registered") };
        return function (req, res, next) {
            if (req.query.hasOwnProperty('$spec') && resource.getResourceSpec) {
                res.status(core_1.StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: resource.getResourceSpec()
                });
                return;
            }
            if (!resource.getResource) {
                res.status(core_1.StatusCode.NOT_IMPLEMENTED).send('Not Implemented');
                return;
            }
            // get all available renderes and map their representation to JSON compatible values
            function parseNumberOrId(n) {
                return (typeof n === 'undefined') ? undefined : ((!isNaN(parseFloat(n)) && isFinite(n)) ? parseFloat(n) : n.toString());
            }
            var elements = resource.getResource(parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit));
            if (elements) {
                var resp = elements.data.map(function (value) {
                    return value.getValue().data;
                });
                // enrich object refs + $expand handling
                var expandLevel_1 = req.query['$expand'] ? req.query['$expand'] : 0;
                resp = resp.map(function (x) {
                    _this.elementUtil.traverse(x, expandLevel_1, 0);
                    return x;
                });
                // Object ref search
                for (var propName in req.query) {
                    if (req.query.hasOwnProperty(propName)) {
                        if (propName.charAt(0) != '$') {
                            resp = resp.filter(function (item) {
                                if (!item.hasOwnProperty(propName)) {
                                    return false;
                                }
                                if (typeof item[propName] === 'object') {
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
                }
                // $q Freesearch
                if (req.query.hasOwnProperty('$q')) {
                    resp = resp.filter(function (item) {
                        var stringValue = JSON.stringify(item);
                        if (stringValue.indexOf(req.query['$q']) != -1) {
                            return item;
                        }
                    });
                }
                // $fields filtering
                if (req.query.hasOwnProperty('$fields')) {
                    var fieldsList_1 = req.query['$fields'];
                    var medatoryFields_1 = ['name', 'id', 'uri'];
                    resp = resp.map(function (item) {
                        var newItem = {};
                        for (var i in item) {
                            if (fieldsList_1.indexOf(i) != -1 || medatoryFields_1.indexOf(i) != -1) {
                                newItem[i] = item[i];
                            }
                        }
                        return newItem;
                    });
                }
                // $sorting
                if (req.query.hasOwnProperty('$sortby')) {
                    var sort_1 = req.query['$sortby'];
                    console.log("Sort result ", sort_1);
                    var dec_1 = 1;
                    if (sort_1.indexOf('-') === 0) {
                        sort_1 = sort_1.substring(1);
                        dec_1 = -1;
                    }
                    if (sort_1.indexOf('+') === 0) {
                        sort_1 = sort_1.substring(1);
                        dec_1 = 1;
                    }
                    resp = resp.sort(function (a, b) {
                        var val1 = 'z';
                        var val2 = 'z';
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
                    status: 'ok',
                    data: resp
                });
                return;
            }
            else {
                res.status(core_1.StatusCode.NOT_FOUND).send('Not found');
            }
        };
    };
    ;
    /**
     * handling POST requests on element level (modify an existing element).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    RsiServer.prototype.elementPOST = function (service, resource) {
        var elementPath = helpers_1.pathof(this.BASEURI, service, resource) + '/:id';
        //if(resource.updateElement) { logger.info("POST  ", elementPath, "registered") };
        return function (req, res, next) {
            // find the element requested by the client
            var element = resource.getElement(req.params.id);
            if (element && element.status === 'ok') {
                var resp = resource.updateElement(req.params.id, req.body);
                res.status(resp.code || core_1.StatusCode.OK);
                res.json({
                    code: resp.code || undefined,
                    status: resp.status,
                    message: resp.error ? (resp.error.message || undefined) : undefined
                });
            }
            else {
                res.status(element ? element.code : core_1.StatusCode.NOT_FOUND).json({
                    code: element ? element.code : core_1.StatusCode.NOT_FOUND,
                    status: element ? element.status : 'error',
                    message: element ? element.message : 'Not found.'
                });
            }
        };
    };
    ;
    return RsiServer;
}());
exports.RsiServer = RsiServer;
