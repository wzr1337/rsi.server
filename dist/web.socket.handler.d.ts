import { ElementUtil } from './helpers';
import { RsiWebSocket } from './web.socket.server';
import { Resource, Service } from '@rsi/core';
import { RsiClientWebSocketMessage } from './types';
export declare class WsHandler {
    private service;
    private resource;
    private elementUtil;
    private _subscriptions;
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
     * unsubscribe a given websocket from all it's subscriptions
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
    handleWebSocketMessages: (msg: RsiClientWebSocketMessage, _rsiWebSocket: RsiWebSocket) => void;
    handleElementSubscriptions(rsiWebSocket: RsiWebSocket, msg: RsiClientWebSocketMessage, eventObj: any): void;
    handleResourceSubscriptions(rsiWebSocket: any, msg: RsiClientWebSocketMessage, eventObj: any): void;
}
