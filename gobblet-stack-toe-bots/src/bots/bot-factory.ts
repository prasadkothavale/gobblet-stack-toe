import Bot from './bot';
import RandomBot from './random-bot';

const bots: Map<string, BotSupplier> = new Map();
bots.set('random-bot', () => new RandomBot());

export interface BotSupplier {
    (): Bot;
}

export default class BotFactory {

    static createBot(botName: string): Bot {
        return bots.get(botName)();
    }
}