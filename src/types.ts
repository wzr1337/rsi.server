
export interface IRsiClientWebSocketMessage {
  type: string;
  event: string;
  interval?: number;
  updatelimit?: number;
  Authorization?: string;
}

export interface IErrorObject {
  status: "error";
  message: string;
  code: number;
}

/**
 * options to run the server
 */
export interface IRunOptions {
    port?: number;
    verbosity?: "silly" | "debug" | "verbose" | "info" | "warn" | "error";
    base?: string;
    serviceRegistry?: string;
}
