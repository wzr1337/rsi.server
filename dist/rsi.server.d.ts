import { Resource, Service } from "@rsi/core";
import * as express from "express";
import { IRunOptions } from "./types";
/**
 * The rsiServer class to be instantiated for running a server
 */
export declare class RsiServer {
    private logger;
    private server;
    private BASEURI;
    private availableServices;
    private wsMapping;
    private shuttingDown;
    private clientWebsockets;
    private serviceMap;
    private elementUtil;
    private port;
    private serviceRegistry;
    /** the servers id */
    private ID;
    constructor();
    /**
     * stop the server and disconnect all clients gracefully
     */
    stop(): void;
    /**
     *
     * @param options {IRunOptions} the
     *
     * @return {Promise<void>} resolves after proper startup
     */
    run(options?: IRunOptions): Promise<void>;
    addService(service: Service): void;
    announceService(service: Service): void;
    /**
     * handling GET requests on resource level (element listing).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    resourceGET(service: Service, resource: Resource): (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    /**
     * handling POST requests on resource level (elment creation).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    resourcePOST(service: Service, resource: Resource): (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    serviceGETSpec(service: Service): (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    /**
     * handling DELETE requests on element level (element removal or property reset).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    elementDELETE(service: Service, resource: Resource): (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<void>;
    /**
     * retrieve all resources of a service
     *
     * @param service the service to discover
     *
     * returns an express route callback
     */
    private serviceGET;
    /**
     * handling GET requests on element level (retrieve element details).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    private elementGET;
    /**
     * handling POST requests on element level (modify an existing element).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    private elementPOST;
}
