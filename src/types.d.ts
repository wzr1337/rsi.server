
export interface viwiClientWebSocketMessage {
  type:string,
  event:string,
  interval?:number,
  limit?:number,
  Authorization?:string
}

export interface xObject {
  id: string;
  name: string;
  uri: string;
}