import Queue from './queue';

describe('Queue', () => {

    test('can add and remove elements', () => {
        const q = new Queue();
        q.add(1);
        q.add(2);
        expect(q.isEmpty()).toBeFalsy();
        expect(q.remove()).toBe(1);
        expect(q.remove()).toBe(2);
        expect(q.isEmpty()).toBeTruthy();
    });
});