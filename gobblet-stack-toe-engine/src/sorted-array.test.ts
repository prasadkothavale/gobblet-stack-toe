import SortedArray from "./sorted-array";

describe('Sorted array', () => {

    test('can insert numbers and search', () => {
        const sa: SortedArray<number> = new SortedArray((a: number, b: number) => a - b);
        sa.push(3);
        sa.push(5);
        sa.push(1);
        expect(sa.toArray()).toEqual([1, 3, 5]);
        expect(sa.includes(4)).toBeFalsy();
        sa.push(2);
        sa.push(4);
        expect(sa.toArray()).toEqual([1, 2, 3, 4, 5]);
        expect(sa.includes(2)).toBeTruthy();
    });

    test('random insertion and searching performance test', () => {
        const testSize = 10**4
        const numbers: bigint[] = [];
        const search: bigint[] = [];
        const sa: SortedArray<bigint> = new SortedArray((a: bigint, b: bigint) => a - b);

        const start = new Date().getTime();
        for (let i = 0; i < testSize; i++) {
            numbers.push(BigInt(Math.round(testSize * Math.random())))
            search.push(BigInt(Math.round(testSize * Math.random())))
        }
        const expectedAnswers: boolean[] = search.map(number => numbers.includes(number));
        
        const split = new Date().getTime();
        numbers.forEach(number => sa.push(number));
        const actualAnswers: boolean[] = search.map(number => sa.includes(number));
        const end = new Date().getTime();
    

        /*console.log([
            'Sorted Array Performance Stats',
            '==============================',
            `searched: ${testSize}, found ${actualAnswers.filter(x => x).length}`,
            `Default search: ${split - start} ms`,
            `Binary search: ${end - split} ms`,
            '------------------------------'
        ].join('\r\n'));*/



        expect(actualAnswers).toEqual(expectedAnswers);
    });

});