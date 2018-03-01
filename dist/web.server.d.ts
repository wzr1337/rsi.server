/// <reference types="express" />
/// <reference types="ws" />
import * as express from "express";
import * as WebSocketServer from "ws";
export declare class WebServer {
    private _BASEURI;
    app: express.Express;
    ws: WebSocketServer.Server;
    private server;
    private port;
    private logger;
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
