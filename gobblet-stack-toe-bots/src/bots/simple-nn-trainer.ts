import { GameStatus, Gobblet, Player } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import Trainer from "./trainer";
import { SimulatedGame } from "../simulator/simulation-result";
import GameEngine from "@aehe-games/gobblet-stack-toe-engine/src/game-engine";
import SizedStack from "@aehe-games/gobblet-stack-toe-engine/src/sized-stack";
import { writeNeuralNetwork } from "../utils/file-utils";
import * as brain from "../../lib/brain.js";

export default class SimpleNNTrainer extends Trainer<TrainingData> {

    public async train(): Promise<any> {
        const network = new brain.NeuralNetwork();
        const trainingStatus = network.train(this.trainingData);
        await writeNeuralNetwork(this.outputFile, network)
        return trainingStatus;
    }

    toTrainingData(simulatedGame: SimulatedGame): void {
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

interface TrainingData {
    input: number[];
    output: number[];
}