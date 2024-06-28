import { GameConfig, Player, Game, Move, Gobblet, BoardAndExternalStack, GameState, GameStatus } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
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
    private randomness: number = 0;
    private learningRate: number = 0;
    private threshold: number = 0;
    private depth: number = 5;

    public canPlay(gameConfig: GameConfig): boolean {
        return ['classic', 'beginner'].includes(getGameMode(gameConfig));
    }

    public onLoad(gameConfig: GameConfig): void {
        const mode = getGameMode(gameConfig);
        const data: Matchbox[] = JSON.parse(
            fs.readFileSync(
                path.join(__dirname, '..', 'data', 'brain', `${mode}-matchbox-brain.json`), 
                {encoding: 'utf8', flag: 'r'})
        );
        this.brain = new SortedArray<Matchbox>(matchBoxComparator);
        this.brain.loadSortedArray(data, matchBoxComparator);
    }

    public onLoadFromUI(gameConfig: GameConfig, data: Matchbox[]) {
        this.brain = new SortedArray<Matchbox>(matchBoxComparator);
        this.brain.loadSortedArray(data, matchBoxComparator);
    }

    public onNewGame(gameConfig: GameConfig, player: Player): void {
        this.player = player;
    }
    
    public playMove(game: Game): Move {
        const moves: Move[] = GameEngine.getValidMoves(game);
        if (Math.random() <= this.randomness) {
            return moves[Math.round(Math.random() * (moves.length - 1))];
        }
        const moveMatchboxes: MoveMatchbox[] = this.minMax(game.board, game.externalStack, game.config, moves, this.player, this.depth);
        
        let totalXp = 0;
        moveMatchboxes.forEach((matchBox: MoveMatchbox) => totalXp += matchBox.xp);
        const minXp = this.threshold * totalXp / moves.length;
        if (Math.random() <= this.learningRate) {
            // play less confident best move to learn a new move
            const lessConfidentMoves: MoveMatchbox[] = moveMatchboxes.filter((moveMatchBox: MoveMatchbox) => moveMatchBox.xp <= minXp);
            return this.getBestMove(lessConfidentMoves.length > 0? lessConfidentMoves: moveMatchboxes, false, this.player);
        } else {
            // play known best move
            const confidentMoves: MoveMatchbox[] = moveMatchboxes.filter((moveMatchBox: MoveMatchbox) => moveMatchBox.xp > minXp);
            return this.getBestMove(confidentMoves.length > 0? confidentMoves: moveMatchboxes, true, this.player);
        }
    }

    public minMax(board: SizedStack<Gobblet>[][], externalStack: SizedStack<Gobblet>[], config: GameConfig, moves: Move[], player: Player, depth: number): MoveMatchbox[] {
        if (depth === 0) {
            return moves.map((move: Move) => {
                const matchbox: Matchbox = this.getMatchbox(move, board, externalStack, config);
                const xp = matchbox? matchbox.whiteWins + matchbox.blackWins + matchbox.draws : 0;
                return {move, matchbox, xp, endGame: false};
            });
        } else {
            return moves.map((move: Move) => {
                const next: BoardAndExternalStack = GameEngine.dryRunValidMove(move, board, externalStack, config);
                const nextPlayer: Player = player === Player.WHITE? Player.BLACK : Player.WHITE;
                const gameState: GameState = GameEngine.getGameState(next.board, [], config);
                
                if (gameState.status === GameStatus.LIVE) {
                    const nextMoves: Move[] = GameEngine.getValidMovesForBoard(next.board, next.externalStack, nextPlayer, config.boardSize);
                    const moveMatchboxes: MoveMatchbox[] = this.minMax(next.board, next.externalStack, config, nextMoves, nextPlayer, depth - 1);
                    const bestNextMoveMatchbox =  this.getBestMoveMatchBox(moveMatchboxes, true, nextPlayer);
                    return Object.assign(bestNextMoveMatchbox, {move, endGame: false});
                } else {
                    const matchbox: Matchbox = this.getMatchbox(move, board, externalStack, config);
                    const xp = matchbox? matchbox.whiteWins + matchbox.blackWins + matchbox.draws : 0;
                    return {move, matchbox, xp, endGame: true};
                }
            });
        }
    }

    public getScore(matchbox: Matchbox, xp: number, player: Player) {
        return matchbox && xp > 0 ? player === Player.WHITE ?
            (2 * matchbox.whiteWins + matchbox.draws) / xp :
            (2 * matchbox.blackWins + matchbox.draws) / xp : 0;
    }

    private getBestMove(moveMatchboxes: MoveMatchbox[], xpMatters: boolean, player: Player): Move {
        return this.getBestMoveMatchBox(moveMatchboxes, xpMatters, player).move;
    }

    private getBestMoveMatchBox(moveMatchboxes: MoveMatchbox[], xpMatters: boolean, player: Player): MoveMatchbox {
        let bestMoveMatchbox: MoveMatchbox = null;
        let bestScore = 0
        moveMatchboxes.forEach((moveMatchbox: MoveMatchbox) => {
            const moveMatchboxScore = this.getScore(moveMatchbox.matchbox, moveMatchbox.xp, player);
            if(!bestMoveMatchbox) {
                bestMoveMatchbox = moveMatchbox;
                bestScore = moveMatchboxScore;
            } else {
                if(moveMatchboxScore === bestScore) {
                    if (!xpMatters || bestMoveMatchbox.xp === moveMatchbox.xp || (bestMoveMatchbox.endGame && moveMatchbox.endGame)) {
                        // current move and best move are same in all aspects, so select a random from both,
                        bestMoveMatchbox = [bestMoveMatchbox, moveMatchbox][Math.round(Math.random())];
                    } if (moveMatchbox.endGame) {
                        // end game with best score is the best move
                        bestMoveMatchbox = moveMatchbox;
                    } else {
                        // when score is same, move with more xp is best move
                        bestMoveMatchbox = moveMatchbox.xp > bestMoveMatchbox.xp ? moveMatchbox : bestMoveMatchbox
                    }
                } else {
                    // move with higher score is the best move
                    bestMoveMatchbox = moveMatchboxScore > bestScore? moveMatchbox : bestMoveMatchbox;
                    bestScore = moveMatchboxScore > bestScore? moveMatchboxScore : bestScore;
                }
            }
        });
        return bestMoveMatchbox;
    }

    private getMatchbox(move: Move, _board: SizedStack<Gobblet>[][], _externalStack: SizedStack<Gobblet>[], config: GameConfig): Matchbox {
        const {board, externalStack} = GameEngine.dryRunValidMove(move, _board, _externalStack, config);
        const boardNumber = getMinBoardNumber(GameEngine.getBoardNumber(board, config), config).toString();
        const externalStackNumber = getMinExternalStackNumber(GameEngine.getExternalStackNumber(externalStack, config), config).toString();
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

export interface MoveMatchbox {
    move: Move;
    matchbox: Matchbox;
    xp: number;
    endGame: boolean;
}