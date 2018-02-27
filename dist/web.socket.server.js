"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@rsi/core");
var uuid = require("uuid");
var RsiWebSocket = /** @class */ (function () {
    function RsiWebSocket(ws) {
        this.ws = ws;
        this.logger = core_1.rsiLogger.getInstance().getLogger("RsiWebSocket");
        this.logger.transports.console.level = "silly"; // for debug
        this._id = uuid.v4();
    }
    Object.defineProperty(RsiWebSocket.prototype, "id", {
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * send formatted data via WebSocket
     * @param event the event name (uri) to be emitted
     * @param payloadthe payload to be emitted for the event
     *
     * @returns true on successful send
     */
    RsiWebSocket.prototype.sendData = function (event, payload) {
        // this._logger.debug(this.constructor.name + ".sendData():", event);
        return this._send({
            data: payload,
            event: event,
            status: "ok",
            type: "data"
        });
    };
    /**
     * send formatted error message via WebSocket
     * @param code error code
     * @param err the actual Error containing the message
     *
     * @returns true on successful send
     */
    RsiWebSocket.prototype.sendError = function (event, code, err) {
        this.logger.debug("RsiWebSocket.sendError():", event, code, err.message);
        return this._send({
            code: code,
            data: err.message,
            event: event,
            type: "error"
        });
    };
    /**
     * acknowledge the subscription
     * @param event the event name (uri) to acknowledge the subscription for
     *
     * @returns true on successful acknowledgement
     */
    RsiWebSocket.prototype.acknowledgeSubscription = function (event) {
        this.logger.debug("RsiWebSocket.acknowledgeSubscription():", event);
        return this._send({
            event: event,
            status: "ok",
            type: "subscribe"
        });
    };
    /**
     * acknowledge the subscription
     * @param event the event name (uri) to acknowledge the unsubscription for
     *
     * @returns true on successful acknowledgement
     */
    RsiWebSocket.prototype.acknowledgeUnsubscription = function (event) {
        this.logger.debug("RsiWebSocket.acknowledgeUnsubscription():", event);
        return this._send({
            event: event,
            status: "ok",
            type: "unsubscribe"
        });
    };
    RsiWebSocket.prototype.close = function (code) {
        if (this.ws.readyState) {
            this.ws.close(code);
        }
    };
    RsiWebSocket.prototype._send = function (rsiMessageObject) {
        if (this.ws.readyState === this.ws.OPEN) {
            // this._logger.debug(this.constructor.name + "._send():", rsiMessageObject);
            this.ws.send(JSON.stringify(rsiMessageObject));
            return true;
        }
        this.logger.error("RsiWebSocket._send(): WebSocket readyState is ", this.ws.readyState);
        return false;
    };
    return RsiWebSocket;
}());
exports.RsiWebSocket = RsiWebSocket;
//# sourceMappingURL=web.socket.server.js.map