import GameEngine from './game-engine';
import { GameConfig, Player, Location, Move, GameStatus, Gobblet } from './interface';

describe('Game engine', () => {

    const ge = GameEngine;
    
    it('plays a rules breaking game', () => {
        const gameConfig: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        const game = ge.createGame(gameConfig);
        
        expect(() => ge.performMove(game, new Move(null, new Location(true, 0, 0))))
        .toThrow('Invalid move: Source location is null.');
        
        expect(() => ge.performMove(game, new Move(new Location(false, null, 0), null)))
        .toThrow('Invalid move: Target location is null.');
        
        ge.performMoveFromNotation(game, '#0-D4');
        expect(game.turn).toEqual(Player.BLACK);

        ge.performMoveFromNotation(game, '#3-A0');
        expect(game.turn).toEqual(Player.WHITE);

        expect(() => ge.performMoveFromNotation(game, 'D4-D4'))
        .toThrow('Invalid move: Source and target locations are the same.');
        
        expect(() => ge.performMoveFromNotation(game, 'D4-#0'))
        .toThrow('Invalid move: You cannot remove gobblet from the board.');
        
        expect(() => ge.performMoveFromNotation(game, 'A0-A1'))
        .toThrow('Invalid move: The gobblet does not belong to the current player.');
        
        expect(() => ge.performMoveFromNotation(game, 'A1-A0'))
        .toThrow('The source location is empty.');
        
        expect(() => ge.performMoveFromNotation(game, '#0-A0'))
        .toThrow('You can only capture the gobblet by the larger gobblet.');

        ge.performMoveFromNotation(game, '#0-A4');

        expect(() => ge.performMoveFromNotation(game, '#4-A4'))
        .toThrow('You can capture a gobblet on board by a largest gobblet only from board. Capturing directly by gobblet from external stack only permitted when opponent has 3 gobblets in a row.');

        ge.performMoveFromNotation(game, '#3-D0');
        
        expect(() => ge.performMoveFromNotation(game, '#3-B4'))
        .toThrow('Invalid move: The gobblet does not belong to the current player.');

        ge.performMoveFromNotation(game, '#0-B4');
        ge.performMoveFromNotation(game, '#4-B4');
        
        expect(() => ge.performMoveFromNotation(game, '#0-C4'))
        .toThrow('The source location is empty.');

        ge.performMoveFromNotation(game, '#1-B4');
        ge.performMoveFromNotation(game, '#3-B0');
        ge.performMoveFromNotation(game, '#1-B0');
        ge.performMoveFromNotation(game, '#4-C0');
        ge.performMoveFromNotation(game, '#2-A4');
        ge.performMoveFromNotation(game, 'B4-B0');
        expect(game.state.status).toEqual(GameStatus.DOUBLE_DRAW);

        ge.performMoveFromNotation(game, 'A4-C0');
        expect(game.state.status).toEqual(GameStatus.END);
        expect(game.state.winner).toEqual(Player.WHITE);
        expect(game.moves.length).toEqual(13);
        
        expect(game.board[0][3].peek().equals(new Gobblet(Player.WHITE, 3))).toBeTruthy();
        expect(game.board[1][3].peek().equals(new Gobblet(Player.WHITE, 1))).toBeTruthy();
        expect(game.board[2][3].peek().equals(new Gobblet(Player.WHITE, 3))).toBeTruthy();
        expect(game.board[3][3].peek().equals(new Gobblet(Player.WHITE, 3))).toBeTruthy();
    });

});