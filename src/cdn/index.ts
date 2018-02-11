import * as filetype from 'file-type';
import * as fs from "fs";
import { rsiLogger, rsiLoggerInstance } from "@rsi/core";
import * as express from 'express';

/**
 * Defines a callback signature for callback into the server
 * 
 * @param resourceName {string} the resource name or file type (e.g. /cdn/images/ => resourceName is 'images'))
 * @param fileName {string} the filename to reigster for (e.g. /cdn/images/foo.jpg => fileName is 'foo.jpg'))
 * 
 * @return {Buffer} a Buffer containing the content to be delivered
 */
export interface CdnCallback { (resourceName: string, fileName: string): Buffer };

/**
 * The cdn service provides access to binary data (e.g. images)
 */
class Cdn {

  private static _instance: Cdn = new Cdn();

  private _logger: rsiLoggerInstance;
  private _fileRegistry: {
    [filename: string]: CdnCallback
  } = {};

  private constructor() {
    this._logger = rsiLogger.getInstance().getLogger("cdn");
    if (Cdn._instance) {
      throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
    }
    Cdn._instance = this;
  }

  /**
   * The Cdn is a singleton, get an instance by calling the method.
   * 
   * @return {Cdn} instance of cdn service
   */
  public static getInstance(): Cdn {
    return Cdn._instance;
  }


  /**
   * This method process es Cdn calls
   * 
   * @return {express.RequestHandler} a function that takes a response, request and next argument
   */
  public process(): express.RequestHandler {
    const FILENAME_REGEX = /^.*\/([\w,\s-]+)\/([\w,\s-]+)\/([\w,\s-]+\.[A-Za-z]{3,4})(?:\?.*)?$/;

    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
      let origUrl = req.originalUrl;
      if (null === origUrl.match(FILENAME_REGEX) ) {
        res.status(501);
        res.json({
          status: "error",
          message: "Directory listing not supported"
        });
        return;
      }
      let filename: string = origUrl.match(FILENAME_REGEX)[3];
      let resourcename: string = origUrl.match(FILENAME_REGEX)[2];
      let path: string = resourcename + "/" + filename;
      if (this._fileRegistry[path]) {
        let img = this._fileRegistry[path](resourcename, filename);

        res.writeHead(200, {
          'Content-Type': filetype(img).mime,
          'Content-Length': img.length
        });
        res.end(img);
      }
      else {
        res.status(404);
        res.send("File not found");
      }
    }
  }

  /**
   * Other services use this method to register callbacks for file access
   * 
   * @param resourceName {string} The resource of the file to be made available (e.g. 'images')
   * @param fileName {string} The name of the file to be made available
   * @param callback {CdnCallback} The callback to be called on route access
   * 
   * @return {Boolean} true on success
   */
  public register(resourceName: string, fileName: string, callback: CdnCallback): Boolean {
    let path = resourceName + '/' + fileName;
    this._logger.silly(`registering a handler for ${path}`);
    let lookup = typeof this._fileRegistry[path] === "function";
    if (!lookup && typeof callback === "function") {
      //filename not yet registered
      this._fileRegistry[path] = callback;
      return true
    }
    return false;
  }
}

export { Cdn };