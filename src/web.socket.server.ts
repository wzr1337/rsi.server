import { IRsiLoggerInstance, RsiLogger } from "@rsi/core";
import * as uuid from "uuid";

class RsiWebSocket {
  // tslint:disable-next-line:variable-name
  private _id: string;
  private logger: IRsiLoggerInstance;

  constructor(private ws: WebSocket) {
    this.logger = RsiLogger.getInstance().getLogger("RsiWebSocket");
    this.logger.transports.console.level = "silly"; // for debug
    this._id = uuid.v4();
    this.ws.onerror = this.handleErrors;
  }

  get id(): string {
    return this._id;
  }

  /**
   * send formatted data via WebSocket
   * @param event the event name (uri) to be emitted
   * @param payloadthe payload to be emitted for the event
   *
   * @returns true on successful send
   */
  public sendData(event: string, payload: object): boolean {
    // this._logger.debug(this.constructor.name + ".sendData():", event);
    return this._send({
      data: payload,
      event,
      status: "ok",
      type: "data"
    });
  }

  /**
   * send formatted error message via WebSocket
   * @param code error code
   * @param err the actual Error containing the message
   *
   * @returns true on successful send
   */
  public sendError(event: string, code: number, err: Error): boolean {
    this.logger.debug("RsiWebSocket.sendError():", event, code, err.message);
    return this._send({
      code,
      data: err.message,
      event,
      type: "error"
    });
  }

  /**
   * acknowledge the subscription
   * @param event the event name (uri) to acknowledge the subscription for
   *
   * @returns true on successful acknowledgement
   */
  public acknowledgeSubscription(event: string): boolean {
    this.logger.debug("RsiWebSocket.acknowledgeSubscription():", event);
    return this._send({
      event,
      status: "ok",
      type: "subscribe"
    });
  }

  /**
   * acknowledge the subscription
   * @param event the event name (uri) to acknowledge the unsubscription for
   *
   * @returns true on successful acknowledgement
   */
  public acknowledgeUnsubscription(event: string): boolean {
    this.logger.debug("RsiWebSocket.acknowledgeUnsubscription():", event);
    return this._send({
      event,
      status: "ok",
      type: "unsubscribe"
    });
  }

  public handleErrors(err) {
    if (err.message === "read ECONNRESET") {
      // Ignore ECONNRESET and re throw anything else
      console.log("Client connection broke..");
    } else {
      console.log("WebSocket Error", err);
    }
  }

  public close(code?: number): void {
    if (this.ws.readyState) {
      this.ws.close(code);
    }
  }

  private _send(rsiMessageObject: object): boolean {
    if (this.ws.readyState === this.ws.OPEN) {
      // this._logger.debug(this.constructor.name + "._send():", rsiMessageObject);
      this.ws.send(JSON.stringify(rsiMessageObject));
      return true;
    }
    this.logger.error("RsiWebSocket._send(): WebSocket readyState is ", this.ws.readyState);
    return false;
  }
}

export { RsiWebSocket };
