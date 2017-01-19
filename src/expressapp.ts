import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as WebSocketServer from 'ws';
import * as cors from 'cors';
import http = require('http');


class viwiWebSocket {
    constructor(private ws: WebSocket) {
    }

    data(event:string, payload:Object):void {
        this.ws.send(JSON.stringify({type: "data", status: "ok", event: event, data: payload}));
    }

    error(code:number, err:Error):void {
        this.ws.send(JSON.stringify({type: "error", code: code, data: err.message}));
    }

    subscribeAck(event:string):void {
        this.ws.send(JSON.stringify({type: "subscribe", status: "ok", event: event}));
    }

    unsubscribeAck(event:string):void {
        this.ws.send(JSON.stringify({type: "unsubscribe", status: "ok", event: event}));
    }
}



// create server and listen on provided port (on all network interfaces).
class WebServer {
    public app: express.Express;
    public ws: WebSocketServer.Server;
    private _server:any;
    private _port:number|string|boolean;

    constructor (_port?:string) {
        this.app = express();
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use((req:express.Request, res:express.Response, next:express.NextFunction)=>{
            console.log("Query:", req.method, req.url);
            next();
        })

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
    normalizePort(val: any): number|string|boolean {
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
};

export { WebServer, viwiWebSocket };