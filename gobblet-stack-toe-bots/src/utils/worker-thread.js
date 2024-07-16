const { isMainThread, parentPort, workerData } = require('node:worker_threads');

if (isMainThread) {
    throw("worker-thread should not be invoked from main thread");
} else {
    const response = workerData.function(...workerData.params);
    if (response && typeof response.then === 'function') {
        response.then(r => parentPort.postMessage(r));
    } else {
        parentPort.postMessage(response)
    }
}