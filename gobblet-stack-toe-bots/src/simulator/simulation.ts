import Bot from '../bots/bot';
import BotFactory from '../bots/bot-factory';
import Simulator from './simulator';
import { logResult } from './simulation-result';

const [_tsPath, _filePath, mode, simulationsStr, bot1Name, bot2Name] = process.argv;

const errorMessage = `
Invalid arguments provided: ${process.argv}
${JSON.stringify({mode, simulationsStr, bot1Name, bot2Name})}
Usage: npm run simulation -- <beginner|classic> <simulations> <bot1> <bot2>
Example: npm run simulations -- classic 1000 random-bot random-bot
`

if (!mode || !simulationsStr || !bot1Name || !bot2Name || !parseInt(simulationsStr) || !['beginner', 'classic'].includes(mode)) {
    console.error(errorMessage);
    process.exit(1);
}

const simulations = parseInt(simulationsStr);
const bot1 = BotFactory.createBot(bot1Name);
const bot2 = BotFactory.createBot(bot2Name);

if (!bot1) {
    console.error(`Invalid bot: ${bot1Name}`);
    process.exit(1);
}

if (!bot2) {
    console.error(`Invalid bot: ${bot2Name}`);
    process.exit(1);
}

const simulator = new Simulator(mode, simulations, bot1, bot2, bot1Name, bot2Name);
const result = simulator.runSimulations();
logResult(result);