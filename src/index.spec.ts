import { server, run, pathof} from ".";
import * as request from "request";

const PORT = 9999;
const PROTO = "http";
const ADDRESS = "127.0.0.1";
const BASEURI = PROTO + "://" + ADDRESS + ":" + PORT;

function parseBody(body:string):any {
  try {
    return JSON.parse(body);
  }
  catch(err) {
    return {error: err};
  }
}

beforeAll((done: DoneFn) => {
  run({port: PORT, verbosity: "error"}).then(()=> {
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
      var payload = parseBody(body);

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

describe("operate on resource level", () => {
    it("should return a list of resources on GET /media/", (done:DoneFn) => {
      request([BASEURI, "media"].join("/"), {method: "GET"}, (error, response, body) => {
        if (error) {
          console.log(error, response, body);
        }
        var payload = parseBody(body);

        expect(response.statusCode).toBe(200);
        expect(payload.status).toEqual("ok");
        expect(Array.isArray(payload.data)).toBe(true);
        done();
      });
    });

    it("should return an error for non-implemented services GET /$$$$$$$$/", (done:DoneFn) => {
      request([BASEURI, "$$$$$$$$"].join("/"), {method: "GET"}, (error, response, body) => {
        if (error) {
          console.log(error, response, body);
        }
        var payload = parseBody(body);

        expect(response.statusCode).toBe(404);
        //expect(payload.status).toEqual("error");
        done();
      });
    });
  });

afterAll((done: DoneFn) => {
  server.close();
  done();
});
