import { join } from "path";
import { PluginLoader } from "../loaders/PluginLoader";
import { RsiServer } from "../rsi.server";
import { ServiceRegistry } from "../service.registry";

const SERVICE_REGISTRY_PORT = 3000;
const PORT = 3200;
const PROTO = "http";
const ADDRESS = "127.0.0.1";
const BASEURI = PROTO + "://" + ADDRESS + ":" + SERVICE_REGISTRY_PORT;
let server;
let serviceRegistry;


export function startServer(done: Function) {
    serviceRegistry = new ServiceRegistry(3000);
    serviceRegistry.init();
    server = new RsiServer();

    console.log(join(__dirname, "..", "plugins"));


    server.run({
        port: PORT,
        serviceRegistry: "http://localhost:3000"
    }).then(() => {
        console.log("DONE");
        const plugins: PluginLoader = new PluginLoader(server);

        plugins.loadPlugins(join(__dirname, "..", "plugins"));

        // Workaround so it waits till all services have been registered at the service registry!
        setTimeout(() => {
            done();

        }, 500);
    });
}


export function stopServer(done: Function) {
    server.stop();
    serviceRegistry.close();
    setTimeout(() => {
        done();
    }, 1000);
}