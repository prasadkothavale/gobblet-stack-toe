import { Move, Cup, Player, Game, GameState, GameConfig } from './interface';

export default class GameEngine {

    /**
     * Creates a new game instance based on the provided configuration.
     * @param config The configuration object containing the players, cup size, and cups per size.
     * @returns A new game instance with the specified configuration.
     */
    public static createGame(config: GameConfig): Game {
        return {
            moves: [],
            board: GameEngine.getInitialBoard(config),
            pool: GameEngine.getInitialPool(config),
            turn: config.turn,
            state: GameState.LIVE,
            winner: null,
            config
        }
    }

    public static performMove(game: Game, move: Move): void {
        if (GameEngine.verifyMove(move)) {
            const source = move.source;
            const target = move.target;
            const cup = source.board? game.board[source.x][source.y] : GameEngine.removeCupFromPool(game.pool, move.cup);
            game.moves.push(move);
            if (GameEngine.isGameOver()) {
                game.state = GameState.END;
                game.winner = GameEngine.getWinner();
            }
        } else {
            throw new Error(`Invalid move: ${JSON.stringify(move)}`);
        }
    }
    
    static removeCupFromPool(pool: Cup[], cup: Cup) {
        throw new Error('Method not implemented.');
    }
    
    private static getWinner(): Player {
        throw new Error('Method not implemented.');
    }

    /**
     * Gets the winner of the game.
     * @returns The winner of the game.
     */
    private static isGameOver(): boolean {
        throw new Error('Method not implemented.');
    }

    private static verifyMove(move: Move): boolean {
        throw new Error('Method not implemented.');
    }
    
    /**
     * Initializes the game pool with the specified configuration.
     * @param config The configuration object containing the players, cup size, and cups per size.
     */
    private static getInitialPool(config: GameConfig): Cup[] {
        const pool: Cup[] = [];
        config.players.forEach(player => {
            for (let size = 0; size < config.cupSize; size++) {
                for (let j = 0; j < config.cupsPerSize; j++) { 
                    pool.push({player, size});
                }
            }
        });
        return pool;
    }


    /**
     * Initializes the game board with the specified configuration.
     * @param config The configuration object containing the board size and cup size.
     */
    private static getInitialBoard(config: GameConfig): Cup[][][] {
        const board: Cup[][][] = [];
        for (let i = 0; i < config.boardSize; i++) {
            board.push([]);
            for (let j = 0; j < config.boardSize; j++) {
                board[i].push([]);
            }
        }
        return board;
    }
}