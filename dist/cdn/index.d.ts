/// <reference types="node" />
/// <reference types="express" />
import * as express from 'express';
/**
 * Defines a callback signature for callback into the server
 *
 * @return a Buffer
 */
export interface CdnCallback {
    (resourceName: string, fileName: string): Buffer;
}
/**
 * The cdn service provides access to binary data (e.g. images)
 */
declare class Cdn {
    private static _instance;
    private _logger;
    private _fileRegistry;
    private constructor();
    /**
     * The Cdn is a singleton, get an instance by calling the method.
     */
    static getInstance(): Cdn;
    /**
     * This method
     *
     * @return a function that takes a response, request and next argument
     */
    process(): express.RequestHandler;
    /**
     *
     * Other service use this method to register callbacks for file access
     *
     * @param resourceName [string] The resource o the file to be made available (e.g. 'images')
     * @param fileName [string] The name of the file to be made available
     * @param callback [CdnCallback] The callback to be called on route access
     */
    register(resourceName: string, fileName: string, callback: CdnCallback): Boolean;
}
export { Cdn };
