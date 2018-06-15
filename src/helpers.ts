import { IElement, Resource, Service } from "@rsi/core";
import * as queryString from "query-string";
import { BehaviorSubject } from "rxjs";

// tslint:disable-next-line:max-line-length
const URIREGEX = /^\/(\w+)\/(\w+)\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fAF]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?#?\w*\??([\w$=&\(\)\:\,\;\-\+]*)?$/;
// Group1: Servicename, Group2: Resourcename, Group3: element id, Group4: queryparameter list

export function splitEvent(event: string): {
  service?: string,
  resource?: string,
  element?: string
} {
  /*
  let captureGroups = event.match(URIREGEX);
  if (!captureGroups) {
      return {}; //leave immediately if
  }
  return {
      service: captureGroups[1].toLowerCase(),
      resource: captureGroups[2].toLowerCase(),
      element: captureGroups[3]
  }
  */

  if (event.lastIndexOf("#") !== -1) {
    event = event.substring(0, event.lastIndexOf("#"));
  }

  if (event.indexOf("?") !== -1) {
    event = event.substring(0, event.lastIndexOf("?"));
  }

  if (event.charAt(0) === "/") {
    event = event.substring(1);
  }

  const eventParts: string[] = event.split("/");

  let service;
  let resource;
  let element;

  if (eventParts.length >= 1) {
    service = eventParts[0].toLowerCase();
  }

  if (eventParts.length >= 2) {
    resource = eventParts[1].toLowerCase();
  }

  if (eventParts.length >= 3) {
    element = eventParts[2].toLowerCase();
  }

  return {
    element,
    resource,
    service
  };
}

/**
 * helper for generating a route string
 *
 * @param service   The service name.
 * @param resource  The resource name.
 * @returns         The combined path use as a route.
 */
export function pathof(baseUri: string, service: Service, resource: Resource) {
  return baseUri + service.name.toLowerCase() + "/" + resource.name.toLowerCase();
}

/**
 * filters an object by keys
 *
 * @param inputObject   the input object
 * @param keep          an array of strings (keys) to keep
 * @returns             the filtered object
 */
export function filterByKeys(inputObject: any, keep: string[]): object {
  if (!Array.isArray(keep) || keep.length === 0) {
    return inputObject;
  }
  const result: any = {};
  for (let i = 0, len = keep.length; i < len; i++) {
    const key: string = keep[i];
    if (inputObject.hasOwnProperty(key)) {
      result[key] = inputObject[key];
    }
  }
  return result;
}

export function getEventParams(value: string) {
  value = value.substring(value.lastIndexOf("?"));
  const parsed = queryString.parse(value);
  return parsed;
}

export async function asyncForEach(array, callback) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array);
  }
}

export class ElementUtil {

  constructor(private availableServices: Array<{ id: string; name: string; uri: string }>, private serviceMap: any) {

  }

  public async getElementById(id: string): Promise < any > {
    let el: any;
    await asyncForEach(this.availableServices, async (s: any) => {
      await asyncForEach(this.serviceMap[s.name].resources, async (r: Resource) => {
        const element: any = r.getElement(id);
        if (element && element.data) {
          const data = (element.data as BehaviorSubject<IElement>).getValue().data;
          el = data;
        }
      });
    });
    return this.clone(el);
  }

  public async traverse(obj: any, maxLevel: any = Number.POSITIVE_INFINITY, level: number = 0) {
    const byLevel: boolean = /^\d+$/.test(maxLevel);
    let keywords: string[] ;
    if (!byLevel) {
      keywords = maxLevel.split(",");
    } else if (level > maxLevel) {
      return;
    }
    for (const property in obj) {
      if (obj.hasOwnProperty(property)) {
        if (typeof obj[property] === "object" && !Array.isArray(obj[property])) {
          const expandNode: boolean = byLevel ? level < maxLevel : keywords.indexOf(property) !== -1;
          const fullObj: any = await this.getElementById(obj[property].id);
          if (expandNode) {
            if (fullObj) {
              obj[property] = fullObj;
            }
          } else {
            if (fullObj) {
              obj[property] = {
                id: obj[property].id,
                uri: obj[property].uri
              };
            }

          }
          await this.traverse(obj[property], maxLevel, level + 1);
        } else if (Array.isArray(obj[property])) {
          for (let i = 0; i < obj[property].length; i++) {
            if (typeof obj[property][i] === "object") {
              const expandNode: boolean = byLevel ? level < maxLevel : keywords.indexOf(property) !== -1;
              if (expandNode) {
                const fullObj: any = await this.getElementById(obj[property][i].id);
                if (fullObj) {
                  obj[property][i] = fullObj;
                }
              } else {
                obj[property][i] = {
                  id: obj[property][i].id,
                  uri: obj[property][i].uri
                };
              }
              await this.traverse(obj[property][i], maxLevel, level + 1);
            }
          }
        }
      }
    }
  }

  /**
   * Deep clone object, except for keys that contain RSI-object references.
   *
   * @param obj
   * @returns {any}
   */
  private clone(obj: object): any {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    const objClone = Array.isArray(obj) ? [] : {};
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "object" && obj[key] !== null) {
        if (this.isObjectReference(obj[key])) {
          objClone[key] = {
            id: obj[key].id,
            uri: obj[key].uri
          };
        } else {
          objClone[key] = this.clone(obj[key]);
        }
      } else {
        objClone[key] = obj[key];
      }
    });
    return objClone;
  }

  private isObjectReference(obj: object) {
    return obj.hasOwnProperty("id") && obj.hasOwnProperty("uri");
  }
}
