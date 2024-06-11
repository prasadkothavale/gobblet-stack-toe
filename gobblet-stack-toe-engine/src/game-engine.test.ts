import GameEngine from './game-engine';
import { GameConfig, Player, Location, Move, GameStatus, Gobblet, Constants } from './interface';
import SizedStack from './sized-stack';

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
        
        expect(() => ge.performMoveFromNotation(game, '#1-D5'))
        .toThrow('Invalid move: Source or target locations are out of bounds.');

        ge.performMoveFromNotation(game, '#1-D4');
        expect(game.turn).toEqual(Player.BLACK);

        ge.performMoveFromNotation(game, '#4-A1');
        expect(game.turn).toEqual(Player.WHITE);

        expect(() => ge.performMoveFromNotation(game, 'D4-D4'))
        .toThrow('Invalid move: Source and target locations are the same.');
        
        expect(() => ge.performMoveFromNotation(game, 'D4-#1'))
        .toThrow('Invalid move: You cannot remove gobblet from the board.');
        
        expect(() => ge.performMoveFromNotation(game, 'A1-A2'))
        .toThrow('Invalid move: The gobblet does not belong to the current player.');
        
        expect(() => ge.performMoveFromNotation(game, 'A2-A1'))
        .toThrow('Invalid move: The source location is empty.');
        
        expect(() => ge.performMoveFromNotation(game, '#1-A1'))
        .toThrow('Invalid move: You can only capture the gobblet by the larger gobblet.');

        ge.performMoveFromNotation(game, '#1-A4');

        expect(() => ge.performMoveFromNotation(game, '#5-A4'))
        .toThrow('Invalid move: You can capture an opponent\'s gobblet on board by a larger gobblet only from board. Capturing directly by gobblet from external stack is only permitted when opponent has 3 gobblets in a row, column or diagonal.');

        ge.performMoveFromNotation(game, '#4-D1');
        
        expect(() => ge.performMoveFromNotation(game, '#4-B4'))
        .toThrow('Invalid move: The gobblet does not belong to the current player.');

        ge.performMoveFromNotation(game, '#1-B4');
        ge.performMoveFromNotation(game, '#5-B4');
        
        expect(() => ge.performMoveFromNotation(game, '#1-C4'))
        .toThrow('Invalid move: The source location is empty.');

        ge.performMoveFromNotation(game, '#2-C4');
        ge.performMoveFromNotation(game, '#4-B1');
        ge.performMoveFromNotation(game, '#2-B1');
        ge.performMoveFromNotation(game, '#5-C1');
        ge.performMoveFromNotation(game, '#3-A4');
        ge.performMoveFromNotation(game, 'B4-B1');
        expect(game.state.status).toEqual(GameStatus.DOUBLE_DRAW);

        ge.performMoveFromNotation(game, 'A4-C1');
        expect(game.state.status).toEqual(GameStatus.END);
        expect(game.state.winner).toEqual(Player.WHITE);
        expect(game.moves.length).toEqual(13);
        
        expect(game.board[3][0].peek().equals(new Gobblet(Player.WHITE, 1))).toBeTruthy();
        expect(game.board[3][1].peek().equals(new Gobblet(Player.WHITE, 0))).toBeTruthy();
        expect(game.board[3][2].peek().equals(new Gobblet(Player.WHITE, 2))).toBeTruthy();
        expect(game.board[3][3].peek().equals(new Gobblet(Player.WHITE, 2))).toBeTruthy();
    });

    it('can generate all possible board cells from a number for an unit board', () => {
        const gc: GameConfig = {
            boardSize: 1,
            gobbletSize: 3,
            gobbletsPerSize: 1
        }
        const g: Gobblet[] = [
            new Gobblet(Player.WHITE, 0),
            new Gobblet(Player.BLACK, 0),
            new Gobblet(Player.WHITE, 1),
            new Gobblet(Player.BLACK, 1),
            new Gobblet(Player.WHITE, 2),
            new Gobblet(Player.BLACK, 2),
        ];
        const max: bigint = (BigInt(Constants.BASE) ** BigInt(gc.boardSize * gc.boardSize * gc.gobbletSize)) - BigInt(1);

        expect(Constants.BASE).toEqual(3)
        expect(max).toEqual(BigInt(26));
        expect(ge.getBoard(BigInt( 0), gc)).toEqual([[new SizedStack<Gobblet>()]]);

        expect(ge.getBoard(BigInt( 1), gc)).toEqual([[new SizedStack<Gobblet>([g[0]])]]);
        expect(ge.getBoard(BigInt( 2), gc)).toEqual([[new SizedStack<Gobblet>([g[1]])]]);
        expect(ge.getBoard(BigInt( 3), gc)).toEqual([[new SizedStack<Gobblet>([g[2]])]]);
        expect(ge.getBoard(BigInt( 6), gc)).toEqual([[new SizedStack<Gobblet>([g[3]])]]);
        expect(ge.getBoard(BigInt( 9), gc)).toEqual([[new SizedStack<Gobblet>([g[4]])]]);
        expect(ge.getBoard(BigInt(18), gc)).toEqual([[new SizedStack<Gobblet>([g[5]])]]);

        expect(ge.getBoard(BigInt( 4), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[2]])]]);
        expect(ge.getBoard(BigInt( 5), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[2]])]]);
        expect(ge.getBoard(BigInt( 7), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[3]])]]);
        expect(ge.getBoard(BigInt( 8), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[3]])]]);
        expect(ge.getBoard(BigInt(10), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[4]])]]);
        expect(ge.getBoard(BigInt(11), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[4]])]]);
        expect(ge.getBoard(BigInt(12), gc)).toEqual([[new SizedStack<Gobblet>([g[2], g[4]])]]);
        expect(ge.getBoard(BigInt(15), gc)).toEqual([[new SizedStack<Gobblet>([g[3], g[4]])]]);
        expect(ge.getBoard(BigInt(19), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[5]])]]);
        expect(ge.getBoard(BigInt(20), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[5]])]]);
        expect(ge.getBoard(BigInt(21), gc)).toEqual([[new SizedStack<Gobblet>([g[2], g[5]])]]);
        expect(ge.getBoard(BigInt(24), gc)).toEqual([[new SizedStack<Gobblet>([g[3], g[5]])]]);

        expect(ge.getBoard(BigInt(13), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[2], g[4]])]]);
        expect(ge.getBoard(BigInt(14), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[2], g[4]])]]);
        expect(ge.getBoard(BigInt(16), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[3], g[4]])]]);
        expect(ge.getBoard(BigInt(17), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[3], g[4]])]]);
        expect(ge.getBoard(BigInt(22), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[2], g[5]])]]);
        expect(ge.getBoard(BigInt(23), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[2], g[5]])]]);
        expect(ge.getBoard(BigInt(25), gc)).toEqual([[new SizedStack<Gobblet>([g[0], g[3], g[5]])]]);
        expect(ge.getBoard(BigInt(26), gc)).toEqual([[new SizedStack<Gobblet>([g[1], g[3], g[5]])]]);

        for(let i:bigint = BigInt(0); i <= max; i++) {
            testBoardToNumberConversion(i, gc);
        }
    });

    it('can generate board from board number and board number from board for random numbers', () => {
        const randomTests: number = 10**4;
        const gc: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        const max: bigint = (BigInt(Constants.BASE) ** BigInt(gc.boardSize * gc.boardSize * gc.gobbletSize)) - BigInt(1);
        
        testBoardToNumberConversion(BigInt(0), gc);
        expect(max).not.toEqual(max + BigInt(1));
        testBoardToNumberConversion(max, gc);
        for (let i: number = 0; i < randomTests; i++) {
            testBoardToNumberConversion(BigInt(Math.round(Number(max) * Math.random())) , gc);
        };

    });

    const testBoardToNumberConversion = (x: bigint, gc: GameConfig) => {
        const board: SizedStack<Gobblet>[][] = ge.getBoard(x, gc);
        const boardNumber: bigint = ge.getBoardNumber(board, gc);
        expect(boardNumber).toEqual(x);
    }

});