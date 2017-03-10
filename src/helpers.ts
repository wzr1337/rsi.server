const URIREGEX = /^\/(\w+)\/(\w+)\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fAF]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})?#?\w*\??([\w$=&\(\)\:\,\;\-\+]*)?$/; //Group1: Servicename, Group2: Resourcename, Group3: element id, Group4: queryparameter list

export function splitEvent(event:string):{service?:string, resource?:string, element?:string} {
    let captureGroups = event.match(URIREGEX);
    if (!captureGroups) {
      return {}; //leave immediately if 
    }
    return {
      service : captureGroups[1].toLowerCase(),
      resource : captureGroups[2].toLowerCase(),
      element : captureGroups[3]
    }
  }