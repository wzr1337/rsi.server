import * as request from 'request';
import { startServer } from './helper';
import { stopServer } from './helper';

const PORT = 3200;
const PROTO = 'http';
const ADDRESS = '127.0.0.1';
const BASEURI = PROTO + '://' + ADDRESS + ':' + PORT;

function parseBody(body) {
    try {
        return JSON.parse(body);
    }
    catch (err) {
        return { error: err };
    }
}

describe('operate on /', () => {


    beforeEach((done) => startServer(done));

    afterEach((done) => stopServer(done));


    it('should return a list of services on GET /', (done) => {
        request(BASEURI, { method: 'GET' }, (error, response, body) => {
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
    it('should return an error for none existing elements', (done) => {
        request(BASEURI + '/$/§', { method: 'GET' }, (error, response, body) => {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    it('should return an error for none existing resource', (done) => {
        request(BASEURI + '/$/', { method: 'GET' }, (error, response, body) => {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    it('should not implement POST on /', (done) => {
        request(BASEURI, { method: 'POST' }, (error, response, body) => {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });
    it('should not implement DELETE on /', (done) => {
        request(BASEURI, { method: 'DELETE' }, (error, response, body) => {
            if (error) {
                console.log(error, response, body);
            }
            expect(response.statusCode).toBe(404);
            done();
        });
    });


    it('should return a list of albums /mediacontent/albums', (done) => {
        request(BASEURI + '/mediacontent/albums', { method: 'GET' }, (error, response, body) => {
            if (error) {
                console.log(error, response, body);
            }
            expect(JSON.parse(response.body).data.length > 0).toBeTruthy();
            done();
        });
    });


    it('$limit should limit returned elements', (done) => {
        request(BASEURI + '/mediacontent/albums?$limit=2', { method: 'GET' }, (error, response, body) => {
            if (error) {
                console.log(error, response, body);
            }
            expect(JSON.parse(response.body).data.length === 2).toBeTruthy();
            done();
        });
    });
});
