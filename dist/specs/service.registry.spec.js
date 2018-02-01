"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var helper_1 = require("./helper");
var SERVICE_REGISTRY_PORT = 3000;
var PORT = 3200;
var PROTO = 'http';
var ADDRESS = '127.0.0.1';
var BASEURI = PROTO + '://' + ADDRESS + ':' + SERVICE_REGISTRY_PORT;
function parseBody(body) {
    try {
        return JSON.parse(body);
    }
    catch (err) {
        return { error: err };
    }
}
describe('operate on /', function () {
    beforeEach(function (done) { return helper_1.startServer(done); });
    afterEach(function (done) { return helper_1.stopServer(done); });
    it('Service Registry should be reachable /', function (done) {
        request(BASEURI, { method: 'GET' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            var payload = parseBody(body);
            expect(response.statusCode).toBe(200);
            done();
        });
    });
});
//# sourceMappingURL=service.registry.spec.js.map