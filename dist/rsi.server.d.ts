/// <reference types="express" />
import { Resource, Service } from '@rsi/core';
import { RunOptions } from './types';
import * as express from 'express';
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
    constructor();
    stop(): void;
    run(options?: RunOptions): Promise<any>;
    addService(service: Service): void;
    announceService(service: Service): void;
    /**
     * retrieve all resources of a service
     *
     * @param service the service to discover
     *
     * returns an express route callback
     */
    private serviceGET(service);
    /**
     * handling GET requests on element level (retrieve element details).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    private elementGET(service, resource);
    /**
     * handling GET requests on resource level (element listing).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    resourceGET(service: Service, resource: Resource): (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    /**
     * handling POST requests on resource level (elment creation).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    resourcePOST: (service: Service, resource: Resource) => (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    serviceGETSpec: (service: Service) => (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    /**
     * handling DELETE requests on element level (element removal or property reset).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    elementDELETE: (service: Service, resource: Resource) => (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    /**
     * handling POST requests on element level (modify an existing element).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    private elementPOST(service, resource);
}
