"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var helpers_1 = require("../helpers");
describe('splitEvent', function () {
    it('splitEvent should correctly group event parts', function (done) {
        var res = helpers_1.splitEvent('/mediacontent/albums/');
        expect(res.service).toBe('mediacontent');
        expect(res.resource).toBe('albums');
        expect(res.element).toBeUndefined();
        done();
    });
});
