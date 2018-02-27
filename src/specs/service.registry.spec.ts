import * as request from "request";
import { startServer, stopServer } from "./helper";

const SERVICE_REGISTRY_PORT = 3000;
const PORT = 3200;
const PROTO = "http";
const ADDRESS = "127.0.0.1";
const BASEURI = PROTO + "://" + ADDRESS + ":" + SERVICE_REGISTRY_PORT;

function parseBody(body) {
    try {
        return JSON.parse(body);
    } catch (err) {
        return { error: err };
    }
}

describe("operate on /", () => {

    beforeEach((done) => startServer(done));

    afterEach((done) => stopServer(done));

    it("Service Registry should be reachable /", (done) => {
        request(BASEURI, { method: "GET" }, (error, response, body) => {
            if (error) {
                console.log(error, response, body);
            }
            const payload = parseBody(body);
            expect(response.statusCode).toBe(200);
            done();
        });
    });
});
