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
        var services = [];
        files.forEach(function (file) {
            var plugin = path_1.join(directory, file);
            services = services.concat(_this.loadPlugin(plugin));
        });
        return services;
    };
    PluginLoader.prototype.loadPlugin = function (directory) {
        var _this = this;
        console.log('Load Plugin ', directory);
        var service;
        var services = [];
        if (fs_1.lstatSync(directory).isDirectory()) {
            var _plugin = require(directory);
            console.log('Directory ', directory);
            console.log("Plugin ", _plugin);
            if (_plugin.hasOwnProperty('getPlugins')) {
                _plugin.getPlugins().forEach(function (serviceClass) {
                    service = new serviceClass(); //new _plugin.Service();
                    console.log("Service ", service);
                    service.pluginDir = directory;
                    if (service.init) {
                        service.init();
                    }
                    _this.server.addService(service);
                    services.push(service);
                });
            }
            /*
            service = _plugin.getPlugins();//new _plugin.Service();
            service.pluginDir = directory;
            if (service.init) {
                service.init();
            }
            this.server.addService(service);
            */
        }
        return services;
    };
    return PluginLoader;
}());
exports.PluginLoader = PluginLoader;
//# sourceMappingURL=PluginLoader.js.map