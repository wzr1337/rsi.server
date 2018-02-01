import { rsiLogger } from './log';
import { WebServer } from './web.server';
import { Element, Resource, Service, StatusCode } from '@rsi/core';
import { WsHandler } from './web.socket.handler';
import { RsiWebSocket } from './web.socket.server';
import { RunOptions, RsiClientWebSocketMessage } from './types';
import { ElementUtil, filterByKeys, pathof, splitEvent } from './helpers';
import * as express from 'express';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import * as request from 'request';


export class RsiServer {

    private logger = rsiLogger.getInstance().getLogger('general');
    private server: WebServer;
    private BASEURI: string = '/';
    private availableServices: { id: string; name: string; uri: string }[] = [];
    private wsMapping: { [path: string]: WsHandler } = {};
    private shuttingDown: boolean;
    private clientWebsockets: Array<RsiWebSocket> = [];
    private serviceMap: any = {};
    private elementUtil: ElementUtil;
    private port: number = 3000;
    private serviceRegistry: string = '';

    constructor() {
        this.elementUtil = new ElementUtil(this.availableServices, this.serviceMap);
    }

    public stop() {
        if (this.server) {
            this.clientWebsockets.forEach((c: RsiWebSocket) => c.close(1001));
            this.clientWebsockets.length = 0;
            this.server.close();
        }
    }

