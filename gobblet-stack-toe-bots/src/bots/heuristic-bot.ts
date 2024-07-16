import { BoardAndExternalStack, Game, GameConfig, GameState, GameStatus, Gobblet, Move, Player } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import Bot from './bot';
import SizedStack from '@aehe-games/gobblet-stack-toe-engine/src/sized-stack';
import { getGameMode } from '../utils/game-config-utils';
import SortedArray from '@aehe-games/gobblet-stack-toe-engine/src/sorted-array';
import * as wt from 'worker-thread';

const cellScores = {
    'beginner' : [[3, 2, 3], [2, 4, 2], [3, 2, 3]],
    'classic' : [[3, 2, 2, 3], [2, 3, 3, 2], [2, 3, 3, 2], [3, 2, 2, 3]]
}

export default class HeuristicBot implements Bot {

    player: Player;
    private depth: number;
    mode: string;
    private cache: Map<Player, Map<number, SortedArray<BoardNumberScore>>> = new Map<Player, Map<number, SortedArray<BoardNumberScore>>>();
    private enableCaching: boolean = true;
    private cpus: number;

    constructor (depth: number) {
        this.depth = depth;
        this.cpus = 16; // TODO: caller should pass the value either using navigator.hardwareConcurrency or os.cpus().length
    }

    public canPlay(gameConfig: GameConfig): boolean {
        return ['classic', 'beginner'].includes(getGameMode(gameConfig) || '');
    }

    public onLoad(gameConfig: GameConfig): void {
        this.mode = getGameMode(gameConfig) || null;
    }

    public playMove(game: Game): Promise<Move> {
        /*const moves: Move[] = GameEngine.getValidMoves(game);
        const scoreBoards: MoveScore[] = moves.map((nextMove: Move) => 
            this.minMax(game.board, game.externalStack, game.config, nextMove, this.player, this.depth, [nextMove.toNotation()]));
        const moveScore: MoveScore = this.getBestScoreBoard(scoreBoards, this.player)
        return moveScore.move;*/
        return this.playMoveAsync(game, null);
    }

    public onNewGame(gameConfig: GameConfig, player: Player): void {
        this.player = player;
    }

    public minMax(board: SizedStack<Gobblet>[][], externalStack: SizedStack<Gobblet>[], config: GameConfig, move: Move, player: Player, depth: number, tree: string[]): MoveScore {
        const next: BoardAndExternalStack = GameEngine.dryRunValidMove(move, board, externalStack, config);
        const gameState: GameState = GameEngine.getGameState(next.board, [], config);
        const boardNumber = GameEngine.getBoardNumber(next.board, config);

        if (this.enableCaching) {
            const cacheScore = this.getCachedScore(player, depth, boardNumber);
            if (cacheScore) {
                return { score: cacheScore, move, boardNumber, player, tree};
            }
        }

        let moveScoreBoard: MoveScore;
        if (gameState.status !== GameStatus.LIVE) {
            const score = gameState.winner? gameState.winner === Player.WHITE ? 1 : -1 : 0;
            moveScoreBoard = { score, move, boardNumber, player, tree }
        } else if (depth === 0) {
            const score = this.getHeuristicScore(next.board, this.mode);
            moveScoreBoard = { score, move, boardNumber, player, tree };
        } else {
            const nextPlayer: Player = player === Player.WHITE? Player.BLACK : Player.WHITE;
            const nextMoves: Move[] = GameEngine.getValidMovesForBoard(next.board, next.externalStack, nextPlayer, config.boardSize);
            const scoreBoards: MoveScore[] = nextMoves.map((nextMove: Move) => {
                const nextTree = [...tree, nextMove.toNotation()];
                return this.minMax(next.board, next.externalStack, config, nextMove, nextPlayer, depth - 1, nextTree);
            });
            moveScoreBoard = this.getBestScoreBoard(scoreBoards, nextPlayer);
        }

        if (this.enableCaching) {
            this.cacheScore(player, depth, GameEngine.getBoardNumber(next.board, config), moveScoreBoard.score);
        }

        return { score: moveScoreBoard.score, move, boardNumber: moveScoreBoard.boardNumber, player: moveScoreBoard.player, tree: moveScoreBoard.tree };
    }

