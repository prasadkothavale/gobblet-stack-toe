import { GameConfig, Player, Game, Move, Gobblet } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import Bot from './bot';
import { beginner } from '../utils/game-config-utils';
import * as brain from "../../lib/brain.js";
import * as fs from 'fs';
import * as path from 'path';
import SizedStack from '@aehe-games/gobblet-stack-toe-engine/src/sized-stack';

export default class SimpleNNBot implements Bot {

    private network: any;
    private player: Player;

    public canPlay(gameConfig: GameConfig): boolean {
        return Object.keys(beginner).every(key => gameConfig[key] === beginner[key]);
    }

    public onLoad(gameConfig: GameConfig): void {
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'simple-nn-brain.json'), {encoding: 'utf8', flag: 'r'}));
        const network = new brain.NeuralNetwork();
        network.fromJSON(data);
        this.network = network;
    }

    public onNewGame(gameConfig: GameConfig, player: Player): void {
        this.player = player;
    }

    public playMove(game: Game): Promise<Move> {
        const moves: Move[] = GameEngine.getValidMoves(game);
        return Promise.resolve(this.player === Player.WHITE? this.getBestWhiteMove(moves, game) : this.getBestBlackMove(moves, game));
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

    private getMoveScore(move: Move, game: Game): number {
        const source = move.source;
        const target = move.target;
        const board: SizedStack<Gobblet>[][] = GameEngine.getBoard(GameEngine.getBoardNumber(game.board, game.config), game.config);
        const externalStack: SizedStack<Gobblet>[] = GameEngine.getExternalStack(GameEngine.getExternalStackNumber(game.externalStack, game.config), game.config);
        const sourceStack: SizedStack<Gobblet> = source.board ? board[source.y][source.x] : externalStack[source.y];
        const targetStack: SizedStack<Gobblet> = board[target.y][target.x];
        targetStack.push(sourceStack.pop());

        const input: number[] = [];
        board.forEach((row: SizedStack<Gobblet>[]) => {
            row.forEach((cell: SizedStack<Gobblet>) => {
                input.push(cell.isEmpty() ? 0 : cell.peek().player === Player.WHITE? -1 : 1);
            })
        });
        externalStack.forEach((cell: SizedStack<Gobblet>) => {
            input.push(cell.isEmpty() ? 0 : cell.peek().player === Player.WHITE? -1 : 1);
        }); 

        return this.network.run(input);
    }

}