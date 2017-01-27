import * as Media from "./index";


describe("Service", () => {

  it("should have an id", (done:DoneFn) => {
    var s = new Media.Service();
    expect(typeof s.id).toEqual('string');
    done();
  });

  it("should exist", (done:DoneFn) => {
    var s = new Media.Service();
    expect(typeof s.name).toEqual('string');
    done();
  });

  it("should provide a list of resources", (done:DoneFn) => {
    var s = new Media.Service();
    expect(Array.isArray(s.resources)).toBeTruthy();
    done();
  });
});

describe("Renderers resource", () => {
  var r:Media.Renderers

  beforeAll((done:DoneFn) => {
    var s = new Media.Service();
    r = new Media.Renderers(s);
    done();
  });

  it("should not find an arbitrary element", (done:DoneFn) => {
    expect(r.getElement('123')).toBeUndefined();
    done();
  });

  it("should not a renderer", (done:DoneFn) => {
    r.getElement('d6ebfd90-d2c1-11e6-9376-df943f51f0d8').subscribe((element) => {
      expect(element).toBeDefined();
    });
    done();
  });
})

