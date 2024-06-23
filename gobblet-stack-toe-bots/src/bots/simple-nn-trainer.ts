import { GameConfig, GameStatus, Gobblet, Player } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import { Trainer, TrainingData } from "./bot";
import { SimulatedGame } from "../simulator/simulation-result";
import GameEngine from "@aehe-games/gobblet-stack-toe-engine/src/game-engine";
import SizedStack from "@aehe-games/gobblet-stack-toe-engine/src/sized-stack";
import { writeNuralNetwork } from "../utils/file-utils";
import * as brain from "../../lib/brain.js";
import * as path from 'path';
import * as fs from 'fs';
import * as ndjson from 'ndjson';

export class SimpleNNTrainer implements Trainer {

    private gameConfig: GameConfig;
    private inputFile: string;
    private outputFile: string;
    private trainingData: TrainingData[];


    public load(gameConfig: GameConfig, inputFile: string, outputFile: string) : Promise<void> {
        this.gameConfig = gameConfig;
        this.inputFile = inputFile;
        this.outputFile = outputFile;
        this.trainingData = [];
        
        return new Promise((resolve, reject) => {
            const inputPath = path.join(__dirname, '..', 'data', this.inputFile);
            fs.createReadStream(inputPath)
                .pipe(ndjson.parse())
                .on('data', (simulatedGame: SimulatedGame) => this.toTrainingData(simulatedGame))
                .on('end', () => resolve())
                .on('error', (error) => reject(error));
        });
    }

    public async train(): Promise<any> {
        const network = new brain.NeuralNetwork();
        const trainingStatus = network.train(this.trainingData);
        await writeNuralNetwork(this.outputFile, network)
        return trainingStatus;
    }

    private toTrainingData(simulatedGame: SimulatedGame): void {
        const output: number[] = [simulatedGame.gameStatus === GameStatus.END ? simulatedGame.winner === Player.WHITE ? 0 : 1 : 0.5];
        simulatedGame.boardHistory.forEach((boardNumber: string, index: number) => {
            const board: SizedStack<Gobblet>[][] = GameEngine.getBoard(BigInt(boardNumber), this.gameConfig);
            const externalStack: SizedStack<Gobblet>[] = GameEngine.getExternalStack(BigInt(simulatedGame.externalStackHistory[index]), this.gameConfig);

            const input: number[] = [];
            board.forEach((row: SizedStack<Gobblet>[]) => {
                row.forEach((cell: SizedStack<Gobblet>) => {
                    input.push(cell.isEmpty() ? 0.5 : cell.peek().player === Player.WHITE? 0 : 1);
                })
            });
            externalStack.forEach((cell: SizedStack<Gobblet>) => {
                input.push(cell.isEmpty() ? 0.5 : cell.peek().player === Player.WHITE? 0 : 1);
            });

            this.trainingData.push({input, output});
        });
    }

}