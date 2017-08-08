import { server, run, pathof} from ".";
import * as request from "request";
import * as fs from "fs";
import { Cdn, CdnCallback} from "./cdn";

const IMAGE = "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";

const PORT = 9999;
const PROTO = "http";
const ADDRESS = "127.0.0.1";
const BASEURI = PROTO + "://" + ADDRESS + ":" + PORT;

var cdn:Cdn;


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
  cdn = Cdn.getInstance();
});

describe('general Tests', () => {
  console.log('Starting test suite "general Tests"');
  it('Should expose server', (done: DoneFn) => {
    expect(server).not.toBeUndefined();
    done();
  });

});

describe('cdn Tests', () => {

  it('Should register a base 64 encoded image', (done: DoneFn) => {
    // register for being called back
    expect(cdn.register('images', 'viwi_base64.png', () => {
      return Buffer.from(IMAGE,'base64');
    })).toBe(true);

    request(BASEURI + "/cdn/images/viwi_base64.png", {method: "GET"}, (error, response, body) => {
      if (error) {
        console.log(error, response, body);
      }
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toBe("image/png");
      done();
    });
  });

  xit('Should register a base 64 file', (done: DoneFn) => {
    // register for being called back
    expect(cdn.register('images', 'viwi_file.png', () => {
      return fs.readFileSync("./viwi.png");
    })).toBe(true);

    request(BASEURI + "/cdn/images/viwi_file.png", {method: "GET"}, (error, response, body) => {
      if (error) {
        console.log(error, response, body);
      }
      expect(response.statusCode).toBe(200);
      done();
    });
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
    xit("should return a list of resources on GET /media/", (done:DoneFn) => {
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
