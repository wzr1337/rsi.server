import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as WebSocketServer from 'ws';
import * as cors from 'cors';
import * as compression from 'compression';
import * as path from 'path';
import http = require('http');
import { rsiLogger, rsiLoggerInstance } from './log';

// create server and listen on provided port (on all network interfaces).
export class WebServer {
    public app: express.Express;
    public ws: WebSocketServer.Server;
    private _server: any;
    private _port: number | string | boolean;
    private _logger: rsiLoggerInstance;

    constructor(_port?: number, private _BASEURI: string = '/') {
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
        }

        this.app.use(cors(corsOpts));
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
            this._logger.info('Query:', req.method, req.url);
            next();
        });
        this.app.use(compression());

        //serve static content for cdn
        this.app.use(this._BASEURI + 'cdn/images', express.static(path.join(__dirname, 'cdn', 'images')));

        // Get port from environment and store in Express.
        this._port = this.normalizePort(process.env.PORT || _port || '3000');
        this.app.set('port', this._port);

        this._server = http.createServer(this.app);

        this.ws = new WebSocketServer.Server({ server: this._server });
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

        console.log('Listening on ' + bind);
    }

    /**
     * Shutdown the server
     */
    close = () => {
        this.ws.close(()=>{
            //console.log("Closed WS");
        });
        this._server.close();
        this.app = null;
    }
};

