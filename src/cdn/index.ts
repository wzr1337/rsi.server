import * as filetype from 'file-type';
import * as fs from "fs";
import { rsiLogger, rsiLoggerInstance } from "../log";
import * as express from 'express';

/**
 * Defines a callback signature for callback into the server
 * 
 * @return a Buffer
 */
interface CdnCallback {(resourceName:string, fileName:string):Buffer};

/**
 * The cdn service provides access to binary data (e.g. images)
 */
class Cdn {

  private static _instance:Cdn = new Cdn();

  private _logger:rsiLoggerInstance;
  private _fileRegistry:{
    [filename:string]: CdnCallback
  } = {};

  private constructor() {
    this._logger = rsiLogger.getInstance().getLogger("cdn2");
    if(Cdn._instance){
      throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
    }
    Cdn._instance = this;
  }

  /**
   * The Cdn is a singleton, get an instance by calling the method.
   */
  public static getInstance():Cdn
  {
    return Cdn._instance;
  }


  /**
   * This method
   * 
   * @return a function that takes a response, request and next argument
   */
  public process():{(req:express.Request, res:express.Response, next:express.NextFunction)} {
    const FILENAME_REGEX = /^.*\/([\w,\s-]+)\/([\w,\s-]+)\/([\w,\s-]+\.[A-Za-z]{3,4})(?:\?.*)?$/;

    return (req:express.Request, res:express.Response, next:express.NextFunction) => {
      let origUrl = req.originalUrl;
      let filename:string = origUrl.match(FILENAME_REGEX)[3];
      let resourcename:string = origUrl.match(FILENAME_REGEX)[2];
      let path:string = resourcename + "/" + filename;
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
   * 
   * Other service use this method to register callbacks for file access
   * 
   * @param resourceName [string] The resource o the file to be made available (e.g. 'images')
   * @param fileName [string] The name of the file to be made available
   * @param callback [CdnCallback] The callback to be called on route access
   */
  public register(resourceName:string, fileName:string, callback:CdnCallback):Boolean {
    let path = resourceName + '/' + fileName;
    let lookup = typeof this._fileRegistry[path] === "function";
    if(!lookup && typeof callback === "function") {
      //filename not yet registered
      this._fileRegistry[path] = callback;
    }
    return lookup;
  }
}

export { Cdn, CdnCallback };