import { Move, Cup, Player, Game, GameState, GameConfig, Location, MoveStatus } from './interface';

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
        const source = move.source;
        const target = move.target;
        GameEngine.verifyMove(game, move);
        const cup = source.board? game.board[source.x][source.y] : GameEngine.removeCupFromPool(game.pool, move.cup);
        if (source.board) {
            const cup = game.board[source.x][source.y];
        }
        game.moves.push(move);
        if (GameEngine.isGameOver()) {
            game.state = GameState.END;
            game.winner = GameEngine.getWinner();
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

    /**
     * Verifies if a move is valid based on the game state and configuration.
     * Throws an error if the move is invalid.
     * @param move - The move to be verified.
     * @param game - The current game state.
     * @throws Will throw an error if the move is invalid.
     * @returns {void}
     */
    private static verifyMove(game: Game, move: Move): void {
        const moveStatus = GameEngine.getMoveStatus(game, move);
        if (!moveStatus.valid) {
            throw new Error(`Invalid move: ${moveStatus.reason}`);
        }
    }

    private static getMoveStatus(game: Game, move: Move): MoveStatus {
        const {source, target, cup} = move;
        if (source == null || target == null || cup == null) {
            return {valid: false, reason: `Null value in move ${move}`};
        }
        if (source.equals(target)) {
            return {valid: false, reason: 'Source and target locations are the same.'};
        }
        if (!target.board) {
            return {valid: false, reason: 'You cannot put the cup back into the pool.'};
        }
        game.board[source.x][source.y].some((boardCup: Cup) => {boardCup.});
        
        return {valid: true, reason: null};
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