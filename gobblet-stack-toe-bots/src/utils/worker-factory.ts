import { Worker } from 'node:worker_threads';
import Queue from './queue';
import os = require('os');
import path = require('path');

const cpuCores = os.cpus().length;
export default class WorkerFactory<P, R> {
    private static maxWorkers = cpuCores > 2? cpuCores - 1 : cpuCores;
    private static activeWorkers = 0;
    private queue: Queue<JobItem<P, R>> = new Queue();


    public submitJob(job: WorkerJob<P, R>): Promise<R> {
        return new Promise((resolve, reject) => {
            if (WorkerFactory.activeWorkers < WorkerFactory.maxWorkers) {
                WorkerFactory.activeWorkers++;
                this.executeJob(job).then(resolve).catch(reject);
            } else {
                this.queue.add({resolve, reject, job});
            }
        });
    }

    private executeJob(workerData: WorkerJob<P, R>): Promise<R> {
        return new Promise((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, 'worker-thread.js'), {workerData});
            worker.on('message', resolve);
            worker.on('error', reject);
            worker.on('exit', (code) => {
                if (code === 0) {
                    if (!this.queue.isEmpty()) {
                        const jobItem = this.queue.remove();
                        this.executeJob(jobItem.job).then(jobItem.resolve).catch(jobItem.reject);
                    } 
                } else {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }

    
}

export interface WorkerJob<P, R> {
    function: (param: P) => R;
    param: P;
}

interface JobItem<P, R> {
    resolve: (value: R | PromiseLike<R>) => void;
    reject: (reason?: any) => void;
    job: WorkerJob<P, R>;
}