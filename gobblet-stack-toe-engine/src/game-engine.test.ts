import GameEngine from './game-engine';
import { GameConfig, Player } from './interface';

describe('Game', () => {
    
    it('should create a new game', () => {
        const gameConfig: GameConfig = {
            boardSize: 3,
            gobbletSize: 3,
            gobbletsPerSize: 2
        }
        const game = GameEngine.createGame(gameConfig);

        console.log(JSON.stringify(game, null, 2));
    });
});