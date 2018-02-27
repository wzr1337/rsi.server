import { Resource, Service } from "@rsi/core";
import { ElementUtil } from "./helpers";
import { IRsiClientWebSocketMessage } from "./types";
import { RsiWebSocket } from "./web.socket.server";
export declare class WsHandler {
    private service;
    private resource;
    private elementUtil;
    private subscriptions;
    private logger;
    constructor(service: Service, resource: Resource, elementUtil: ElementUtil);
    toString(): string;
    /**
     * check if the Handler is actually handling the event
     * @param event the event url in question
     *
     * return true if instance handles event
     */
    isHandlingEvent(event: string): boolean;
    /**
     * unsubscribe a given websocket from all it"s subscriptions
     *
     * @param rsiWebSocket  The WebSocket to be unsubscribed.
     */
    unsubscribeWebSocket: (rsiWebSocket: RsiWebSocket) => void;
    /**
     * handling incoming websocket messages
     *
     * @param service   The service name.
     * @param resource  The resource name.
     * @param ws        The WebSocket the client is sending data on.
     */
    handleWebSocketMessages: (msg: IRsiClientWebSocketMessage, rsiWebSocket: RsiWebSocket) => void;
    handleElementSubscriptions(rsiWebSocket: RsiWebSocket, msg: IRsiClientWebSocketMessage, eventObj: any): Promise<void>;
    handleResourceSubscriptions(rsiWebSocket: any, msg: IRsiClientWebSocketMessage, eventObj: any): void;
}
