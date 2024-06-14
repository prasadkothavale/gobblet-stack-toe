import { Move, Gobblet, Player, Game, GameStatus, GameConfig, Location, MoveStatus, GameState, PlayerSequence, Constants } from './interface';
import SizedStack from './sized-stack';
import AtomicReference from './atomic-reference';

export default class GameEngine {

    /**
     * Creates a new game instance based on the provided configuration.
     * @param config The configuration object containing the players, gobblet size, and gobblets per size.
     * @returns A new game instance with the specified configuration.
     */
    public static createGame(config: GameConfig): Game {
        const board: SizedStack<Gobblet>[][] = GameEngine.getInitialBoard(config);
        return {
            moves: [],
            board,
            boardHistory: [GameEngine.getBoardNumber(board, config)],
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

        const sourceStack: SizedStack<Gobblet> = source.board ? game.board[source.y][source.x] : game.externalStack[source.y];
        const targetStack: SizedStack<Gobblet> = game.board[target.y][target.x];
        targetStack.push(sourceStack.pop());
        game.moves.push(move);
        game.state = GameEngine.getGameState(game.board);
        game.turn = game.turn === Player.WHITE? Player.BLACK : Player.WHITE;

        return game.board;
    }

    /**
     * Checks if the game has ended due to a player forming a sequence of their gobblets.
     * @param board - The current game board.
     * @returns An object containing the winner, the winning sequence, and a boolean indicating if the game has ended.
     */
    public static getGameState(board: SizedStack<Gobblet>[][]): GameState {
        const boardSize: number = board.length;
        const playerSequences: PlayerSequence[] = GameEngine.checkSequence(board, boardSize, boardSize);
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
     * Calculates the board number from the current game board.
     * Let S = distinct gobblet sizes, P = number of players
     * A cell can have combinations C = (P + 1) ^ S.
     * A board will have combinations B = C * number of cells => C * board size ^ 2
     * This function will generate a number N from given board (where 0 <= N < B) to identify a board combination uniquely.
     * 
     * #### Logic
     * Consider P = 2 (w, b) and S = 3 (s, m, l). Board size is 4 x 4
     * A cell is divided into S i.e 3 subcells, S0 for s, S1 for m and S2 for l. Hence a subcell e.g: S1 will be either empty,
     * or have wm or bm gobblet, similarly S0 can be empty or ws or bs and S2 can be empty, wl or bl. So a board will have 
     * S * board size * board size i.e 3 x 4 x 4 subcells, and each subcell has P + 1 i.e 3 combinations. Hence we can represent a 
     * subcell as base P+1 i.e base 3 number. If a cell has sb, mw, lb gobblets stacked then the base 3 number can be 212. Same
     * way we can represent board as a base 3 number of length 3 x 4 x 4.
     * As BigInt works on base 10 numbers hence at the end this function returns base 10 equivalent of base 3 (or base S) number
     * 
     * 
     * @param board - The current game board.
     * @param config - The configuration object containing the players, gobblet size, and gobblets per size.
     * @returns The board number as an bigint.
     */
    public static getBoardNumber(board: SizedStack<Gobblet>[][], config: GameConfig): bigint {
        let boardNumber:bigint = BigInt(0);
        board.forEach((row: SizedStack<Gobblet>[], y: number) => {
            row.forEach((cell: SizedStack<Gobblet>, x: number) => {
                const stack: Gobblet[] = cell.toArray();
                for(let size: number = 0; size < config.gobbletSize; size++) {
                    const position = size + x * config.gobbletSize + y * row.length * config.gobbletSize;
                    const gobblet: Gobblet = stack.filter((gobblet: Gobblet) => gobblet.size === size)[0];
                    if (gobblet) {
                        boardNumber = boardNumber + BigInt(GameEngine.getPlayerNumber(gobblet)) * (BigInt(Constants.BASE) ** BigInt(position));
                    }
                }
            });
        });
        return boardNumber;
    }

    /**
     * Generates a game board from a given board number. This is inverse of getBoardNumber function.
     * For logic see documentation of getBoardNumber function.
     * @param boardNumber - The unique identifier of the game board.
     * @param config - The configuration object containing the players, gobblet size, and gobblets per size.
     * @returns A game board represented as a 2D array of stacks of gobblets.
     */
    public static getBoard(boardNumber: bigint, config: GameConfig): SizedStack<Gobblet>[][] {
        const board: SizedStack<Gobblet>[][] = GameEngine.getInitialBoard(config);
        let _bn: bigint = boardNumber;
        board.forEach((row: SizedStack<Gobblet>[], y: number) => {
            row.forEach((cell: SizedStack<Gobblet>, x: number) => {
                for(let size: number = 0; size < config.gobbletSize; size++) {
                    const position = size + x * config.gobbletSize + y * row.length;
                    const unit = _bn % BigInt(Constants.BASE);
                    _bn -= unit;
                    _bn /= BigInt(Constants.BASE);

                    const gobblet: Gobblet = GameEngine.getGobblet(Number(unit), size);
                    if (gobblet) {
                        cell.push(gobblet);
                    }
                }
            });
        });
        return board;
    }

    public static getExternalStackNumber() {
        //TODO
    }

    /**
     * Finds sequences gobblets formed by players on the board.
     * @param board - The current game board.
     * @param boardSize - The size of the game board.
     * @param sequenceSize - The size of the sequence expected.
     * @returns sequences gobblets formed by players on the board.
     */
    private static checkSequence(board: SizedStack<Gobblet>[][], boardSize: number, sequenceSize: number): PlayerSequence[] {
        const playerSequences: PlayerSequence[] = [];

        // check rows
        board.forEach((row: SizedStack<Gobblet>[], y) => {
            let sequence: Location[] = [];
            const sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            row.forEach((cell: SizedStack<Gobblet>, x) => 
                GameEngine.checkCell(cell, sequencePlayer, sequence, x, y, sequenceSize, playerSequences));
        });

        // check columns
        for (let x = 0; x < boardSize; x++) {
            let sequence: Location[] = [];
            let sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            for (let y = 0; y < boardSize; y++) {
                const cell: SizedStack<Gobblet> = board[y][x];
                GameEngine.checkCell(cell, sequencePlayer, sequence, x, y, sequenceSize, playerSequences);
            }
        }

        // check diagonals
        for (let i = 0; i < boardSize; i++) {
            let sequence: Location[] = [];
            let sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            const cell: SizedStack<Gobblet> = board[i][i];
            GameEngine.checkCell(cell, sequencePlayer, sequence, i, i, sequenceSize, playerSequences);
        }
        for (let i = 0; i < boardSize; i++) {
            let sequence: Location[] = [];
            let sequencePlayer: AtomicReference<Player> = new AtomicReference<Player>(null);
            const cell: SizedStack<Gobblet> = board[i][boardSize - i - 1];
            GameEngine.checkCell(cell, sequencePlayer, sequence, i, boardSize - i - 1, sequenceSize, playerSequences);
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

        const sourceStack: SizedStack<Gobblet> = source.board ? game.board[source.y][source.x] : game.externalStack[source.y];
        const targetStack: SizedStack<Gobblet> = game.board[target.y][target.x];
        if (sourceStack.isEmpty()) {
            return {valid: false, reason: 'The source location is empty.'};
        }

        const gobblet: Gobblet = source.board? game.board[source.y][source.x].peek() : game.externalStack[source.y].peek();
        if (gobblet.player !== game.turn) {
            return {valid: false, reason: 'The gobblet does not belong to the current player.'};
        }
        if (!targetStack.canPush(gobblet)) {
            return {valid: false, reason: 'You can only capture the gobblet by the larger gobblet.'};
        }
        if (!source.board && !targetStack.isEmpty()) {
            if (!this.allowDirectCapture(game.board, game.turn, target, boardSize - 1)) {
                return {valid: false, reason: `You can capture an opponent's gobblet on board by a larger gobblet only from board. Capturing directly by gobblet from external stack is only permitted when opponent has ${boardSize - 1} gobblets in a row, column or diagonal.`};
            }
        }

        return {valid: true, reason: null};
    }

    /**
     * Verifies if a player can make a direct capture from the external stack to the target location on the board.
     * A direct capture is allowed when the opponent has a sequence of gobblets equal to the board size - 1.
     * @param board - The current game board.
     * @param player - The current player.
     * @param target - The target location on the board.
     * @param sequenceSize - The size of the sequence expected usually board size - 1.
     * @returns {boolean} - Returns true if a direct capture is allowed, otherwise false.
     */
    private static allowDirectCapture(
        board: SizedStack<Gobblet>[][], player: Player, target: Location, sequenceSize: number
    ): boolean {
        const targetStack: SizedStack<Gobblet> = board[target.y][target.x];
        const opponent: Player = player === Player.WHITE? Player.BLACK : Player.WHITE;

        // player can direct capture own gobblet
        if (targetStack.peek() && targetStack.peek().player === player) {
            return true;
        }

        // check target row
        let count: number = board[target.y]
            .reduce((_count: number, stack: SizedStack<Gobblet>) => 
                stack.peek() && stack.peek().player === opponent? _count + 1 : _count, 0);
        if (count === sequenceSize) {
            return true;
        }

        // check target column
        count = board.map((row: SizedStack<Gobblet>[]) =>  row[target.x])
            .reduce((_count: number, stack: SizedStack<Gobblet>) => stack.peek() && stack.peek().player === opponent? _count + 1 : _count, 0);
        if (count === sequenceSize) {
            return true;
        }

        // check diagonals if target is on the diagonal
        count = 0;
        if (target.x === target.y) {
            for (let i = 0; i < board.length; i++) {
                const gobblet: Gobblet = board[i][i].peek();
                gobblet && gobblet.player === opponent && count++;
            }
            if (count === sequenceSize) {
                return true;
            }
        }
        count = 0;
        if (board.length - 1 - target.x === target.y) {
            for (let i = 0; i < board.length; i++) {
                const gobblet: Gobblet = board[i][board.length - 1 - i].peek();
                gobblet && gobblet.player === opponent && count++;
            }
            if (count === sequenceSize) {
                return true;
            }
        }

        return false;
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
            sequenceSize: number, playerSequences: PlayerSequence[]
    ): void {
        const gobblet: Gobblet = cell.peek();
        if (!gobblet) {
            sequence.splice(0, sequence.length);
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
        for (let y = 0; y < config.boardSize; y++) {
            board.push([]);
            for (let x = 0; x < config.boardSize; x++) {
                board[y].push(new SizedStack<Gobblet>());
            }
        }
        return board;
    }

    private static isLocationInBounds(location: Location, gameConfig: GameConfig): boolean {
        const {board, x, y} = location;
        const {boardSize, gobbletsPerSize} = gameConfig;
        return board? x >= 0 && x < boardSize && y >= 0 && y < boardSize : y >= 0 && y < gobbletsPerSize * 2;
    }

    private static getPlayerNumber(gobblet: Gobblet): number {
        return !gobblet? 0 : gobblet.player === Player.WHITE ? 1 : 2
    }

    private static getGobblet(playerNumber: number, size: number): Gobblet {
        return playerNumber === 0 ? null : new Gobblet(playerNumber === 1 ? Player.WHITE : Player.BLACK, size);
    }

}