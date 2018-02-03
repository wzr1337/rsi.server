"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var request = require("request");
var helper_1 = require("./helper");
var helper_2 = require("./helper");
var PORT = 3200;
var PROTO = 'http';
var ADDRESS = '127.0.0.1';
var BASEURI = PROTO + '://' + ADDRESS + ':' + PORT;
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
    afterEach(function (done) { return helper_2.stopServer(done); });
    it('should return a list of services on GET /', function (done) {
        request(BASEURI, { method: 'GET' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            var payload = parseBody(body);
            expect(response.statusCode).toBe(200);
            expect(payload.status).toEqual('ok');
            expect(Array.isArray(payload.data)).toBe(true);
            done();
        });
    });
    it('should return an error for none existing elements', function (done) {
        request(BASEURI + '/$/§', { method: 'GET' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    it('should return an error for none existing resource', function (done) {
        request(BASEURI + '/$/', { method: 'GET' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    it('should not implement POST on /', function (done) {
        request(BASEURI, { method: 'POST' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    it('should not implement DELETE on /', function (done) {
        request(BASEURI, { method: 'DELETE' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    it('should return a list of albums /mediacontent/albums', function (done) {
        request(BASEURI + '/mediacontent/albums', { method: 'GET' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            expect(JSON.parse(response.body).data.length > 0).toBeTruthy();
            done();
        });
    });
    it('$limit should limit returned elements', function (done) {
        request(BASEURI + '/mediacontent/albums?$limit=2', { method: 'GET' }, function (error, response, body) {
            if (error) {
                console.log(error, response, body);
            }
            expect(JSON.parse(response.body).data.length === 2).toBeTruthy();
            done();
        });
    });
});
//# sourceMappingURL=base.spec.js.map