    public run(options: RunOptions = {}): Promise<any> {
        this.logger.transports['console'].level = options.verbosity || 'warn';
        this.logger.info("Blub")
        this.BASEURI = options.base ? options.base : this.BASEURI;
        this.port = options.port ? options.port : this.port;
        this.serviceRegistry = options.serviceRegistry ? options.serviceRegistry : '';
        return new Promise<any>((resolve, reject) => {
            this.shuttingDown = false;
            this.server = new WebServer(options.port, this.BASEURI);
            this.server.init(); // need to init
            this.server.app.get(this.BASEURI, (req: express.Request, res: express.Response, next: express.NextFunction) => {
                // respond
                res.status(StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: this.availableServices
                });
            });

            this.server.ws.on('connection', (ws: any) => {                                //subscribe|unsubscribe

                const rsiWebSocket = new RsiWebSocket(ws);
                this.clientWebsockets.push(rsiWebSocket);
                ws.on('close', () => {
                    for (let prop in this.wsMapping) {
                        this.wsMapping[prop].unsubscribeWebSocket(rsiWebSocket);
                    }
                    // remove the client websocket from the collection
                    this.clientWebsockets.splice(this.clientWebsockets.indexOf(rsiWebSocket), 1);
                });

                ws.on('message', (message: string) => {
                    let msg: RsiClientWebSocketMessage;
                    // make sure we actually parse the incomming message
                    try {
                        msg = JSON.parse(message);
                    }
                    catch (err) {
                        rsiWebSocket.sendError(msg ? msg.event : '', StatusCode.BAD_REQUEST, new Error(err));
                        return;
                    }
                    let event = splitEvent(msg.event);
                    let basePath = this.BASEURI + event.service + '/' + event.resource + '/';
                    if (this.wsMapping[basePath] && this.wsMapping[basePath].isHandlingEvent(msg.event)) {
                        this.wsMapping[basePath].handleWebSocketMessages(msg, rsiWebSocket);
                    }
                    else {
                        rsiWebSocket.sendError(msg.event, StatusCode.NOT_FOUND, new Error('Not Found'));
                    }
                });
            });
            resolve();
        });

    }

    addService(service: Service) {
        let availableService = this.availableServices.find((s: any) => {
            return s.name === service.name;
        });

        if (availableService) {
            let i = this.availableServices.indexOf(availableService);
            this.availableServices.splice(i, 1);
        }
        ;

        this.availableServices.push({
            id: service.id,
            name: service.name,
            uri: this.BASEURI + service.name.toLowerCase() + '/'
        });

        this.serviceMap[service.name] = service;
        this.server.app.get(this.BASEURI + service.name.toLowerCase() + '/', this.serviceGET(service));
        this.server.app.get(this.BASEURI + service.name.toLowerCase() + '/spec', this.serviceGETSpec(service));
        if (this.serviceRegistry !== '') {
            this.announceService(service);
        }
        service.resources.map((resource: Resource) => {
            let basePath = this.BASEURI + service.name.toLowerCase() + '/' + resource.name.toLowerCase() + '/';
            this.server.app.get(basePath, this.resourceGET(service, resource));               //READ
            this.server.app.post(basePath, this.resourcePOST(service, resource));             //CREATE
            this.server.app.post(basePath + ':id', this.elementPOST(service, resource));      //READ
            this.server.app.get(basePath + ':id', this.elementGET(service, resource));        //UPDATE
            this.server.app.delete(basePath + ':id', this.elementDELETE(service, resource));  //DELETE
            this.wsMapping[basePath] = new WsHandler(service, resource, this.elementUtil);
        });
    }

    announceService(service: Service) {
        const jsonBody = {
            name: service.name,
            port: this.port
        };

        const options = {
            method: 'PUT',
            uri: this.serviceRegistry,
            body: jsonBody,
            json: true
        };

        request(options, (err, response) => {
            if (err) {
                console.log('Error registering ', err);
                setTimeout(() => {
                    this.announceService(service);
                }, 2000);
            } else {
                if (response.statusCode === 404) {
                    setTimeout(() => {
                        this.announceService(service);
                    }, 2000);
                } else {
                    //console.log('Service 2 ' + service.name + ' Registered!');
                }

            }
        });

    }


    /**
     * retrieve all resources of a service
     *
     * @param service the service to discover
     *
     * returns an express route callback
     */
    private serviceGET(service: Service) {
        let resources: Array<any> = service.resources.map((res: Resource) => {
            return {
                name: res.name.toLowerCase(),
                uri: this.BASEURI + service.name.toLowerCase() + '/' + res.name.toLowerCase() + '/'
            };
        });

        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            let result: any = resources;
            if (req.query.hasOwnProperty('$spec') && service.getSpecification()) {
                result = service.getSpecification();
            }

            res.status(StatusCode.OK);
            res.json({
                status: 'ok',
                data: result
            });
        };
    };

    /**
     * handling GET requests on element level (retrieve element details).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    private elementGET(service: Service, resource: Resource) {
        let elementPath = pathof(this.BASEURI, service, resource) + '/:id';
        //if(resource.getElement) { logger.info("GET   ", elementPath, "registered") };
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (!resource.getElement) {
                res.status(StatusCode.NOT_IMPLEMENTED).send('Not Implemented');
                return;
            }

            // proprietary element fetching
            let element = resource.getElement(req.params.id);
            if (element && element.data) {
                let data = (<BehaviorSubject<Element>>element.data).getValue().data;
                // filter the result before responding if need
                // ed
                if (req.query.hasOwnProperty('$fields')) {
                    data = filterByKeys(data, ['id', 'name', 'uri'].concat(req.query['$fields'].split(',')));
                }

                const expandLevel: any = req.query['$expand'] ? req.query['$expand'] : 0;
                this.elementUtil.traverse(data, expandLevel, 0);

                //respond
                res.status(StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: data
                });
            }
            else {
                res.status(404).send();
            }
        };
    };


    /**
     * handling GET requests on resource level (element listing).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    resourceGET(service: Service, resource: Resource) {
        let resourcePath = pathof(this.BASEURI, service, resource);
        //if(resource.getResource ) { logger.info("GET   ", resourcePath, "registered") };
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (req.query.hasOwnProperty('$spec') && resource.getResourceSpec) {
                res.status(StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: resource.getResourceSpec()
                });
                return;
            }

            if (!resource.getResource) {
                res.status(StatusCode.NOT_IMPLEMENTED).send('Not Implemented');
                return;
            }

            // get all available renderes and map their representation to JSON compatible values
            function parseNumberOrId(n: string | number): string | number {
                return (typeof n === 'undefined') ? undefined : ((!isNaN(parseFloat(<string>n)) && isFinite(<number>n)) ? parseFloat(<string>n) : n.toString());
            }

            let elements = resource.getResource(parseNumberOrId(req.query.$offset), parseNumberOrId(req.query.$limit));

            if (elements) {
                let resp:Array<any> = elements.data.map((value: BehaviorSubject<Element>) => {
                    return value.getValue().data;
                });

                // enrich object refs + $expand handling
                const expandLevel: any = req.query['$expand'] ? req.query['$expand'] : 0;
                resp = resp.map((x: any) => {
                    this.elementUtil.traverse(x, expandLevel, 0);
                    return x;
                });

                // Object ref search
                for (var propName in req.query) {
                    if (req.query.hasOwnProperty(propName)) {
                        if (propName.charAt(0) != '$') {
                            resp = resp.filter((item) => {
                                if (!item.hasOwnProperty(propName)) {
                                    return false;
                                }
                                if (typeof item[propName] === 'object') {
                                    if (item[propName].id === req.query[propName]) {
                                        return true;
                                    }
                                } else if (item[propName] === req.query[propName]) {
                                    return true;
                                }
                            });
                        }
                    }
                }

                // $q Freesearch
                if (req.query.hasOwnProperty('$q')) {
                    resp = resp.filter((item: any) => {
                        let stringValue: string = JSON.stringify(item);
                        if (stringValue.indexOf(req.query['$q']) != -1) {
                            return item;
                        }
                    });
                }

                // $fields filtering
                if (req.query.hasOwnProperty('$fields')) {
                    const fieldsList: Array<string> = req.query['$fields'];
                    const medatoryFields: Array<string> = ['name', 'id', 'uri'];
                    resp = resp.map((item: any) => {
                        let newItem: any = {};
                        for (var i in item) {
                            if (fieldsList.indexOf(i) != -1 || medatoryFields.indexOf(i) != -1) {
                                newItem[i] = item[i];
                            }
                        }
                        return newItem;
                    });
                }

                // $sorting
                if (req.query.hasOwnProperty('$sortby')) {
                    let sort: string = req.query['$sortby'];
                    console.log("Sort result ", sort );
                    let dec:number = 1;
                    if (sort.indexOf('-') === 0) {
                        sort = sort.substring(1);
                        dec = -1;
                    }
                    if (sort.indexOf('+') === 0) {
                        sort = sort.substring(1);
                        dec = 1;
                    }


                    resp = resp.sort((a: any, b: any) => {
                        let val1:any = 'z';
                        let val2:any = 'z';
                        if (a.hasOwnProperty(sort)) {
                            val1 = a[sort];
                        }

                        if (b.hasOwnProperty(sort)) {
                            val2 = b[sort];
                        }

                        val1 = val1.toLowerCase();
                        val2 = val2.toLowerCase();

                        if (val1 < val2) {
                            return -1 * dec;
                        }

                        if (val1 > val2) {
                            return 1 * dec;
                        }
                        return 0;
                    });
                }


                res.status(StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: resp
                });
                return;
            }
            else {
                res.status(StatusCode.NOT_FOUND).send('Not found');
            }
        };
    };

    /**
     * handling POST requests on resource level (elment creation).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    resourcePOST = (service: Service, resource: Resource) => {
        let resourcePath = pathof(this.BASEURI, service, resource);
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (!resource.createElement) {
                res.status(StatusCode.NOT_IMPLEMENTED).send('Not Implemented');
                return;
            }
            let newElement = resource.createElement(req.body);
            if (newElement.status === 'ok') {
                res.status(StatusCode.CREATED);
                res.header({'Location': (<BehaviorSubject<Element>>newElement.data).getValue().data.uri});
                res.json({
                    status: 'ok'
                });
            }
            else if (newElement.status) {
                res.json(newElement);
            }
            else {
                res.status(StatusCode.INTERNAL_SERVER_ERROR).send('Internal Server Error');
            }
        };
    };

    serviceGETSpec = (service: Service) => {
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {
            if (service != null) {
                res.status(StatusCode.OK);
                res.json({
                    status: 'ok',
                    data: service.getSpecification()
                });
            }

            else {
                res.status(StatusCode.NOT_FOUND).send('Internal Server Error');
            }
        };

    };

    /**
     * handling DELETE requests on element level (element removal or property reset).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    elementDELETE = (service: Service, resource: Resource) => {
        let elementPath = pathof(this.BASEURI, service, resource) + '/:id';
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {

            if (!resource.deleteElement) {
                res.status(501).send('Not Implemented');
                return;
            }
            // proprietary element deletion
            let deletionResponse = resource.deleteElement(req.params.id);

            // respond
            if (deletionResponse.status && deletionResponse.status === 'ok' || deletionResponse.status === 'error') {
                res.status(deletionResponse.code || (deletionResponse.status === 'ok') ? StatusCode.OK : StatusCode.INTERNAL_SERVER_ERROR);
                res.json(deletionResponse);
            }
            else {
                res.status(StatusCode.INTERNAL_SERVER_ERROR).send('Internal Server Error');
                return;
            }
        };
    };


    /**
     * handling POST requests on element level (modify an existing element).
     *
     * @param service   The service name.
     * @param resource  The resource name.
     */
    private elementPOST(service: Service, resource: Resource) {
        let elementPath = pathof(this.BASEURI, service, resource) + '/:id';
        //if(resource.updateElement) { logger.info("POST  ", elementPath, "registered") };
        return (req: express.Request, res: express.Response, next: express.NextFunction) => {

            // find the element requested by the client
            let element = resource.getElement(req.params.id);
            if (element && element.status === 'ok') {
                let resp = resource.updateElement(req.params.id, req.body);
                res.status(resp.code || StatusCode.OK);
                res.json({
                    code: resp.code || undefined,
                    status: resp.status,
                    message: resp.error ? (resp.error.message || undefined) : undefined
                });
            }
            else {
                res.status(element ? element.code : StatusCode.NOT_FOUND).json({
                    code: element ? element.code : StatusCode.NOT_FOUND,
                    status: element ? element.status : 'error',
                    message: element ? element.message : 'Not found.'
                });
            }
        };
    };


}