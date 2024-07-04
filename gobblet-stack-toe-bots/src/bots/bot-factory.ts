import Bot from './bot';
import RandomBot from './random-bot';
import SimpleNNBot from './simple-nn-bot';
import SimpleNNTrainer from './simple-nn-trainer';
import MatchboxBot from './matchbox-bot';
import MatchboxTrainer from './matchbox-trainer';
import Trainer from './trainer';
import HeuristicBot from './heuristic-bot';

const bots: Map<string, BotSupplier> = new Map();
bots.set('random-bot', () => new RandomBot());
bots.set('simple-nn-bot', () => new SimpleNNBot());
bots.set('matchbox-bot', () => new MatchboxBot());
bots.set('heuristic-bot-1', () => new HeuristicBot(1));
bots.set('heuristic-bot-2', () => new HeuristicBot(2));
bots.set('heuristic-bot-3', () => new HeuristicBot(3));

const trainers: Map<string, TrainerSupplier> = new Map();
trainers.set('simple-nn-trainer', () => new SimpleNNTrainer());
trainers.set('matchbox-trainer', () => new MatchboxTrainer());

export interface BotSupplier {
    (): Bot;
}

export interface TrainerSupplier {
    (): Trainer<any>;
}

export default class BotFactory {

    static createBot(botName: string): Bot {
        return bots.get(botName)();
    }

    static createTrainer(trainerName: string): Trainer<any> {
        return trainers.get(trainerName)();
    }
}