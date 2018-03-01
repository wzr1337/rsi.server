import * as express from "express";
import * as filetype from "file-type";
import * as fs from "fs";

import { IRsiLoggerInstance , RsiLogger } from "@rsi/core";

/**
 * Defines a callback signature for callback into the server
 *
 * @param resourceName {string} the resource name or file type (e.g. /cdn/images/ => resourceName is "images"))
 * @param fileName {string} the filename to reigster for (e.g. /cdn/images/foo.jpg => fileName is "foo.jpg"))
 *
 * @return {Buffer} a Buffer containing the content to be delivered
 */
export type ICdnCallback = (resourceName: string, fileName: string) => Buffer;

/**
 * The cdn service provides access to binary data (e.g. images)
 */
class Cdn {

  /**
   * The Cdn is a singleton, get an instance by calling the method.
   *
   * @return {Cdn} instance of cdn service
   */
  public static getInstance(): Cdn {
    return Cdn.instance;
  }

  private static instance: Cdn = new Cdn();

  private logger: IRsiLoggerInstance;
  private fileRegistry: {
    [filename: string]: ICdnCallback
  } = {};

  private constructor() {
    this.logger = RsiLogger.getInstance().getLogger("cdn");
    if (Cdn.instance) {
      throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
    }
    Cdn.instance = this;
  }

  /**
   * This method process es Cdn calls
   *
   * @return {express.RequestHandler} a function that takes a response, request and next argument
   */
  public process(): express.RequestHandler {
    const FILENAME_REGEX = /^.*\/([\w,\s-]+)\/([\w,\s-]+)\/([\w,\s-]+\.[A-Za-z]{3,4})(?:\?.*)?$/;

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      const origUrl = req.originalUrl;
      if (null === origUrl.match(FILENAME_REGEX) ) {
        res.status(501);
        res.json({
          message: "Directory listing not supported",
          status: "error"
        });
        return;
      }
      const filename: string = origUrl.match(FILENAME_REGEX)[3];
      const resourcename: string = origUrl.match(FILENAME_REGEX)[2];
      const path: string = resourcename + "/" + filename;
      if (this.fileRegistry[path]) {
        const img = this.fileRegistry[path](resourcename, filename);

        res.writeHead(200, {
          "Content-Length": img.length,
          "Content-Type": filetype(img).mime
        });

        res.end(img);
      } else {
        res.status(404);
        res.send("File not found");
      }
    };
  }

  /**
   * Other services use this method to register callbacks for file access
   *
   * @param resourceName {string} The resource of the file to be made available (e.g. "images")
   * @param fileName {string} The name of the file to be made available
   * @param callback {ICdnCallback} The callback to be called on route access
   *
   * @return {Boolean} true on success
   */
  public register(resourceName: string, fileName: string, callback: ICdnCallback): boolean {
    const path = resourceName + "/" + fileName;
    this.logger.silly(`registering a handler for ${path}`);
    const lookup = typeof this.fileRegistry[path] === "function";
    if (!lookup && typeof callback === "function") {
      // filename not yet registered
      this.fileRegistry[path] = callback;
      return true;
    }
    return false;
  }
}

export { Cdn };
