/// <reference types="express" />
/// <reference types="ws" />
import * as express from "express";
import * as WebSocketServer from "ws";
declare class ServiceRegistry {
    private _BASEURI;
    app: express.Express;
    ws: WebSocketServer.Server;
    private server;
    private port;
    private logger;
    private services;
    private serviceMap;
    constructor(port?: number, _BASEURI?: string);
    init(): void;
    /**
     * Normalize a port into a number, string, or false.
     */
    normalizePort(val: any): number | string | boolean;
    /**
     * Event listener for HTTP server "listening" event.
     */
    onListening: () => void;
    /**
     * Shutdown the server
     */
    close: () => void;
}
export { ServiceRegistry };
