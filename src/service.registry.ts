import { IRsiLoggerInstance, RsiLogger } from "@rsi/core";
import * as bodyParser from "body-parser";
import * as compression from "compression";
import * as cors from "cors";
import * as express from "express";
import http = require("http");
import * as uuid from "uuid";
import * as WebSocketServer from "ws";
import { splitEvent } from "./helpers";

// create server and listen on provided port (on all network interfaces).
class ServiceRegistry {
  public app: express.Express;
  public ws: WebSocketServer.Server;
  private server: any;
  private port: number | string | boolean;
  private logger: IRsiLoggerInstance;

  private services: any[] = [];
  private serviceMap: any = {};

  constructor(port?: number, private _BASEURI: string = "/") {
    this.port = port;
    this.logger = RsiLogger.getInstance().getLogger("general");
    this.app = express();

    const whitelist = ["127.0.0.1", "localhost"];
    const corsOpts: cors.CorsOptions = {
      exposedHeaders: "Location",
      origin: (origin, callback) => {
        if (1 || typeof (origin) === "undefined") {
          // @TODO: find an actual solution for https://github.com/wzr1337/viwiServer/issues/31

          /**
           * The origin may be hidden if the user comes from an ssl encrypted website.
           *
           * Also: Some browser extensions remove origin and referer from the http-request headers,
           * and therefore the origin property will be empty.
           */
          callback(null, true);
        } else {
          // subdomains and tlds need to be whitelisted explicitly
          const hostRegex = new RegExp("(https?://)([^:^/]*)(:\\d*)?(.*)?", "gi");
          const result = hostRegex.exec(origin);
          const host = (result && result.length >= 2) ? result[2] : undefined;
          const originIsWhitelisted = whitelist.indexOf(host) !== -1;
          callback(originIsWhitelisted ? null : new Error("Bad Request"), originIsWhitelisted);
        }
      }
    };

    this.app.use(cors(corsOpts));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({
      extended: false
    }));

    this.app.use(compression());

    // Get port from environment and store in Express.
    this.port = this.normalizePort(port);
    this.app.set("port", this.port);

    this.app.put("/", (req, res, next) => {
      const service = req.body;
      service.id = uuid.v4();

      const availableService = this.services.find((s: any) => {
        return s.name === service.name;
      });

      if (availableService) {
        const i = this.services.indexOf(availableService);
        this.services.splice(i, 1);
      }

      this.services.push(service);
      this.serviceMap[service.name] = service;
      res.header({
        Location: "/" + service.id
      });
      res.json({
        status: "ok"
      });

    });

    this.app.get("/", (req, res, next) => {
      const data: any = this.services.map((service: any) => {
        return {
          id: service.id,
          name: service.name,
          uri: "http://localhost:" + service.port + "/" + service.name + "/"
        };
      });
      res.json({
        data
      });

    });

    this.app.get("/:service/:collection", (req, res, next) => {
      if (this.serviceMap.hasOwnProperty(req.params.service)) {
        const service = this.serviceMap[req.params.service];
        const r: any = req;
        let redirectUrl: string = "http://localhost:" + service.port + "/" + service.name + "/" + req.params.collection;
        if (r._parsedUrl.query) {
          redirectUrl += "?" + r._parsedUrl.query;
        }
        res.redirect(redirectUrl);
      }
    });

    this.app.get("/:service/:collection/?:resource", (req, res, next) => {
      if (this.serviceMap.hasOwnProperty(req.params.service)) {
        const service = this.serviceMap[req.params.service];
        let redirectUrl: string = "http://localhost:" + service.port + "/" + service.name + "/"
                                  + req.params.collection + "/" + req.params.resource;
        const r: any = req;
        if (r._parsedUrl.query) {
          redirectUrl += "?" + r._parsedUrl.query;
        }
        res.redirect(redirectUrl);
      }
    });

    this.app.delete("/:service/:collection/?:resource", (req, res, next) => {
      if (this.serviceMap.hasOwnProperty(req.params.service)) {
        const service = this.serviceMap[req.params.service];
        let redirectUrl: string = "http://localhost:" + service.port + "/" + service.name + "/"
                                  + req.params.collection + "/" + req.params.resource;
        const r: any = req;
        if (r._parsedUrl.query) {
          redirectUrl += "?" + r._parsedUrl.query;
        }
        res.redirect(redirectUrl);
      }
    });

    this.app.get("/:service/", (req, res, next) => {
      if (this.serviceMap.hasOwnProperty(req.params.service)) {
        const service = this.serviceMap[req.params.service];
        res.redirect("http://localhost:" + service.port + "/" + service.name + "/");
      }

    });

    this.server = http.createServer(this.app);
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
    const bind = typeof addr === "string" ?
      "pipe " + addr :
      "port " + addr.port;
    this.logger.log("log", "Service Registry Listening on " + bind);
  }

  /**
   * Shutdown the server
   */
  public close = () => {
    // this.ws.close();
    this.server.close();
    this.app = null;
  }
}

export {
  ServiceRegistry
};