    public playMoveAsync(game: Game, setBotProgress: Function): Promise<Move> { 
        return new Promise<Move>((resolve, reject) => {
            const moves: Move[] = GameEngine.getValidMoves(game);
            const scoreBoards: MoveScore[] = [];
            const channel = wt.createChannel(this.minMaxAsync, moves.length);
            let movesVisited = 0;
            
            channel.on('done', (error: Error, moveScore: MoveScore) => {
                movesVisited++;
                setBotProgress && setBotProgress(100 * movesVisited / moves.length);

                if (error) {
                    reject(error);
                } else {
                    scoreBoards.push(moveScore);
                }
            });
            
            channel.on('stop', () => {
                const moveScore: MoveScore = this.getBestScoreBoard(scoreBoards, this.player);
                resolve(moveScore.move);
            });

            channel.on('error', (error: Error) => {
                reject(error);
            });

            moves.forEach((nextMove: Move) => {
                channel.add({
                    board: game.board, 
                    externalStack: game.externalStack, 
                    config: game.config, 
                    move: nextMove, 
                    player: this.player, 
                    depth: this.depth, 
                    tree: [nextMove.toNotation()]
                });
            });
        });
    }

    private minMaxAsync(p: MinMaxParams): Promise<MoveScore> {
        return new Promise((resolve) => {
            resolve(this.minMax(p.board, p.externalStack, p.config, p.move, p.player, p.depth, p.tree));
        });
    }

    private getBestScoreBoard(scoreBoards: MoveScore[], player: Player): MoveScore {
        return scoreBoards.reduce((best: MoveScore, current: MoveScore): MoveScore => {
            if (player === Player.WHITE) {
                return current.score > best.score? current: best
            } else {
                return current.score < best.score? current: best
            }
        });
    }

    public getHeuristicScore(board: SizedStack<Gobblet>[][], mode: string): number {
        let whiteScore = 0;
        let blackScore = 0;
        board.forEach((row: SizedStack<Gobblet>[], y: number) => {
            row.forEach((cell: SizedStack<Gobblet>, x: number) => {
                const gobblet: Gobblet = cell.peek();
                if (gobblet) {
                    try {
                        if (gobblet.player === Player.WHITE) {
                            whiteScore += cellScores[mode][y][x] * (gobblet.size + 1);
                        } else {
                            blackScore += cellScores[mode][y][x] * (gobblet.size + 1);
                        }
                    } catch (e) {
                        console.error(`Error calculating heuristic score for gobblet at [${x}, ${y}], gobblet: ${JSON.stringify(gobblet)}, mode: ${mode}`, e);
                        throw e;
                    }
                }
            });
        });
        const totalScore = whiteScore + blackScore;
        return totalScore == 0? 0 : (whiteScore - blackScore)/totalScore;
    }

    private cacheScore(player: Player, depth: number, boardNumber: bigint, score: number): void {
        let depthMap: Map<number, SortedArray<BoardNumberScore>> = this.cache.get(player);
        if (!depthMap) {
            depthMap = new Map<number, SortedArray<BoardNumberScore>>();
            this.cache.set(player, depthMap);
        }

        let boardNumberScores: SortedArray<BoardNumberScore> = depthMap.get(depth);
        if (!boardNumberScores) {
            boardNumberScores = new SortedArray(BoardNumberScore.boardNumberComparator);
            depthMap.set(depth, boardNumberScores);
        }

        boardNumberScores.push({ boardNumber, score });
    }

    private getCachedScore(player: Player, depth: number, boardNumber: bigint): number {
        const depthMap: Map<number, SortedArray<BoardNumberScore>> = this.cache.get(player);
        if (!depthMap) return null;

        const boardNumberScores: SortedArray<BoardNumberScore> = depthMap.get(depth);
        if (!boardNumberScores) return null;

        const boardNumberScore: BoardNumberScore = boardNumberScores.find({boardNumber});
        return boardNumberScore? boardNumberScore.score : null;
    }
}

export interface MoveScore {
    score: number;
    move: Move;
    boardNumber: bigint;
    player: Player;
    tree: string[];
    time?: number;
}

class BoardNumberScore {
    boardNumber: bigint;
    score?: number;

    public static boardNumberComparator(a: BoardNumberScore, b: BoardNumberScore): number {
        return a.boardNumber === b.boardNumber ? 0 : a.boardNumber < b.boardNumber ? -1 : 1;
    }
}

interface MinMaxParams {
    board: SizedStack<Gobblet>[][];
    externalStack: SizedStack<Gobblet>[];
    config: GameConfig;
    move: Move;
    player: Player;
    depth: number;
    tree: string[];
}