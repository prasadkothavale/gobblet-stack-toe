import { Move, Gobblet, Player, Game, GameStatus, GameConfig, Location, MoveStatus, GameState, PlayerSequence } from './interface';
import SizedStack from './sized-stack';
import AtomicReference from './atomic-reference';

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
            externalStack: GameEngine.getInitialExternalStack(config),
            turn: Player.WHITE,
            state: {
                winner: null,
                sequences: [],
                status: GameStatus.LIVE
            },
            config
        }
    }

    /**
     * Performs a move in the game.
     * @param game - The current game.
     * @param notation - The move notation to be performed.
     * @returns The updates the game and returns game board after the move is performed.
     */
    public static performMoveFromNotation(game: Game, notation: string): SizedStack<Gobblet>[][] {
        console.log(notation);
        return GameEngine.performMove(game, Move.fromNotation(notation));
    }

    /**
     * Performs a move in the game.
     * @param game - The current game.
     * @param move - The move to be performed.
     * @returns The updates the game and returns game board after the move is performed.
     */
    public static performMove(game: Game, move: Move): SizedStack<Gobblet>[][] {
        const source = move.source;
        const target = move.target;
        GameEngine.verifyMove(game, move);

        const sourceStack: SizedStack<Gobblet> = source.board ? game.board[source.x][source.y] : game.externalStack[source.y];
        const targetStack: SizedStack<Gobblet> = game.board[target.x][target.y];
        targetStack.push(sourceStack.pop());
        game.moves.push(move);
        game.state = GameEngine.getGameState(game.board);
        game.turn = game.turn === Player.WHITE? Player.BLACK : Player.WHITE;

        return JSON.parse(JSON.stringify(game.board));
    }

    /**
     * Checks if the game has ended due to a player forming a sequence of their gobblets.
     * @param board - The current game board.
     * @returns An object containing the winner, the winning sequence, and a boolean indicating if the game has ended.
     */
    public static getGameState(board: SizedStack<Gobblet>[][]): GameState {
        const boardSize: number = board.length;
        const playerSequences: PlayerSequence[] = GameEngine.checkSequence(board, boardSize, boardSize, true);
        const whiteSequences = playerSequences.filter(sequence => sequence.player === Player.WHITE);
        const blackSequences = playerSequences.filter(sequence => sequence.player === Player.BLACK);

        if (whiteSequences.length > blackSequences.length) {
            return {
                winner: Player.WHITE,
                sequences: [whiteSequences[0].sequence],
                status: GameStatus.END
            }
        } else if (blackSequences.length > whiteSequences.length) {
            return {
                winner: Player.BLACK,
                sequences: [blackSequences[0].sequence],
                status: GameStatus.END
            }
        } else if (playerSequences.length > 1 && whiteSequences.length === blackSequences.length) {
            return {
                winner: null,
                sequences: playerSequences.map(sequence => sequence.sequence),
                status: GameStatus.DOUBLE_DRAW
            }
        } else {
            return {
                winner: null,
                sequences: [],
                status: GameStatus.LIVE
            }
        }

        //TODO: check draw conditions
    }

    /**
     * Finds sequences gobblets formed by players on the board.
     * @param board - The current game board.
     * @param boardSize - The size of the game board.
     * @param sequenceSize - The size of the sequence expected.
     * @returns sequences gobblets formed by players on the board.
     */
    private static checkSequence(board: SizedStack<Gobblet>[][], boardSize: number, sequenceSize: number, checkCompleteSequence: boolean): PlayerSequence[] {
        const playerSequences: PlayerSequence[] = [];

        // check rows
        board.forEach((row: SizedStack<Gobblet>[], x) => {
            let sequence: Location[] = [];
            const sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            row.forEach((cell: SizedStack<Gobblet>, y) => 
                GameEngine.checkCell(cell, sequencePlayer, sequence, x, y, sequenceSize, playerSequences, checkCompleteSequence));
        });

        // check columns
        for (let y = 0; y < boardSize; y++) {
            let sequence: Location[] = [];
            let sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            for (let x = 0; x < boardSize; x++) {
                const cell: SizedStack<Gobblet> = board[x][y];
                GameEngine.checkCell(cell, sequencePlayer, sequence, x, y, sequenceSize, playerSequences, checkCompleteSequence);
            }
        }

        // check diagonals
        for (let i = 0; i < boardSize; i++) {
            let sequence: Location[] = [];
            let sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            const cell: SizedStack<Gobblet> = board[i][i];
            GameEngine.checkCell(cell, sequencePlayer, sequence, i, i, sequenceSize, playerSequences, checkCompleteSequence);
        }
        for (let i = 0; i < boardSize; i++) {
            let sequence: Location[] = [];
            let sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            const cell: SizedStack<Gobblet> = board[i][boardSize - i - 1];
            GameEngine.checkCell(cell, sequencePlayer, sequence, i, boardSize - i - 1, sequenceSize, playerSequences, checkCompleteSequence);
        }

        return playerSequences;
    }

    /**
     * Verifies if a move is valid based on the game state.
     * Throws an error if the move is invalid.
     * @param move - The move to be verified.
     * @param game - The current game state.
     * @throws Will throw an error if the move is invalid.
     * @returns {void}
     */
    private static verifyMove(game: Game, move: Move): void {
        const moveStatus = GameEngine.runGameRules(game, move);
        if (!moveStatus.valid) {
            console.warn(game.moves.map(move => move.toNotation()).join('\n'));
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
        
        console.log(move)
        const {source, target} = move;
        const {boardSize} = game.config;

        if (source === null) {
            return {valid: false, reason: 'Source location is null.'};
        }
        if (target === null) {
            return {valid: false, reason: 'Target location is null.'};
        }
        if (source.equals(target)) {
            return {valid: false, reason: 'Source and target locations are the same.'};
        }
        if (!target.board) {
            return {valid: false, reason: 'You cannot remove gobblet from the board.'};
        }
        if ([source, target].some(location => !GameEngine.isLocationInBounds(location, game.config))) {
            return {valid: false, reason: 'Source or target locations are out of bounds.'};
        }

        const sourceStack: SizedStack<Gobblet> = source.board ? game.board[source.x][source.y] : game.externalStack[source.y];
        const targetStack: SizedStack<Gobblet> = game.board[target.x][target.y];
        if (sourceStack.isEmpty()) {
            return {valid: false, reason: 'The source location is empty.'};
        }

        const gobblet: Gobblet = source.board? game.board[source.x][source.y].peek() : game.externalStack[source.y].peek();
        if (gobblet.player !== game.turn) {
            return {valid: false, reason: 'The gobblet does not belong to the current player.'};
        }
        if (!targetStack.canPush(gobblet)) {
            console.error(targetStack, gobblet);
            return {valid: false, reason: 'You can only capture the gobblet by the larger gobblet.'};
        }
        if (!source.board && !targetStack.isEmpty()) {
            const possibleSequences = this.checkSequence(game.board, boardSize, boardSize - 1, false);
            if (!possibleSequences.some(sequence => sequence.player !== game.turn)) {
                return {valid: false, reason: `You can capture a gobblet on board by a largest gobblet only from board. Capturing directly by gobblet from external stack only permitted when opponent has ${boardSize - 1} gobblets in a row.`};
            }
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
     * @param sequenceSize - The size of the sequence expected.
     * @param playerSequences - The list of player sequences found so far.
     */
    private static checkCell(
            cell: SizedStack<Gobblet>, sequencePlayer: AtomicReference<Player>, sequence: Location[], x: number, y: number, 
            sequenceSize: number, playerSequences: PlayerSequence[], checkCompleteSequence: boolean
    ): void {
        const gobblet: Gobblet = cell.peek();
        if (!gobblet && checkCompleteSequence) {
            sequence.splice(0, sequence.length);
            return;
        } else if (!gobblet) {
            return;
        } else if (sequencePlayer && sequencePlayer.get() === gobblet.player) {
            sequence.push(new Location(true, x, y));
        } else {
            sequencePlayer.set(gobblet.player);
            sequence.splice(0, sequence.length);
            sequence.push(new Location(true, x, y));
        }
        if (sequence.length === sequenceSize) {
            playerSequences.push({player: sequencePlayer.get(), sequence});
        }
    }
    
    /**
     * Initializes the game external stack with the specified configuration.
     * @param config The configuration object containing the players, gobblet size, and gobblets per size.
     */
    private static getInitialExternalStack(config: GameConfig): SizedStack<Gobblet>[] {
        const externalStack: SizedStack<Gobblet>[] = [];
        [Player.WHITE, Player.BLACK].forEach((player: Player) => {
            for (let stackIndex = 0; stackIndex < config.gobbletsPerSize; stackIndex++) {
                const stack: SizedStack<Gobblet> = new SizedStack<Gobblet>();
                for (let size = 0; size < config.gobbletSize; size++) {
                    stack.push(new Gobblet(player, size));
                }
                externalStack.push(stack);
            }
        });
        return externalStack;
    }


    /**
     * Initializes the game board with the specified configuration.
     * @param config The configuration object containing the board size and gobblet size.
     */
    private static getInitialBoard(config: GameConfig): SizedStack<Gobblet>[][] {
        const board: SizedStack<Gobblet>[][] = [];
        for (let x = 0; x < config.boardSize; x++) {
            board.push([]);
            for (let y = 0; y < config.boardSize; y++) {
                board[x].push(new SizedStack<Gobblet>());
            }
        }
        return board;
    }

    private static isLocationInBounds(location: Location, gameConfig: GameConfig): boolean {
        const {board, x, y} = location;
        const {boardSize, gobbletsPerSize} = gameConfig;
        return board? x >= 0 && x < boardSize && y >= 0 && y < boardSize : y >= 0 && y < gobbletsPerSize * 2;
    }

}