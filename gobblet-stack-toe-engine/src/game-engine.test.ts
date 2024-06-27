import GameEngine from './game-engine';
import { GameConfig, Player, Location, Move, GameStatus, Gobblet, Constants, Game } from './interface';
import SizedStack from './sized-stack';

describe('Game engine', () => {

    const ge = GameEngine;
    
    it('plays a rules breaking double draw game', () => {
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

        expect(ge.getValidMovesNotations(game)).toContain('#1-D4');
        ge.performMoveFromNotation(game, '#1-D4');
        expect(game.turn).toEqual(Player.BLACK);

        expect(ge.getValidMovesNotations(game)).toContain('#4-A1');
        ge.performMoveFromNotation(game, '#4-A1');
        expect(game.turn).toEqual(Player.WHITE);

        expect(ge.getValidMovesNotations(game)).not.toContain('D4-D4');
        expect(() => ge.performMoveFromNotation(game, 'D4-D4'))
        .toThrow('Invalid move: Source and target locations are the same.');
        
        expect(ge.getValidMovesNotations(game)).not.toContain('D4-#1');
        expect(() => ge.performMoveFromNotation(game, 'D4-#1'))
        .toThrow('Invalid move: You cannot remove gobblet from the board.');
        
        expect(ge.getValidMovesNotations(game)).not.toContain('A1-A2');
        expect(() => ge.performMoveFromNotation(game, 'A1-A2'))
        .toThrow('Invalid move: The gobblet does not belong to the current player.');
        
        expect(ge.getValidMovesNotations(game)).not.toContain('A2-A1');
        expect(() => ge.performMoveFromNotation(game, 'A2-A1'))
        .toThrow('Invalid move: The source location is empty.');
        
        expect(ge.getValidMovesNotations(game)).not.toContain('#1-A1');
        expect(() => ge.performMoveFromNotation(game, '#1-A1'))
        .toThrow('Invalid move: You can only capture the gobblet by the larger gobblet.');

        expect(ge.getValidMovesNotations(game)).toContain('#1-A4');
        ge.performMoveFromNotation(game, '#1-A4');

        expect(ge.getValidMovesNotations(game)).not.toContain('#5-A4');
        expect(() => ge.performMoveFromNotation(game, '#5-A4'))
        .toThrow('Invalid move: You can capture an opponent\'s gobblet on board by a larger gobblet only from board. Capturing directly by gobblet from external stack is only permitted when opponent has 3 gobblets in a row, column or diagonal.');

        expect(ge.getValidMovesNotations(game)).toContain('#4-D1');
        ge.performMoveFromNotation(game, '#4-D1');
        
        expect(ge.getValidMovesNotations(game)).not.toContain('#4-B4');
        expect(() => ge.performMoveFromNotation(game, '#4-B4'))
        .toThrow('Invalid move: The gobblet does not belong to the current player.');

        expect(ge.getValidMovesNotations(game)).toContain('#1-B4');
        ge.performMoveFromNotation(game, '#1-B4');
        expect(ge.getValidMovesNotations(game)).toContain('#5-B4');
        ge.performMoveFromNotation(game, '#5-B4');
        
        expect(ge.getValidMovesNotations(game)).not.toContain('#1-C4');
        expect(() => ge.performMoveFromNotation(game, '#1-C4'))
        .toThrow('Invalid move: The source location is empty.');

        ge.performMoveFromNotation(game, '#2-C4');
        ge.performMoveFromNotation(game, '#4-B1');
        ge.performMoveFromNotation(game, '#2-B1');
        ge.performMoveFromNotation(game, '#5-C1');
        ge.performMoveFromNotation(game, '#3-A4');
        expect(ge.getValidMovesNotations(game)).toHaveLength(56);
        expect(ge.getValidMovesNotations(game)).toContain('B4-B1');

        ge.performMoveFromNotation(game, 'B4-B1');
        expect(game.state.status).toEqual(GameStatus.DOUBLE_DRAW);

        expect(ge.getValidMovesNotations(game)).not.toContain('#1-C4');
        expect(() => ge.performMoveFromNotation(game, '#1-C4'))
        .toThrow('Invalid move: The game is over.');
        
        expect(game.board[3][0].peek().equals(new Gobblet(Player.WHITE, 2))).toBeTruthy();
        expect(game.board[3][1].peek().equals(new Gobblet(Player.WHITE, 0))).toBeTruthy();
        expect(game.board[3][2].peek().equals(new Gobblet(Player.WHITE, 2))).toBeTruthy();
        expect(game.board[3][3].peek().equals(new Gobblet(Player.WHITE, 2))).toBeTruthy();
        
        expect(game.state.winner).toBeNull();
        expect(game.moves.length).toEqual(12);
        expect(game.boardHistory.length).toEqual(13);
        expect(game.externalStackHistory.length).toEqual(13);
        expect(game.boardHistory[12]).toEqual(ge.getBoardNumber(game.board, gameConfig));
        expect(game.externalStackHistory[12]).toEqual(ge.getExternalStackNumber(game.externalStack, gameConfig));
    });
    
    it('simulates black playing a winning game', () => {
        const gameConfig: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        const game = ge.createGame(gameConfig);
        ge.performMoveFromNotation(game, '#1-D4');
        ge.performMoveFromNotation(game, '#4-B2');
        ge.performMoveFromNotation(game, '#2-A4');
        ge.performMoveFromNotation(game, '#5-B3');
        ge.performMoveFromNotation(game, '#3-D1');
        ge.performMoveFromNotation(game, '#6-B4');
        ge.performMoveFromNotation(game, '#1-B1');
        ge.performMoveFromNotation(game, 'B4-B1');
        ge.performMoveFromNotation(game, 'D1-B4');
        ge.performMoveFromNotation(game, 'B3-C4');
        ge.performMoveFromNotation(game, '#1-D1');
        ge.performMoveFromNotation(game, '#4-A1');
        ge.performMoveFromNotation(game, 'D4-A1');
        ge.performMoveFromNotation(game, '#4-B3');
        ge.performMoveFromNotation(game, 'D1-D4');
        ge.performMoveFromNotation(game, 'B2-D4');
        ge.performMoveFromNotation(game, 'B4-A3');
        ge.performMoveFromNotation(game, 'C4-A2');
        ge.performMoveFromNotation(game, '#2-D1');
        ge.performMoveFromNotation(game, 'D4-D1');
        ge.performMoveFromNotation(game, '#2-B4');
        ge.performMoveFromNotation(game, '#5-D4');
        ge.performMoveFromNotation(game, 'A3-D4');
        ge.performMoveFromNotation(game, '#6-B4');
        ge.performMoveFromNotation(game, 'A4-B4');
        ge.performMoveFromNotation(game, 'A2-B2');
        ge.performMoveFromNotation(game, '#3-A4');
        ge.performMoveFromNotation(game, 'B1-A4');
        ge.performMoveFromNotation(game, 'B4-C2');
        ge.performMoveFromNotation(game, 'A4-B1');

        expect(game.state.status).toEqual(GameStatus.END);
        expect(() => ge.performMoveFromNotation(game, 'A4-B3'))
        .toThrow('Invalid move: The game is over.');
        expect(game.state.sequences).toHaveLength(1);
        expect(game.state.sequences[0].every(location => 
            game.board[location.y][location.x].peek().player === Player.BLACK)).toBeTruthy();
        
        expect(game.state.winner).toEqual(Player.BLACK);
        expect(game.moves.length).toEqual(30);
        expect(game.boardHistory.length).toEqual(31);
        expect(game.externalStackHistory.length).toEqual(31);
        expect(game.boardHistory[13]).toEqual(BigInt('2007365652462324544845'));
        expect(game.externalStackHistory[13]).toEqual(BigInt(119085174));
        expect(ge.getValidMovesNotations(game)).toHaveLength(0);
    });
    
    it('simulates draw by repetition', () => {
        const gameConfig: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        const game = ge.createGame(gameConfig);
        ge.performMoveFromNotation(game, '#1-A1');
        ge.performMoveFromNotation(game, '#4-B3');
        ge.performMoveFromNotation(game, '#1-A2');
        ge.performMoveFromNotation(game, 'B3-C3');
        ge.performMoveFromNotation(game, 'A1-B2');
        ge.performMoveFromNotation(game, 'C3-B3');
        ge.performMoveFromNotation(game, 'B2-A1');
        ge.performMoveFromNotation(game, 'B3-B4');
        ge.performMoveFromNotation(game, 'A1-B2');
        ge.performMoveFromNotation(game, 'B4-B3');
        ge.performMoveFromNotation(game, 'B2-A1');

        expect(game.state.status).toEqual(GameStatus.REPETITION_DRAW);
        expect(game.state.sequences).toHaveLength(0);
        expect(game.state.winner).toBeNull();
        expect(game.moves.length).toEqual(11);
        expect(game.boardHistory.length).toEqual(12);
        expect(game.externalStackHistory.length).toEqual(12);
        expect(() => ge.performMoveFromNotation(game, 'B3-C3'))
        .toThrow('Invalid move: The game is over.');
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

    it('can generate external stack from external stack number and vice versa', () => {
        const gc: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        const initialExternalStack: SizedStack<Gobblet>[] = ge.createGame(gc).externalStack;
        const expectedInitialExternalStackNumber: bigint = BigInt(parseInt('222222222111111111', 3));
        const actualInitialExternalStackNumber: bigint = ge.getExternalStackNumber(initialExternalStack, gc)

        expect(actualInitialExternalStackNumber).toEqual(expectedInitialExternalStackNumber);
    });

    it('can generate external stack from external stack number and vice versa for random numbers', () => {
        const gc: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        const randomTests: number = 10**4;
        const max: bigint = (BigInt(Constants.BASE) ** BigInt(gc.gobbletsPerSize * 2)) - BigInt(1);

        testExternalStackToNumberConversion(BigInt(0), gc);
        testExternalStackToNumberConversion(BigInt(max), gc);

        for (let i: number = 0; i < randomTests; i++) {
            testExternalStackToNumberConversion(BigInt(Math.round(Number(max) * Math.random())) , gc);
        };
    });

    it('can provide valid possible moves', () => {
        const gc: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        const game: Game = ge.createGame(gc);
        expect(ge.getValidMoves(game)).toHaveLength(48);
        expect(ge.getValidMovesNotations(game)).toContain('#1-A1');
        ge.performMoveFromNotation(game, '#1-A1');

        expect(ge.getValidMovesNotations(game)).not.toContain('#1-A1');
        expect(ge.getValidMovesNotations(game)).toContain('#4-A2');
        
        ge.performMoveFromNotation(game, '#4-A2');
        expect(ge.getValidMovesNotations(game)).not.toContain('A1-A2');
        expect(ge.getValidMovesNotations(game)).not.toContain('#5-B1');
        expect(ge.getValidMovesNotations(game)).toContain('A1-A3');

        ge.performMoveFromNotation(game, '#1-A3');
        expect(ge.getValidMovesNotations(game)).not.toContain('#5-A3');
    });

    it('has a white winning diagonal beginner game', () => {
        const gameConfig: GameConfig = {
            boardSize: 3,
            gobbletSize: 3,
            gobbletsPerSize: 2
        }
        const game = ge.createGame(gameConfig);

        ge.performMoveFromNotation(game, '#1-B2');
        ge.performMoveFromNotation(game, '#3-A1');
        ge.performMoveFromNotation(game, '#2-C3');
        ge.performMoveFromNotation(game, '#4-C1');
        ge.performMoveFromNotation(game, '#1-B1');
        ge.performMoveFromNotation(game, '#A1-B1');
        ge.performMoveFromNotation(game, '#B2-A1');
        ge.performMoveFromNotation(game, '#3-A2');
        ge.performMoveFromNotation(game, '#2-B2');

        expect(game.state.winner).toEqual(Player.WHITE);
    });

    const testBoardToNumberConversion = (x: bigint, gc: GameConfig) => {
        const board: SizedStack<Gobblet>[][] = ge.getBoard(x, gc);
        const boardNumber: bigint = ge.getBoardNumber(board, gc);
        expect(boardNumber).toEqual(x);
    }


    const testExternalStackToNumberConversion = (x: bigint, gc: GameConfig) => {
        const externalStack: SizedStack<Gobblet>[] = ge.getExternalStack(x, gc);
        const externalStackNumber: bigint = ge.getExternalStackNumber(externalStack, gc);
        expect(externalStackNumber).toEqual(x);
    }

});