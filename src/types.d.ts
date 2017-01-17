
interface viwiClientWebSocketMessage {
  type:string,
  event:string,
  interval?:number,
  limit?:number,
  Authorization?:string
}

export {viwiClientWebSocketMessage}