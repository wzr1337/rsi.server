"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var PluginLoader_1 = require("../loaders/PluginLoader");
var rsi_server_1 = require("../rsi.server");
var service_registry_1 = require("../service.registry");
var SERVICE_REGISTRY_PORT = 3000;
var PORT = 3200;
var PROTO = "http";
var ADDRESS = "127.0.0.1";
var BASEURI = PROTO + "://" + ADDRESS + ":" + SERVICE_REGISTRY_PORT;
var server;
var serviceRegistry;
function startServer(done) {
    serviceRegistry = new service_registry_1.ServiceRegistry(3000);
    serviceRegistry.init();
    server = new rsi_server_1.RsiServer();
    console.log(path_1.join(__dirname, "..", "plugins"));
    server.run({
        port: PORT,
        serviceRegistry: "http://localhost:3000"
    }).then(function () {
        var plugins = new PluginLoader_1.PluginLoader(server);
        plugins.loadPlugins(path_1.join(__dirname, "..", "plugins"));
        // Workaround so it waits till all services have been registered at the service registry!
        setTimeout(function () {
            done();
        }, 500);
    });
}
exports.startServer = startServer;
function stopServer(done) {
    server.stop();
    serviceRegistry.close();
    setTimeout(function () {
        done();
    }, 1000);
}
exports.stopServer = stopServer;
//# sourceMappingURL=helper.js.map