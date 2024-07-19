import { Worker } from 'node:worker_threads';
import Queue from './queue';
import os = require('os');

const cpuCores = os.cpus().length;
export default class WorkerFactory<InputType, ResponseType> {
    private static maxWorkers = cpuCores > 2? cpuCores - 1 : cpuCores;
    private static activeWorkers = 0;

    private queue: Queue<JobItem<InputType, ResponseType>> = new Queue();

    public submitJob(workerThread: string, workerData: InputType): Promise<ResponseType> {
        return new Promise((resolve, reject) => {
            if (WorkerFactory.activeWorkers < WorkerFactory.maxWorkers) {
                WorkerFactory.activeWorkers++;
                this.executeJob(workerThread, workerData).then(resolve).catch(reject);
            } else {
                this.queue.add({resolve, reject, workerThread, workerData});
            }
        });
    }

    private executeJob(workerThread: string, workerData: InputType): Promise<ResponseType> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(workerThread, {workerData});
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code === 0) {
                    if (!this.queue.isEmpty()) {
                        const jobItem = this.queue.remove();
                        this.executeJob(jobItem.workerThread, jobItem.workerData).then(jobItem.resolve).catch(jobItem.reject);
                    } else {
                        WorkerFactory.activeWorkers--;
                    }
                } else {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }

    
}

interface JobItem<InputType, ResponseType> {
    resolve: (value: ResponseType | PromiseLike<ResponseType>) => void;
    reject: (reason?: Error) => void;
    workerThread: string;
    workerData: InputType;
}