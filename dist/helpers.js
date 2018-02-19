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
function asyncForEach(array, callback) {
    return __awaiter(this, void 0, void 0, function () {
        var index;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    index = 0;
                    _a.label = 1;
                case 1:
                    if (!(index < array.length)) return [3 /*break*/, 4];
                    return [4 /*yield*/, callback(array[index], index, array)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3:
                    index++;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.asyncForEach = asyncForEach;
var ElementUtil = /** @class */ (function () {
    function ElementUtil(availableServices, serviceMap) {
        this.availableServices = availableServices;
        this.serviceMap = serviceMap;
    }
    ElementUtil.prototype.getElementById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var el;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, asyncForEach(this.availableServices, function (s) { return __awaiter(_this, void 0, void 0, function () {
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, asyncForEach(this.serviceMap[s.name].resources, function (r) { return __awaiter(_this, void 0, void 0, function () {
                                            var element, data;
                                            return __generator(this, function (_a) {
                                                element = r.getElement(id);
                                                if (element && element.data) {
                                                    data = element.data.getValue().data;
                                                    el = data;
                                                }
                                                return [2 /*return*/];
                                            });
                                        }); })];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.clone(el)];
                }
            });
        });
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
        return __awaiter(this, void 0, void 0, function () {
            var byLevel, keywords, _a, _b, _i, property, expandNode, fullObj, i, expandNode, fullObj;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        byLevel = /^\d+$/.test(maxLevel);
                        if (!byLevel) {
                            keywords = maxLevel.split(',');
                        }
                        else if (level > maxLevel) {
                            return [2 /*return*/];
                        }
                        _a = [];
                        for (_b in obj)
                            _a.push(_b);
                        _i = 0;
                        _c.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 12];
                        property = _a[_i];
                        if (!obj.hasOwnProperty(property)) return [3 /*break*/, 11];
                        if (!(typeof obj[property] == 'object' && !Array.isArray(obj[property]))) return [3 /*break*/, 4];
                        expandNode = byLevel ? level < maxLevel : keywords.indexOf(property) != -1;
                        return [4 /*yield*/, this.getElementById(obj[property].id)];
                    case 2:
                        fullObj = _c.sent();
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
                        return [4 /*yield*/, this.traverse(obj[property], maxLevel, level + 1)];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 11];
                    case 4:
                        if (!Array.isArray(obj[property])) return [3 /*break*/, 11];
                        i = 0;
                        _c.label = 5;
                    case 5:
                        if (!(i < obj[property].length)) return [3 /*break*/, 11];
                        if (!(typeof obj[property][i] == 'object')) return [3 /*break*/, 10];
                        expandNode = byLevel ? level < maxLevel : keywords.indexOf(property) != -1;
                        if (!expandNode) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.getElementById(obj[property][i].id)];
                    case 6:
                        fullObj = _c.sent();
                        if (fullObj) {
                            obj[property][i] = fullObj;
                        }
                        return [3 /*break*/, 8];
                    case 7:
                        obj[property][i] = {
                            id: obj[property][i].id,
                            uri: obj[property][i].uri
                        };
                        _c.label = 8;
                    case 8: return [4 /*yield*/, this.traverse(obj[property][i], maxLevel, level + 1)];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10:
                        i++;
                        return [3 /*break*/, 5];
                    case 11:
                        _i++;
                        return [3 /*break*/, 1];
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    return ElementUtil;
}());
exports.ElementUtil = ElementUtil;
//# sourceMappingURL=helpers.js.map