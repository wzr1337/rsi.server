import * as Media from "./index";
import { BehaviorSubject } from "@reactivex/rxjs";
import { Element, ElementResponse, CollectionResponse} from "../rsiPlugin";


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
  var RENDERERID:string = 'd6ebfd90-d2c1-11e6-9376-df943f51f0d8';

  beforeAll((done:DoneFn) => {
    var s = new Media.Service();
    r = new Media.Renderers(s);
    done();
  });

  it("should not find an arbitrary element", (done:DoneFn) => {
    expect(r.getElement('123').data).toBeUndefined();
    done();
  });

  it("should hold a renderer", (done:DoneFn) => {
    r.getElement(RENDERERID).data.subscribe((element) => {
      expect(element).toBeDefined();
    });
    done();
  });

  it("should hold a renderer called Netflux", (done:DoneFn) => {
    let renderers = r.getResource().data;
    expect(renderers).toBeDefined;
    expect(renderers.length).not.toEqual(0);
    let stpd = renderers.filter((el) => {
      return (el.getValue().data.name === "Netflux") ? el : undefined;
    });
    expect(stpd[0]).toBeDefined();
    done();
  });

  it("should hold a renderer called StpdPlayer", (done:DoneFn) => {
    let renderers = r.getResource().data;
    expect(renderers).toBeDefined;
    expect(renderers.length).not.toEqual(0);
    let stpd = renderers.filter((el) => {
      return (el.getValue().data.name === "StpdPlayer") ? el : undefined;
    });
    expect(stpd[0]).toBeDefined();
    done();
  });

  it("should change the shuffle state", (done:DoneFn) => {
    let values = ['off', 'on'];
    for (var index = 0; index < values.length; index++) {
      let value = values[index];
      r.updateElement(RENDERERID,{shuffle:value});
      expect(r.getElement(RENDERERID).data.getValue().data.shuffle).toEqual(value);
    }
    done();
  });

  it("should NOT change the shuffle state for invalid values", (done:DoneFn) => {
    r.updateElement(RENDERERID,{shuffle:'off'});
    expect(r.getElement(RENDERERID).data.getValue().data.shuffle).toEqual('off');
    r.updateElement(RENDERERID,{shuffle:'someInvalidValue'});
    expect(r.getElement(RENDERERID).data.getValue().data.shuffle).not.toEqual('someInvalidValue');
    expect(r.getElement(RENDERERID).data.getValue().data.shuffle).toEqual('off');
    done();
  });

  it("should change the repeat state", (done:DoneFn) => {
    let values = ['off', 'one', 'all'];
    for (var index = 0; index < values.length; index++) {
      let value = values[index];
      r.updateElement(RENDERERID,{repeat:value});
      expect(r.getElement(RENDERERID).data.getValue().data.repeat).toEqual(value);
    }
    done();
  });

  it("should NOT change the repeat state for invalid values", (done:DoneFn) => {
    r.updateElement(RENDERERID,{repeat:'off'});
    expect(r.getElement(RENDERERID).data.getValue().data.repeat).toEqual('off');
    r.updateElement(RENDERERID,{repeat:'someInvalidValue'});
    expect(r.getElement(RENDERERID).data.getValue().data.repeat).not.toEqual('someInvalidValue');
    expect(r.getElement(RENDERERID).data.getValue().data.repeat).toEqual('off');
    done();
  });
})
describe("Collections resource", () => {
  var collections:Media.Collections;
  var COLLECTIONID:string = 'deadbeef-d2c1-11e6-9376-df943f51f0d8';

  beforeAll((done:DoneFn) => {
    var s = new Media.Service();
    collections = new Media.Collections(s);
    done();
  });

  it("should allow setting a collection item list", (done:DoneFn) => {
    let result = collections.updateElement(COLLECTIONID, {
      items: ["/medialibrary/tracks/4b247930-a2ab-49bf-b8f4-9ae3b01b3cf2"]
    });
    expect(result.status).toEqual("ok");
    expect(result.error).toBeUndefined();
    /** check actual existence */
    result = collections.getElement(COLLECTIONID);
    expect(result.status).toEqual("ok");
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    let data = result.data.getValue().data;
    expect(data).toBeDefined();
    expect(data.items).toBeDefined();
    expect(data.items[0].uri).toEqual("/medialibrary/tracks/4b247930-a2ab-49bf-b8f4-9ae3b01b3cf2");
    done();
  });

  it("should reject setting erroneous collection item list", (done:DoneFn) => {
    let result = collections.updateElement(COLLECTIONID, {
      items: ["/medialibrary/tracks/4b247930-a2ab-49bf-b8f4-9ae3b01b3cf2","/medialibrary/tracks/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"]
    });
    expect(result.status).toEqual("error");
    expect(result.error).toBeDefined();
    done();
  });

  it("should allow creating a collection", (done:DoneFn) => {
    let result = collections.createElement({name:"foo"});
    expect(result.status).toEqual("ok");
    expect(result.error).toBeUndefined();
    done();
  });

  it("should NOT allow creating a collection without a name", (done:DoneFn) => {
    let result = collections.createElement({});
    expect(result.status).toEqual("error");
    expect(result.error).toBeDefined();
    done();
  });

  it("should allow creating a collection with an array of items", (done:DoneFn) => {
    let result = collections.createElement({name:"foo", items: ["/medialibrary/tracks/4b247930-a2ab-49bf-b8f4-9ae3b01b3cf2"]});
    expect(result.status).toEqual("ok");
    expect(result.error).toBeUndefined();

    /** check actual existence */
    result = collections.getElement(COLLECTIONID);
    expect(result.status).toEqual("ok");
    expect(result.error).toBeUndefined();
    expect(result.data).toBeDefined();
    let data = result.data.getValue().data;
    expect(data).toBeDefined();
    expect(data.items).toBeDefined();
    expect(data.items[0].uri).toEqual("/medialibrary/tracks/4b247930-a2ab-49bf-b8f4-9ae3b01b3cf2");
    done();
  });

  it("should reject creating a collection with an array of items that point to a non existing file", (done:DoneFn) => {
    let result = collections.createElement({name:"foo", items: ["/medialibrary/tracks/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"]});
    expect(result.status).toEqual("error");
    expect(result.error).toBeDefined();
    done();
  });
})




