import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as WebSocketServer from 'ws';
import * as cors from 'cors';
import * as compression from 'compression';
import { rsiLogger, rsiLoggerInstance } from '@rsi/core';
import { splitEvent } from './helpers';
import http = require('http');
import * as uuid from 'uuid';

// create server and listen on provided port (on all network interfaces).
class ServiceRegistry {
    public app: express.Express;
    public ws: WebSocketServer.Server;
    private _server: any;
    private _port: number | string | boolean;
    private _logger: rsiLoggerInstance;


    private services: Array<any> = [];
    private serviceMap: any = {};

    constructor(_port?: number, private _BASEURI: string = '/') {
        this._port = _port;
        var _logger = this._logger = rsiLogger.getInstance().getLogger('general');
        this.app = express();

        var whitelist = ['127.0.0.1', 'localhost'];
        let corsOpts: cors.CorsOptions = {
            origin: function (origin, callback) {

                if (1 || typeof(origin) === 'undefined') { //@TODO: find an actual solution for https://github.com/wzr1337/viwiServer/issues/31
                    /**
                     * The origin may be hidden if the user comes from an ssl encrypted website.
                     *
                     * Also: Some browser extensions remove origin and referer from the http-request headers, and therefore the origin property will be empty.
                     */
                    callback(null, true);
                }
                else {
                    // subdomains and tlds need to be whitelisted explicitly
                    let hostRegex = new RegExp('(https?://)([^:^/]*)(:\\d*)?(.*)?', 'gi');
                    let result = hostRegex.exec(origin);
                    let host = (result && result.length >= 2) ? result[2] : undefined;
                    let originIsWhitelisted = whitelist.indexOf(host) !== -1;
                    callback(originIsWhitelisted ? null : new Error('Bad Request'), originIsWhitelisted);
                }
            },
            exposedHeaders: 'Location'
        };

        this.app.use(cors(corsOpts));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));

        this.app.use(compression());

        // Get port from environment and store in Express.
        this._port = this.normalizePort(_port);
        this.app.set('port', this._port);


        this.app.put('/', (req, res, next) => {
            let service = req.body;
            service.id = uuid.v4();

            let availableService = this.services.find((s: any) => {
                return s.name === service.name;
            });

            if (availableService) {
                let i = this.services.indexOf(availableService);
                this.services.splice(i, 1);
            }

            this.services.push(service);
            this.serviceMap[service.name] = service;
            res.header({ 'Location': '/' + service.id });
            res.json({
                status: 'ok'
            });

        });

        this.app.get('/', (req, res, next) => {
            const data: any = this.services.map((service: any) => {
                return {
                    name: service.name,
                    uri: 'http://localhost:' + service.port + '/' + service.name + '/',
                    id: service.id
                }
            });
            res.json({
                data: data
            });

        });

        this.app.get('/:service/:collection', (req, res, next) => {
            if (this.serviceMap.hasOwnProperty(req.params.service)) {
                const service = this.serviceMap[req.params.service];
                let r: any = req;
                let redirectUrl: string = 'http://localhost:' + service.port + '/' + service.name + '/' + req.params.collection;
                if (r._parsedUrl.query) {
                    redirectUrl += '?' + r._parsedUrl.query;
                }
                res.redirect(redirectUrl);
            }
        });

        this.app.get('/:service/:collection/?:resource', (req, res, next) => {
            if (this.serviceMap.hasOwnProperty(req.params.service)) {
                const service = this.serviceMap[req.params.service];
                let redirectUrl: string = 'http://localhost:' + service.port + '/' + service.name + '/' + req.params.collection + '/' + req.params.resource;
                let r: any = req;
                if (r._parsedUrl.query) {
                    redirectUrl += '?' + r._parsedUrl.query;
                }
                res.redirect(redirectUrl);
            }
        });

        this.app.delete('/:service/:collection/?:resource', (req, res, next) => {
            if (this.serviceMap.hasOwnProperty(req.params.service)) {
                const service = this.serviceMap[req.params.service];
                let redirectUrl: string = 'http://localhost:' + service.port + '/' + service.name + '/' + req.params.collection + '/' + req.params.resource;
                let r: any = req;
                if (r._parsedUrl.query) {
                    redirectUrl += '?' + r._parsedUrl.query;
                }
                res.redirect(redirectUrl);
            }
        });

        this.app.get('/:service/', (req, res, next) => {
            if (this.serviceMap.hasOwnProperty(req.params.service)) {
                const service = this.serviceMap[req.params.service];
                res.redirect('http://localhost:' + service.port + '/' + service.name + '/');
            }

        });

        this._server = http.createServer(this.app);
    }

    init() {
        this._server.listen(this._port);
        this._server.on('listening', this.onListening);
    }

    /**
     * Normalize a port into a number, string, or false.
     */
    normalizePort(val: any): number | string | boolean {
        let port = parseInt(val, 10);

        if (isNaN(port)) {
            // named pipe
            return val;
        }

        if (port >= 0) {
            // port number
            return port;
        }

        return false;
    }

    /**
     * Event listener for HTTP server "listening" event.
     */
    onListening = () => {
        let addr = this._server.address();
        let bind = typeof addr === 'string'
            ? 'pipe ' + addr
            : 'port ' + addr.port;

        console.log('Service Registry Listening on ' + bind);
    };

    /**
     * Shutdown the server
     */
    close = () => {
        //this.ws.close();
        this._server.close();
        this.app = null;
    };
}
;

export { ServiceRegistry };
