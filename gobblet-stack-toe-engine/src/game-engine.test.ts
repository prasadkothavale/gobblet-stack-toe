import GameEngine from './game-engine';
import { GameConfig, Player } from './interface';

describe('Game', () => {
    
    it('should create a new game', () => {
        const player1: Player = {id: 0,name: 'Player 1',color: 'blue'}
        const player2: Player = {id: 1,name: 'Player 2',color: 'red'}
        const gameConfig: GameConfig = {
            players: [player1, player2],
            boardSize: 3,
            gobbletSize: 3,
            gobbletsPerSize: 2,
            turn: player1
        }
        const game = GameEngine.createGame(gameConfig);

        console.log(game);
    });
});