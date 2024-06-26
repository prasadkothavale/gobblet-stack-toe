import { GameConfig, Player } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import SortedArray from "@aehe-games/gobblet-stack-toe-engine/src/sorted-array";
import Trainer from "./trainer";
import { SimulatedGame } from "../simulator/simulation-result";
import * as fs from 'fs';
import * as path from 'path';
import { MatchBox, matchBoxComparator } from "./matchbox-bot";
import { getMinBoardNumber, getMinExternalStackNumber } from '../utils/board-utils';
import { getGameMode } from "../utils/game-config-utils";

export default class MatchboxTrainer extends Trainer<TrainingData> {

    public async train(): Promise<any> {

        const mode = getGameMode(this.gameConfig);
        const data: MatchBox[] = JSON.parse(
            await fs.promises.readFile(
                path.join(__dirname, '..', 'data', 'brain', `${mode}-matchbox-brain.json`), 
                {encoding: 'utf8', flag: 'r'})
        );
        const brain: SortedArray<MatchBox> = new SortedArray<MatchBox>(matchBoxComparator);
        console.log(`Loaded ${mode} matchbox brain with ${data.length} matchboxes`);

        this.trainingData.forEach((data: TrainingData) => {
            const boardNumber: string = getMinBoardNumber(BigInt(data.boardNumber), this.gameConfig).toString();
            const externalStackNumber: string = getMinExternalStackNumber(BigInt(data.externalStackNumber), this.gameConfig).toString();
            
            let matchbox: MatchBox = brain.find({boardNumber, externalStackNumber});
            if(!matchbox) {
                matchbox = this.createInitialMatchbox(boardNumber, externalStackNumber);
                brain.push(matchbox);
            }
            this.updateMatchbox(matchbox, data.winner);
        });

        const trainedData = brain.toArray();
        console.log(`Trained ${mode} matchbox brain has ${trainedData.length} matchboxes`);
        await fs.promises.writeFile(
            path.join(__dirname, '..', 'data', 'brain',`${mode}-matchbox-brain.json`), 
            JSON.stringify(trainedData), 
            {encoding: 'utf8', flag: 'w'}
        );
            
    }

    toTrainingData(simulatedGame: SimulatedGame): void {
        simulatedGame.boardHistory.forEach((boardNumberStr: string, index: number) => {
            const boardNumber: bigint = BigInt(boardNumberStr);
            const externalStackNumber: bigint = BigInt(simulatedGame.externalStackHistory[index]);
            this.trainingData.push({
                boardNumber: boardNumber,
                externalStackNumber: externalStackNumber,
                winner: simulatedGame.winner
            });
        });
    }

    private createInitialMatchbox(boardNumber: string, externalStackNumber: string): MatchBox {
        return {boardNumber, externalStackNumber, whiteWins: 0, blackWins: 0, draws: 0};
    }

    private updateMatchbox(matchbox: MatchBox, winner: Player): void {
        if(winner === Player.WHITE) {
            matchbox.whiteWins++;
        } else if(winner === Player.BLACK) {
            matchbox.blackWins++;
        } else {
            matchbox.draws++;
        }
    }

}

interface TrainingData {
    boardNumber: bigint;
    externalStackNumber: bigint;
    winner: Player;
}