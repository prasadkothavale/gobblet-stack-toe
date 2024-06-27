import { GameConfig, Player, Game, Move, Gobblet } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import Bot from "./bot";
import { getGameMode } from "../utils/game-config-utils";
import * as fs from 'fs';
import * as path from 'path';
import SortedArray from "@aehe-games/gobblet-stack-toe-engine/src/sorted-array";
import GameEngine from "@aehe-games/gobblet-stack-toe-engine/src/game-engine";
import SizedStack from "@aehe-games/gobblet-stack-toe-engine/src/sized-stack";
import { getMinBoardNumber, getMinExternalStackNumber } from "../utils/board-utils";

export default class MatchboxBot implements Bot {

    private brain: SortedArray<Matchbox>;
    private player: Player;
    private randomness: number = 0.2;
    private learningRate: number = 1;
    private threshold: number = 0;

    canPlay(gameConfig: GameConfig): boolean {
        return ['classic', 'beginner'].includes(getGameMode(gameConfig));
    }

    onLoad(gameConfig: GameConfig): void {
        const mode = getGameMode(gameConfig);
        const data: Matchbox[] = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, '..', 'data', 'brain', `${mode}-matchbox-brain.json`), 
                {encoding: 'utf8', flag: 'r'})
        );
        this.brain = new SortedArray<Matchbox>(matchBoxComparator);
        this.brain.loadSortedArray(data, matchBoxComparator);
    }

    onNewGame(gameConfig: GameConfig, player: Player): void {
        this.player = player;
    }
    
    playMove(game: Game): Move {
        const moves: Move[] = GameEngine.getValidMoves(game);
        if (Math.random() <= this.randomness) {
            return moves[Math.round(Math.random() * (moves.length - 1))];
        }

        let totalXp = 0;
        const moveMatchboxes: MoveMatchbox[] = moves.map((move: Move) => {
            const matchbox: Matchbox = this.getMatchbox(move, game);
            const xp = matchbox? matchbox.whiteWins + matchbox.blackWins + matchbox.draws : 0;
            totalXp += xp;
            const score = matchbox && xp > 0? this.player === Player.WHITE ? 
                (2*matchbox.whiteWins + matchbox.draws)/xp : 
                (2*matchbox.blackWins + matchbox.draws)/xp : 0;
            return {move, matchbox, score, xp};
        });

        const minXp = this.threshold * totalXp / moves.length;
        if (Math.random() <= this.learningRate) {
            // play less confident best move to learn a new move
            const lessConfidentMoves: MoveMatchbox[] = moveMatchboxes.filter((moveMatchBox: MoveMatchbox) => moveMatchBox.xp <= minXp);
            return this.getBestMove(lessConfidentMoves.length > 0? lessConfidentMoves: moveMatchboxes, false);
        } else {
            // play known best move
            return this.getBestMove(moveMatchboxes.filter((moveMatchBox: MoveMatchbox) => moveMatchBox.xp > minXp), true);
        }

    }

    private getBestMove(moveMatchboxes: MoveMatchbox[], xpMatters: boolean): Move {
        let bestMoveMatchbox: MoveMatchbox = null;
        moveMatchboxes.forEach((moveMatchbox: MoveMatchbox) => {
            if(!bestMoveMatchbox) {
                bestMoveMatchbox = moveMatchbox;
            } else {
                if(moveMatchbox.score === bestMoveMatchbox.score) {
                    if (!xpMatters || bestMoveMatchbox.xp === moveMatchbox.xp) {
                        bestMoveMatchbox = [bestMoveMatchbox, moveMatchbox][Math.round(Math.random())];
                    } else {
                        bestMoveMatchbox = moveMatchbox.xp > bestMoveMatchbox.xp ? moveMatchbox : bestMoveMatchbox
                    }
                } else {
                    bestMoveMatchbox = moveMatchbox.score > bestMoveMatchbox.score? moveMatchbox : bestMoveMatchbox;
                }
            }
        });
        return bestMoveMatchbox.move;
    }

    private getMatchbox(move: Move, game: Game): Matchbox {
        const source = move.source;
        const target = move.target;
        const board: SizedStack<Gobblet>[][] = GameEngine.getBoard(GameEngine.getBoardNumber(game.board, game.config), game.config);
        const externalStack: SizedStack<Gobblet>[] = GameEngine.getExternalStack(GameEngine.getExternalStackNumber(game.externalStack, game.config), game.config);
        const sourceStack: SizedStack<Gobblet> = source.board ? board[source.y][source.x] : externalStack[source.y];
        const targetStack: SizedStack<Gobblet> = board[target.y][target.x];
        targetStack.push(sourceStack.pop());

        const boardNumber = getMinBoardNumber(GameEngine.getBoardNumber(game.board, game.config), game.config).toString();
        const externalStackNumber = getMinExternalStackNumber(GameEngine.getExternalStackNumber(game.externalStack, game.config), game.config).toString();
        return this.brain.find({boardNumber, externalStackNumber});
    }

}

export function matchBoxComparator(m1: Matchbox, m2: Matchbox): number {
    return m1.boardNumber === m2.boardNumber? 
        compareTo(BigInt(m1.externalStackNumber), BigInt(m2.externalStackNumber)) : 
        compareTo(BigInt(m1.boardNumber), BigInt(m2.boardNumber));
}

export function compareTo(b1: bigint, b2: bigint): number {
    return b1 === b2? 0 : b1 < b2? -1 : 1;
}

export interface Matchbox {
    boardNumber: string;
    externalStackNumber: string;
    whiteWins?: number;
    blackWins?: number;
    draws?: number;
}

interface MoveMatchbox {
    move: Move;
    matchbox: Matchbox;
    score: number;
    xp: number;
}