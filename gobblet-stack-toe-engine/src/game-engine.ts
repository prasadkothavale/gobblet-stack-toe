import { Move, Gobblet, Player, Game, GameState, GameConfig, Location, MoveStatus, EndGameState } from './interface';

export default class GameEngine {

    /**
     * Creates a new game instance based on the provided configuration.
     * @param config The configuration object containing the players, gobblet size, and gobblets per size.
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
    public static performMove(game: Game, move: Move): Gobblet[][][] {
        const source = move.source;
        const target = move.target;
        GameEngine.verifyMove(game, move);

        const gobbletsAtSource: Gobblet[] = source.board ? game.board[source.x][source.y] : game.pool;
        const gobbletsAtTarget: Gobblet[] = game.board[target.x][target.y];
        const gobbletIndex: number = gobbletsAtSource.findIndex((sourceGobblet: Gobblet) => move.gobblet.equals(sourceGobblet));
        gobbletsAtTarget.push(gobbletsAtSource.splice(gobbletIndex, 1)[0]);
        game.moves.push(move);
        
        const endGameState: EndGameState = GameEngine.checkEndGame(game.board);
        if(endGameState.isEndGame) {
            game.winner = endGameState.winner;
            game.winningSequence = endGameState.winningSequence;
            game.state = GameState.END;
        }
        return game.board;
    }

    public static checkEndGame(board: Gobblet[][][]): EndGameState {
        const boardSize: number = board.length;
        const playerSequences: {player: Player, sequence: Location[]}[] = [];

        // check rows
        board.forEach((row: Gobblet[][], x) => {
            let sequence: Location[] | null = null;
            let sequencePlayer: Player | null = null;
            row.forEach((cell: Gobblet[], y) => 
                GameEngine.checkCell(cell, sequencePlayer, sequence, x, y, boardSize, playerSequences)
            );
        });

        // check columns
        for (let y = 0; y < boardSize; y++) {
            let sequence: Location[] | null = null;
            let sequencePlayer: Player | null = null;
            for (let x = 0; x < boardSize; x++) {
                const cell: Gobblet[] = board[x][y];
                GameEngine.checkCell(cell, sequencePlayer, sequence, x, y, boardSize, playerSequences)
            }
        }

        // check diagonals
        for (let i = 0; i < boardSize; i++) {
            let sequence: Location[] | null = null;
            let sequencePlayer: Player | null = null;
            const cell: Gobblet[] = board[i][i];
                GameEngine.checkCell(cell, sequencePlayer, sequence, i, i, boardSize, playerSequences)
        }
        for (let i = 0; i < boardSize; i++) {
            let sequence: Location[] | null = null;
            let sequencePlayer: Player | null = null;
            const cell: Gobblet[] = board[i][boardSize - i - 1];
                GameEngine.checkCell(cell, sequencePlayer, sequence, i, boardSize - i - 1, boardSize, playerSequences)
        }

        if (playerSequences.length === 1) {
            return {
                winner: playerSequences[0].player,
                winningSequence: playerSequences[0].sequence,
                isEndGame: true
            }
        }
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
        
        const {source, target, gobblet} = move;
        if (source == null || target == null || gobblet == null) {
            return {valid: false, reason: `Null value in move ${move}`};
        }
        if (source.equals(target)) {
            return {valid: false, reason: 'Source and target locations are the same.'};
        }
        if (!target.board) {
            return {valid: false, reason: 'You cannot put the gobblet back into the pool.'};
        }
        if (gobblet.player !== game.turn) {
            return {valid: false, reason: 'The gobblet does not belong to the current player.'};
        }

        const gobbletsAtSource: Gobblet[] = source.board ? game.board[source.x][source.y] : game.pool;
        const gobbletsAtTarget: Gobblet[] = game.board[target.x][target.y];
        if (gobbletsAtSource.some((sourceGobblet: Gobblet) => gobblet.size <= sourceGobblet.size)) {
            return {valid: false, reason: 'You cannot move the captured gobblet'};
        }
        if (gobbletsAtTarget.some((targetGobblet: Gobblet) => gobblet.size <= targetGobblet.size)) {
            return {valid: false, reason: 'You can only capture the gobblet by the larger gobblet.'};
        }
        
        const gobbletIndex: number = gobbletsAtSource.findIndex((sourceGobblet: Gobblet) => gobblet.equals(sourceGobblet));
        if (gobbletIndex === -1) {
            return {valid: false, reason: 'The gobblet is not at the provided location.'};
        } 

        return {valid: true, reason: null};
    }

    /**
     * Verifies if a cell contains the largest gobblet belonging to the current player.
     * If a sequence of the player's gobblets is found, it is added to the list of player sequences,
     * else a new sequence is started.
     * @param cell - The cell to be checked.
     * @param sequencePlayer - The player whose sequence is being checked.
     * @param sequence - The sequence of gobblets found so far.
     * @param x - The x-coordinate of the cell.
     * @param y - The y-coordinate of the cell.
     * @param boardSize - The size of the game board.
     * @param playerSequences - The list of player sequences found so far.
     */
    private static checkCell(
            cell: Gobblet[], sequencePlayer: Player, sequence: Location[], x: number, y: number, 
            boardSize: number, playerSequences: {player: Player, sequence: Location[]}[]
    ): void {
        const gobblet: Gobblet = this.getLargestGobblet(cell);
        if (sequencePlayer && sequencePlayer.id === gobblet.player.id) {
            sequence.push(new Location(true, x, y));
        } else {
            sequencePlayer = gobblet.player;
            sequence = [new Location(true, x, y)];
        }
        if (sequence.length === boardSize) {
            playerSequences.push({player: sequencePlayer, sequence});
        }
    }
    
    /**
     * Initializes the game pool with the specified configuration.
     * @param config The configuration object containing the players, gobblet size, and gobblets per size.
     */
    private static getInitialPool(config: GameConfig): Gobblet[] {
        const pool: Gobblet[] = [];
        config.players.forEach(player => {
            for (let size = 0; size < config.gobbletSize; size++) {
                for (let j = 0; j < config.gobbletsPerSize; j++) { 
                    pool.push(new Gobblet(player, size));
                }
            }
        });
        return pool;
    }


    /**
     * Initializes the game board with the specified configuration.
     * @param config The configuration object containing the board size and gobblet size.
     */
    private static getInitialBoard(config: GameConfig): Gobblet[][][] {
        const board: Gobblet[][][] = [];
        for (let i = 0; i < config.boardSize; i++) {
            board.push([]);
            for (let j = 0; j < config.boardSize; j++) {
                board[i].push([]);
            }
        }
        return board;
    }

    /**
     * Gets the largest gobblet from the given gobblets array.
     * @param gobblets - An array of gobblets.
     * @returns The gobblet with the largest size.
     */
    private static getLargestGobblet(gobblets: Gobblet[]): Gobblet {
        return gobblets.sort((a, b) => b.size - a.size)[0];
    }

}