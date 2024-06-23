import Bot, { Trainer } from './bot';
import RandomBot from './random-bot';
import SimpleNNBot from './simple-nn-bot';
import { SimpleNNTrainer } from './simple-nn-trainer';

const bots: Map<string, BotSupplier> = new Map();
bots.set('random-bot', () => new RandomBot());
bots.set('simple-nn-bot', () => new SimpleNNBot());

const trainers: Map<string, TrainerSupplier> = new Map();
trainers.set('simple-nn-trainer', () => new SimpleNNTrainer());

export interface BotSupplier {
    (): Bot;
}

export interface TrainerSupplier {
    (): Trainer;
}

export default class BotFactory {

    static createBot(botName: string): Bot {
        return bots.get(botName)();
    }

    static createTrainer(trainerName: string): Trainer {
        return trainers.get(trainerName)();
    }
}