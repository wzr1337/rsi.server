import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cors from "cors";
import * as express from "express";
import * as http from "http";
import * as path from "path";
import * as WebSocketServer from "ws";

import { Cdn } from "@rsi/cdn";
import { IRsiLoggerInstance, RsiLogger } from "@rsi/core";

// create server and listen on provided port (on all network interfaces).
export class WebServer {
  public app: express.Express;
  public ws: WebSocketServer.Server;

  private server: any;
  private port: number | string | boolean;
  private logger: IRsiLoggerInstance;

  constructor(port?: number, private _BASEURI: string = "/") {

    this.logger = RsiLogger.getInstance().getLogger("general");
    this.app = express();

    const whitelist = ["127.0.0.1", "localhost"];
    const corsOpts: cors.CorsOptions = {
      exposedHeaders: "Location",
      origin: "*"
    };

    this.app.use(cors(corsOpts));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
      this.logger.info("Query:", req.method, req.url);
      next();
    });
    this.app.use(compression());

    // serve static content for cdn
    this.app.use(this._BASEURI + "cdn/:resource/:filename?", Cdn.getInstance().requestHandler());

    // Get port from environment and store in Express.
    this.port = this.normalizePort(process.env.PORT || port || "3000");
    this.app.set("port", this.port);

    this.server = http.createServer(this.app);

    this.ws = new WebSocketServer.Server({ server: this.server });
  }

  public init() {
    this.server.listen(this.port);
    this.server.on("listening", this.onListening);
  }
  /**
   * Normalize a port into a number, string, or false.
   */
  public normalizePort(val: any): number | string | boolean {
    const port = parseInt(val, 10);

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
  public onListening = () => {
    const addr = this.server.address();
    const bind = typeof addr === "string"
    ? "pipe " + addr
    : "port " + addr.port;
    this.logger.log("log", "Listening on " + bind);
  }

  /**
   * Shutdown the server
   */
  public close = () => {
    this.ws.close(() => {
      // console.log("Closed WS");
    });
    this.server.close();
    this.app = null;
  }
}
