import {sayHello, sayGoodbye} from './hello-world';

describe('Hello world', () => {

    test('can say hi', () => {
        expect(sayHello()).toEqual('hi')
    });

    test('can say goodbye', () => {
        expect(sayGoodbye()).toEqual('goodbye')
    });
});