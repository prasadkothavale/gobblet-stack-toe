import { Game, GameConfig, Move, Player } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import Bot from './bot';

export default class RandomBot implements Bot {

    canPlay(gameConfig: GameConfig): boolean {
        return true;
    }

    playMove(game: Game): Move {
        const moves: Move[] = GameEngine.getValidMoves(game);
        return moves[Math.round(Math.random() * (moves.length - 1))];
    }
}