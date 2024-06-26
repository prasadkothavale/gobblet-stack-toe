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

    private brain: SortedArray<MatchBox>;
    private player: Player;

    canPlay(gameConfig: GameConfig): boolean {
        return ['classic', 'beginner'].includes(getGameMode(gameConfig));
    }

    onLoad(gameConfig: GameConfig): void {
        const mode = getGameMode(gameConfig);
        const data: MatchBox[] = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, '..', 'data', 'brain', `${mode}-matchbox-brain.json`), 
                {encoding: 'utf8', flag: 'r'})
        );
        this.brain = new SortedArray<MatchBox>(matchBoxComparator);
    }

    onNewGame(gameConfig: GameConfig, player: Player): void {
        this.player = player;
    }
    
    playMove(game: Game): Move {
        const moves: Move[] = GameEngine.getValidMoves(game);
        return this.player === Player.WHITE? this.getBestWhiteMove(moves, game) : this.getBestBlackMove(moves, game);
    }
    
    private getBestWhiteMove(moves: Move[], game: Game): Move {
        let min = null;
        let bestMove: Move = null;

        moves.forEach(move => {
            const score = this.getMoveScore(move, game);
            if (min === null || score < min) {
                min = score;
                bestMove = move;
            }
        });

        return bestMove;
    }

    private getBestBlackMove(moves: Move[], game: Game): Move {
        let max = null;
        let bestMove: Move = null;

        moves.forEach(move => {
            const score = this.getMoveScore(move, game);
            if (max === null || score > max) {
                max = score;
                bestMove = move;
            }
        });

        return bestMove;
    }

    private getBestMove(moves: Move[], game: Game): Move {
        const moveMatchBox:MoveMatchBox = moves.map((move: Move): MoveMatchBox => ({
            move, matchbox: this.getMatchbox(move, game), score: 0
        }));
    }

    private getMatchbox(move: Move, game: Game): MatchBox {
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

export function matchBoxComparator(m1: MatchBox, m2: MatchBox): number {
    return m1.boardNumber === m2.boardNumber? 
        compareTo(BigInt(m1.externalStackNumber), BigInt(m2.externalStackNumber)) : 
        compareTo(BigInt(m1.boardNumber), BigInt(m2.boardNumber));
}

export function compareTo(b1: bigint, b2: bigint): number {
    return b1 === b2? 0 : b1 < b2? -1 : 1;
}

export interface MatchBox {
    boardNumber: string;
    externalStackNumber: string;
    whiteWins?: number;
    blackWins?: number;
    draws?: number;
}

interface MoveMatchBox {
    move: Move;
    matchbox: MatchBox;
    score: number;
}