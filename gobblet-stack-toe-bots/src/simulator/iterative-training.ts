import { GameConfig } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import Trainer from '../bots/trainer';
import BotFactory from '../bots/bot-factory';
import getGameConfig from '../utils/game-config-utils';
import * as moment from 'moment';
import Simulator from './simulator';
import { logResult } from './simulation-result';
import * as path from 'path';
import * as fs from 'fs';

const [_tsPath, _filePath, mode, iterationsStr, simulationsStr, trainerName, bot1Name, bot2Name, outputFile] = process.argv;

const errorMessage = `
Invalid arguments provided: ${process.argv?.slice(2)}

Usage:   npm run itr-train -- <beginner|classic> <iterations> <simulations> <trainer> <bot1> <bot2> <output file>
Example: npm run itr-train -- beginner 10 100 matchbox-trainer matchbox-bot random-bot matchbox-brain.json
`

if (!mode || !iterationsStr || !parseInt(iterationsStr) || !simulationsStr || !parseInt(simulationsStr) || !trainerName
    || !bot1Name || !bot2Name  || !outputFile || !['beginner', 'classic'].includes(mode)
) {
    console.error(errorMessage);
    process.exit(1);
}

const trainer: Trainer<any> = BotFactory.createTrainer(trainerName);

if (!trainer) {
    console.error(`Invalid trainer: ${trainerName}`);
    process.exit(1);
}

const iterations = parseInt(iterationsStr);
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

const gameConfig: GameConfig = getGameConfig(mode);
const simulationDir = path.join(__dirname, '..', 'data', 'scrap', moment().format('YYYY-MM-DD HH.mm.ss'));
fs.mkdirSync(simulationDir);

async function iterativeTraining(): Promise<void> {
    for (let iteration = 0; iteration < iterations; iteration++) {
        console.log(`Running simulation #${iteration} ...`);
        const simulationOutputFile = path.join(simulationDir, `${iteration}.ndjson`);
        const simulator = new Simulator(mode, simulations, bot1, bot2, bot1Name, bot2Name, simulationOutputFile);
        const result = await simulator.runSimulations();
        logResult(result, iteration);

        await trainer.load(gameConfig, simulationOutputFile, outputFile);
        console.log(`Training #${iteration} ...`);
        const trainingStatus = await trainer.train();
        console.log(`Training #${iteration} status: ${JSON.stringify(trainingStatus)}`);
    }

}

iterativeTraining();