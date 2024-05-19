import { Move, Cup, Player, Game, GameState, GameConfig, Location, MoveStatus, EndGameState } from './interface';

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
            config,
            winningSequence: null
        }
    }

    /**
     * Performs a move in the game.
     * @param game - The current game state.
     * @param move - The move to be performed.
     * @returns The updated game board after the move is performed.
     */
    public static performMove(game: Game, move: Move): Cup[][][] {
        const source = move.source;
        const target = move.target;
        GameEngine.verifyMove(game, move);

        const cupsAtSource: Cup[] = source.board ? game.board[source.x][source.y] : game.pool;
        const cupsAtTarget: Cup[] = game.board[target.x][target.y];
        const cupIndex: number = cupsAtSource.findIndex((sourceCup: Cup) => move.cup.equals(sourceCup));
        cupsAtTarget.push(cupsAtSource.splice(cupIndex, 1)[0]);
        game.moves.push(move);
        
        const endGameState: EndGameState = GameEngine.checkEndGame(game.board, game.config.winningSequenceSize);
        if(endGameState.isEndGame) {
            game.winner = endGameState.winner;
            game.winningSequence = endGameState.winningSequence;
            game.state = GameState.END;
        }
        return game.board;
    }

    public static checkEndGame(board: Cup[][][], winningSequenceSize: number): EndGameState {
        const boardSize: number = board.length;
        const endGameState: EndGameState = {
            winner: null,
            winningSequence: [],
            isEndGame: false
        }

        // TODO: check rows
        board.forEach((row: Cup[][], x) => {
            let sequence: Location[] | null = null;
            let sequencePlayer: Player | null = null;
            row.forEach((cell: Cup[], y) => {
                const cup: Cup = this.getLargestCup(cell);
                if (sequencePlayer && sequencePlayer.id === cup.player.id) {
                
                } else {
                    sequencePlayer = cup.player;
                    sequence = [new Location(true, x, y)];
                }

                if (sequence.length === winningSequenceSize) {
                    
                }
            });
        });

        // TODO: check columns

        // TODO: check diagonals

        return endGameState;
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
        const moveStatus = GameEngine.runGameRules(game, move);
        if (!moveStatus.valid) {
            throw new Error(`Invalid move: ${moveStatus.reason}`);
        }
    }

    /**
     * Runs the game rules to check if a move is valid.
     * @param game - The current game state.
     * @param move - The move to be verified.
     * @returns A MoveStatus object indicating if the move is valid and the reason in case of invalid move.
     */
    private static runGameRules(game: Game, move: Move): MoveStatus {
        
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
        if (cup.player !== game.turn) {
            return {valid: false, reason: 'The cup does not belong to the current player.'};
        }

        const cupsAtSource: Cup[] = source.board ? game.board[source.x][source.y] : game.pool;
        const cupsAtTarget: Cup[] = game.board[target.x][target.y];
        if (cupsAtSource.some((sourceCup: Cup) => cup.size <= sourceCup.size)) {
            return {valid: false, reason: 'You cannot move the captured cup'};
        }
        if (cupsAtTarget.some((targetCup: Cup) => cup.size <= targetCup.size)) {
            return {valid: false, reason: 'You can only capture the cup by the larger cup.'};
        }
        
        const cupIndex: number = cupsAtSource.findIndex((sourceCup: Cup) => cup.equals(sourceCup));
        if (cupIndex === -1) {
            return {valid: false, reason: 'The cup is not at the provided location.'};
        } 

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
                    pool.push(new Cup(player, size));
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

    /**
     * Gets the largest cup from the given cups array.
     * @param cups - An array of cups.
     * @returns The cup with the largest size.
     */
    private static getLargestCup(cups: Cup[]): Cup {
        return cups.sort((a, b) => b.size - a.size)[0];
    }

}