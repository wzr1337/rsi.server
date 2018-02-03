

import { splitEvent } from '../helpers';

describe('splitEvent', () => {
    it('splitEvent should correctly group event parts', (done) => {
        const res:any = splitEvent('/mediacontent/albums/');
        expect(res.service).toBe('mediacontent');
        expect(res.resource).toBe('albums');
        expect(res.element).toBeUndefined();
        done();
    });
});
