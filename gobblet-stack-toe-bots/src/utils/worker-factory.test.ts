import WorkerFactory from "./worker-factory";

function generateNumber() {
    const min = 10000;
    const max = 99999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findPrimeFactors(num: number): number[] {
    const factors = [];
    for (let i = 2; i <= num; i++) {
        while (num % i === 0) {
            factors.push(i);
            num /= i;
        }
    };
    return factors;
}


describe('Worker factory', () => {

    test('can manage job queue and execute jobs in multiple threads', async() => {
        const testData = [];
        const dataSize = 10;
        for (let i = 0; i < dataSize; i++) {
            testData.push(generateNumber());
        }

        const start = new Date().getTime();
        const answers = {};
        testData.forEach(number => answers[number] = findPrimeFactors(number));
        const split = new Date().getTime();

        const workerFactory = new WorkerFactory<number, number[]>();
        const workerAnswers = {};
        await Promise.all(
            testData.map(number => workerFactory.submitJob('', number)
                .then(factors => workerAnswers[number] = factors))
        );
        const end = new Date().getTime();

        expect(workerAnswers).toEqual(answers);
        console.log([
            'Worker Factory Performance Stats',
            '==============================',
            `Generated: ${dataSize}, found ${Object.keys(workerAnswers).length}`,
            `Default search: ${split - start} ms`,
            `Worker factory: ${end - split} ms`,
            '------------------------------'
        ].join('\n'));

    });
});