import { Resource, Service } from '@rsi/core';
export declare function splitEvent(event: string): {
    service?: string;
    resource?: string;
    element?: string;
};
/**
 * helper for generating a route string
 *
 * @param service   The service name.
 * @param resource  The resource name.
 * @returns         The combined path use as a route.
 */
export declare function pathof(baseUri: string, service: Service, resource: Resource): string;
/**
 * filters an object by keys
 *
 * @param inputObject   the input object
 * @param keep          an array of strings (keys) to keep
 * @returns             the filtered object
 */
export declare function filterByKeys(inputObject: any, keep: string[]): Object;
export declare function getEventParams(value: string): any;
export declare function asyncForEach(array: any, callback: any): Promise<void>;
export declare class ElementUtil {
    private availableServices;
    private serviceMap;
    constructor(availableServices: {
        id: string;
        name: string;
        uri: string;
    }[], serviceMap: any);
    getElementById(id: string): Promise<any>;
    /**
     * Deep clone object, except for keys that contain RSI-object references.
     *
     * @param obj
     * @returns {any}
     */
    private clone(obj);
    private isObjectReference(obj);
    traverse(obj: any, maxLevel?: any, level?: number): Promise<void>;
}
