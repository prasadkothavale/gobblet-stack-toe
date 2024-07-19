import GameEngine from "../../../gobblet-stack-toe-engine/dist/game-engine";
import { Gobblet, GameConfig, Move, Player, BoardAndExternalStack, GameState, GameStatus } from "../../../gobblet-stack-toe-engine/dist/interface";
import SizedStack from "../../../gobblet-stack-toe-engine/dist/sized-stack";
import { MoveScore } from "./heuristic-bot";
import { isMainThread, parentPort, workerData } from 'node:worker_threads';

const cellScores = {
    'beginner' : [[3, 2, 3], [2, 4, 2], [3, 2, 3]],
    'classic' : [[3, 2, 2, 3], [2, 3, 3, 2], [2, 3, 3, 2], [3, 2, 2, 3]]
}

function getHeuristicScore(board: SizedStack<Gobblet>[][], mode: string): number {
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

function getBestScoreBoard(scoreBoards: MoveScore[], player: Player): MoveScore {
    return scoreBoards.reduce((best: MoveScore, current: MoveScore): MoveScore => {
        if (player === Player.WHITE) {
            return current.score > best.score? current: best
        } else {
            return current.score < best.score? current: best
        }
    });
}

function minMax(board: SizedStack<Gobblet>[][], externalStack: SizedStack<Gobblet>[], config: GameConfig, move: Move, player: Player, mode: string, depth: number, tree: string[]): MoveScore {
    const next: BoardAndExternalStack = GameEngine.dryRunValidMove(move, board, externalStack, config);
    const gameState: GameState = GameEngine.getGameState(next.board, [], config);
    const boardNumber = GameEngine.getBoardNumber(next.board, config);

    let moveScoreBoard: MoveScore;
    if (gameState.status !== GameStatus.LIVE) {
        const score = gameState.winner? gameState.winner === Player.WHITE ? 1 : -1 : 0;
        moveScoreBoard = { score, move, boardNumber, player, tree }
    } else if (depth === 0) {
        const score = getHeuristicScore(next.board, mode);
        moveScoreBoard = { score, move, boardNumber, player, tree };
    } else {
        const nextPlayer: Player = player === Player.WHITE? Player.BLACK : Player.WHITE;
        const nextMoves: Move[] = GameEngine.getValidMovesForBoard(next.board, next.externalStack, nextPlayer, config.boardSize);
        const scoreBoards: MoveScore[] = nextMoves.map((nextMove: Move) => {
            const nextTree = [...tree, nextMove.toNotation()];
            return minMax(next.board, next.externalStack, config, nextMove, nextPlayer, mode, depth - 1, nextTree);
        });
        moveScoreBoard = getBestScoreBoard(scoreBoards, nextPlayer);
    }

    return { score: moveScoreBoard.score, move, boardNumber: moveScoreBoard.boardNumber, player: moveScoreBoard.player, tree: moveScoreBoard.tree };
}

if (isMainThread) {
    throw(`${__filename} should not be invoked from the main thread`);
} else {
    const board: SizedStack<Gobblet>[][] = GameEngine.getBoard(BigInt(workerData.boardNumber), workerData.config);
    const externalStack: SizedStack<Gobblet>[] = GameEngine.getExternalStack(BigInt(workerData.externalStackNumber), workerData.config);
    const move: Move = Move.fromNotation(workerData.moveNotation);
    const response = minMax(board, externalStack, workerData.config, move, workerData.player, workerData.mode, workerData.depth, workerData.tree);
    response.moveNotation = response.move.toNotation();
    parentPort.postMessage(response)
}