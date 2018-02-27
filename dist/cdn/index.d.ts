/// <reference types="node" />
/// <reference types="express" />
import * as express from "express";
/**
 * Defines a callback signature for callback into the server
 *
 * @param resourceName {string} the resource name or file type (e.g. /cdn/images/ => resourceName is "images"))
 * @param fileName {string} the filename to reigster for (e.g. /cdn/images/foo.jpg => fileName is "foo.jpg"))
 *
 * @return {Buffer} a Buffer containing the content to be delivered
 */
export declare type ICdnCallback = (resourceName: string, fileName: string) => Buffer;
/**
 * The cdn service provides access to binary data (e.g. images)
 */
declare class Cdn {
    /**
     * The Cdn is a singleton, get an instance by calling the method.
     *
     * @return {Cdn} instance of cdn service
     */
    static getInstance(): Cdn;
    private static instance;
    private logger;
    private fileRegistry;
    private constructor();
    /**
     * This method process es Cdn calls
     *
     * @return {express.RequestHandler} a function that takes a response, request and next argument
     */
    process(): express.RequestHandler;
    /**
     * Other services use this method to register callbacks for file access
     *
     * @param resourceName {string} The resource of the file to be made available (e.g. "images")
     * @param fileName {string} The name of the file to be made available
     * @param callback {ICdnCallback} The callback to be called on route access
     *
     * @return {Boolean} true on success
     */
    register(resourceName: string, fileName: string, callback: ICdnCallback): boolean;
}
export { Cdn };
