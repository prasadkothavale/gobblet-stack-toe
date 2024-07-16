const {
    Worker, isMainThread, parentPort, workerData,
} = require('node:worker_threads');
const cliProgress = require('cli-progress');

function findPrimeFactors(num) {
    const input = num
    const factors = [];
    for (let i = 2; i <= num; i++) {
        while (num % i === 0) {
            factors.push(i);
            num /= i;
        }
    };
    return factors;
}

function findPrimeFactorsAsync(num) {
    return new Promise(resolve => {
        const primeFactors = findPrimeFactors(num);
        resolve(primeFactors);
    });
}

function generateNumber() {
    const min = 1000000;
    const max = 9999999;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function executeInSingleThread(iterations) {
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(iterations, 0);
    const start = new Date().getTime();
    for (let iteration = 0; iteration < iterations; iteration++) {
        const number = generateNumber()
        const factors = findPrimeFactors(number);

        if (iteration % 100 === 0) {
            bar.update(iteration);
        }
    }
    bar.update(iterations);
    const end = new Date().getTime();
    bar.stop();
    console.log(`Single thread execution took ${end - start} ms`);
}

function executeWorker(iterationsPerPool) {
    const poolSize = 8
    const iterations = iterationsPerPool * poolSize;
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    bar.start(iterations, 0);
    const start = new Date().getTime();
    let completed = 0;
    const promises = [];

    for (let pool = 0; pool < poolSize; pool++) {
        promises.push(new Promise((resolve, reject) => {
            const workerData = [];
            const responses = [];
            for(let i = 0; i<iterations; i++) {
                workerData.push(generateNumber());
            }
            const worker = new Worker(__filename, {workerData});
            worker.on('message', (response) => {
                completed++;
                if (completed % 100 === 0) {
                    bar.update(completed);
                }
                responses.push(response);
                if (responses.length === iterationsPerPool) {
                    resolve(responses);
                }
            });
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code !== 0)
                    reject(new Error(`Worker stopped with exit code ${code}`));
            });
        }));
    }

    return Promise.all(promises).then(() => {
        bar.update(iterations);
        const end = new Date().getTime();
        bar.stop();
        console.log(`Multi thread execution took ${end - start} ms`);
        process.exit(0)
    });
};


if (isMainThread) {
    const iterations = 8 * 1250;
    executeInSingleThread(iterations);
    executeWorker(1250);
} else {
    for (let num of workerData) {
        const factors = findPrimeFactors(num);
        parentPort.postMessage(factors)
    }
}