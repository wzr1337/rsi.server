//import {describe, it, expect, jasmine} from '@types/jasmine';
import { server, run, pathof} from "../main";
import * as request from "request";

const PORT = 9999;
const BASEURI = "http://127.0.0.1:" + PORT;

beforeAll((done: DoneFn) => {
  run(PORT).then(()=> {
    done();
  });
});

describe('general Tests', () => {

  console.log('Starting test suite "general Tests"');

  it('Should expose server', (done: DoneFn) => {
    expect(server).not.toBeUndefined();
    done();
  });

});

describe("operate on /", () => {

  it("should return a list of services on GET /", (done:DoneFn) => {
    request(BASEURI, {method: "GET"}, (error, response, body) => {
      if (error) {
        console.log(error, response, body);
      }
      var payload = JSON.parse(body);

      expect(response.statusCode).toBe(200);
      expect(payload.status).toEqual("ok");
      expect(Array.isArray(payload.data)).toBe(true);
      done();
    });
  });

  it("should return an error for none existing elements", (done:DoneFn) => {
    request(BASEURI + "/$/§", {method: "GET"}, (error, response, body) => {
      if (error) {
        console.log(error, response, body);
      }
      expect(response.statusCode).toBe(404);
      done();
    });
  });

  it("should return an error for none existing resource", (done:DoneFn) => {
    request(BASEURI + "/$/", {method: "GET"}, (error, response, body) => {
      if (error) {
        console.log(error, response, body);
      }
      expect(response.statusCode).toBe(404);
      done();
    });
  });

  it("should not implement POST on /", (done:DoneFn) => {
    request(BASEURI, {method: "POST"}, (error, response, body) => {
      if (error) {
        console.log(error, response, body);
      }
      expect(response.statusCode).toBe(404);
      done();
    });
  });

  it("should not implement DELETE on /", (done:DoneFn) => {
    request(BASEURI, {method: "DELETE"}, (error, response, body) => {
      if (error) {
        console.log(error, response, body);
      }
      expect(response.statusCode).toBe(404);
      done();
    });
  });

});

afterAll((done: DoneFn) => {
  server.close();
  done();
});