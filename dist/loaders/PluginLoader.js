"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var fs_1 = require("fs");
var PluginLoader = /** @class */ (function () {
    function PluginLoader(server) {
        this.server = server;
    }
    PluginLoader.prototype.loadPlugins = function (directory) {
        var _this = this;
        var files = fs_1.readdirSync(directory);
        var services = files.map(function (file) {
            var plugin = path_1.join(directory, file);
            return _this.loadPlugin(plugin);
        });
        return services;
    };
    PluginLoader.prototype.loadPlugin = function (directory) {
        var service;
        if (fs_1.lstatSync(directory).isDirectory()) {
            var _plugin = require(directory);
            service = new _plugin.Service();
            service.pluginDir = directory;
            if (service.init) {
                service.init();
            }
            this.server.addService(service);
        }
        return service;
    };
    return PluginLoader;
}());
exports.PluginLoader = PluginLoader;
