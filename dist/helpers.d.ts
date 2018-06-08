import { Resource, Service } from "@rsi/core";
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
export declare function filterByKeys(inputObject: any, keep: string[]): object;
export declare function getEventParams(value: string): any;
export declare function asyncForEach(array: any, callback: any): Promise<void>;
export declare class ElementUtil {
    private availableServices;
    private serviceMap;
    constructor(availableServices: Array<{
        id: string;
        name: string;
        uri: string;
    }>, serviceMap: any);
    getElementById(id: string): Promise<any>;
    traverse(obj: any, maxLevel?: any, level?: number): Promise<void>;
    /**
     * Deep clone object, except for keys that contain RSI-object references.
     *
     * @param obj
     * @returns {any}
     */
    private clone;
    private isObjectReference;
}
