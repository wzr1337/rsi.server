"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var queryString = require("query-string");
var URIREGEX = /^\/(\w+)\/(\w+)\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fAF]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?#?\w*\??([\w$=&\(\)\:\,\;\-\+]*)?$/; //Group1: Servicename, Group2: Resourcename, Group3: element id, Group4: queryparameter list
function splitEvent(event) {
    /*
    let captureGroups = event.match(URIREGEX);
    if (!captureGroups) {
        return {}; //leave immediately if
    }
    return {
        service: captureGroups[1].toLowerCase(),
        resource: captureGroups[2].toLowerCase(),
        element: captureGroups[3]
    }
    */
    if (event.lastIndexOf('#') != -1) {
        event = event.substring(0, event.lastIndexOf('#'));
    }
    if (event.indexOf('?') != -1) {
        event = event.substring(0, event.lastIndexOf('?'));
    }
    if (event.charAt(0) === '/') {
        event = event.substring(1);
    }
    var eventParts = event.split('/');
    var service;
    var resource;
    var element;
    if (eventParts.length >= 1) {
        service = eventParts[0].toLowerCase();
    }
    if (eventParts.length >= 2) {
        resource = eventParts[1].toLowerCase();
    }
    if (eventParts.length >= 3) {
        element = eventParts[2].toLowerCase();
    }
    return {
        service: service,
        resource: resource,
        element: element
    };
}
exports.splitEvent = splitEvent;
/**
 * helper for generating a route string
 *
 * @param service   The service name.
 * @param resource  The resource name.
 * @returns         The combined path use as a route.
 */
function pathof(baseUri, service, resource) {
    return baseUri + service.name.toLowerCase() + '/' + resource.name.toLowerCase();
}
exports.pathof = pathof;
/**
 * filters an object by keys
 *
 * @param inputObject   the input object
 * @param keep          an array of strings (keys) to keep
 * @returns             the filtered object
 */
function filterByKeys(inputObject, keep) {
    if (!Array.isArray(keep) || keep.length === 0)
        return inputObject;
    var result = {};
    for (var i = 0, len = keep.length; i < len; i++) {
        var key = keep[i];
        if (inputObject.hasOwnProperty(key)) {
            result[key] = inputObject[key];
        }
    }
    return result;
}
exports.filterByKeys = filterByKeys;
;
function getEventParams(value) {
    value = value.substring(value.lastIndexOf('?'));
    var parsed = queryString.parse(value);
    return parsed;
}
exports.getEventParams = getEventParams;
var ElementUtil = /** @class */ (function () {
    function ElementUtil(availableServices, serviceMap) {
        this.availableServices = availableServices;
        this.serviceMap = serviceMap;
    }
    ElementUtil.prototype.getElementById = function (id) {
        var _this = this;
        var el;
        this.availableServices.forEach(function (s) {
            _this.serviceMap[s.name].resources.forEach(function (r) {
                var element = r.getElement(id);
                if (element && element.data) {
                    var data = element.data.getValue().data;
                    el = data;
                }
            });
        });
        return this.clone(el);
    };
    /**
     * Deep clone object, except for keys that contain RSI-object references.
     *
     * @param obj
     * @returns {any}
     */
    ElementUtil.prototype.clone = function (obj) {
        var _this = this;
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        var objClone = Array.isArray(obj) ? [] : {};
        Object.keys(obj).forEach(function (key) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (_this.isObjectReference(obj[key])) {
                    objClone[key] = {
                        id: obj[key]['id'],
                        uri: obj[key]['uri']
                    };
                }
                else {
                    objClone[key] = _this.clone(obj[key]);
                }
            }
            else {
                objClone[key] = obj[key];
            }
        });
        return objClone;
    };
    ElementUtil.prototype.isObjectReference = function (obj) {
        return obj.hasOwnProperty('id') && obj.hasOwnProperty('uri');
    };
    ElementUtil.prototype.traverse = function (obj, maxLevel, level) {
        if (maxLevel === void 0) { maxLevel = Number.POSITIVE_INFINITY; }
        if (level === void 0) { level = 0; }
        var byLevel = /^\d+$/.test(maxLevel);
        var keywords;
        if (!byLevel) {
            keywords = maxLevel.split(',');
        }
        else if (level > maxLevel) {
            return;
        }
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (typeof obj[property] == 'object' && !Array.isArray(obj[property])) {
                    var expandNode = byLevel ? level < maxLevel : keywords.indexOf(property) != -1;
                    var fullObj = this.getElementById(obj[property].id);
                    if (expandNode) {
                        if (fullObj) {
                            obj[property] = fullObj;
                        }
                    }
                    else {
                        if (fullObj) {
                            obj[property] = {
                                id: obj[property].id,
                                uri: obj[property].uri
                            };
                        }
                    }
                    this.traverse(obj[property], maxLevel, level + 1);
                }
                else if (Array.isArray(obj[property])) {
                    for (var i = 0; i < obj[property].length; i++) {
                        if (typeof obj[property][i] == 'object') {
                            var expandNode = byLevel ? level < maxLevel : keywords.indexOf(property) != -1;
                            if (expandNode) {
                                var fullObj = this.getElementById(obj[property][i].id);
                                if (fullObj) {
                                    obj[property][i] = fullObj;
                                }
                            }
                            else {
                                obj[property][i] = {
                                    id: obj[property][i].id,
                                    uri: obj[property][i].uri
                                };
                            }
                            this.traverse(obj[property][i], maxLevel, level + 1);
                        }
                    }
                }
            }
        }
    };
    return ElementUtil;
}());
exports.ElementUtil = ElementUtil;
//# sourceMappingURL=helpers.js.map