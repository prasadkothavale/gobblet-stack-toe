import { GameConfig } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import Bot, { Trainer } from '../bots/bot';
import BotFactory from '../bots/bot-factory';
import getGameConfig from '../utils/game-config-utils';
const [_tsPath, _filePath, mode, trainerName, inputFile, outputFile] = process.argv;

const errorMessage = `
Invalid arguments provided: ${process.argv?.slice(2)}

Usage:   npm run training -- <beginner|classic> <trainer> <input file> <output file>
Example: npm run training -- beginner simple-nn-trainer random-1000.ndjson simple-nn-brain.json
`

if (!mode || !trainerName || !inputFile || !outputFile || !['beginner', 'classic'].includes(mode)) {
    console.error(errorMessage);
    process.exit(1);
}

const trainer: Trainer = BotFactory.createTrainer(trainerName);

if (!trainer) {
    console.error(`Invalid trainer: ${trainerName}`);
    process.exit(1);
}

const gameConfig: GameConfig = getGameConfig(mode);

async function train(): Promise<void> {
    await trainer.load(gameConfig, inputFile, outputFile);
    console.log('Trainer loaded');
    const trainingStatus = await trainer.train();
    console.log(`Training status: ${JSON.stringify(trainingStatus)}`);
}
train();