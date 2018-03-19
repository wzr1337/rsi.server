declare class RsiWebSocket {
    private ws;
    private _id;
    private logger;
    constructor(ws: WebSocket);
    readonly id: string;
    /**
     * send formatted data via WebSocket
     * @param event the event name (uri) to be emitted
     * @param payloadthe payload to be emitted for the event
     *
     * @returns true on successful send
     */
    sendData(event: string, payload: object): boolean;
    /**
     * send formatted error message via WebSocket
     * @param code error code
     * @param err the actual Error containing the message
     *
     * @returns true on successful send
     */
    sendError(event: string, code: number, err: Error): boolean;
    /**
     * acknowledge the subscription
     * @param event the event name (uri) to acknowledge the subscription for
     *
     * @returns true on successful acknowledgement
     */
    acknowledgeSubscription(event: string): boolean;
    /**
     * acknowledge the subscription
     * @param event the event name (uri) to acknowledge the unsubscription for
     *
     * @returns true on successful acknowledgement
     */
    acknowledgeUnsubscription(event: string): boolean;
    handleErrors(err: any): void;
    close(code?: number): void;
    private _send(rsiMessageObject);
}
export { RsiWebSocket };
