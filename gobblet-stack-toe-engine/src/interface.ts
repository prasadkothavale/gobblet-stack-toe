import SizedStack, {Sized} from './sized-stack';

export enum Player {
    WHITE = "WHITE", BLACK = "BLACK"
}

export enum Constants {
    BASE = Object.keys(Player).length + 1,
    ALLOWED_REPETITIONS = 3,
    ASCII_A = 'A'.charCodeAt(0)
}

export class Gobblet implements Sized {
    player: Player;
    size: number;

    public constructor(player: Player, size: number) {
        this.player = player;
        this.size = size;
    }

    equals(other: Gobblet): boolean {
        return this.player === other.player && this.size === other.size;
    }
}

export class Location {
    
    /** If board is true then location is for board else location is for external stack */
    board: boolean;

    /** If board is true x is x axis of the board else insignificant for external stack */
    x: number;

    /** If board is true y is y axis of the board else y is external stack number */
    y: number;

    public constructor(board: boolean, x: number, y: number) {
        this.board = board;
        this.x = x;
        this.y = y;
    }

    public static parseLocation(subNotation: string): Location {
        if (!subNotation || subNotation.trim() === '') {
            throw new Error('Invalid subNotation: ' + subNotation);
        }
        const [_, x, y] = subNotation.match(/([A-Za-z#])(\d{1,2})/)
        if (!x ||!y) {
            throw new Error('Invalid subNotation: ' + subNotation);
        }
        const board = x !== '#';
        return new Location(board, 
            board? x.charCodeAt(0) - Constants.ASCII_A : null, 
            parseInt(y, 10) - 1);
    }

    public toSubNotation(): string {
        return `${this.board? String.fromCharCode(this.x + Constants.ASCII_A) : '#'}${this.y + 1}`;
    }
    
    public equals(other: Location): boolean {
        return this.board === other.board && this.x === other.x && this.y === other.y;
    }

}

export class Move {
    source: Location;
    target: Location;

    public constructor(source: Location, target: Location) {
        this.source = source;
        this.target = target;
    }

    /**
     * Parses a game move notation string into a Move object.
     *
     * @param notation - A string representing the move notation, e.g., "A1-B2".
     *                   If source is external stack then notation can be "#1-A3" or "#2-B2".
     * @returns A Move object representing the parsed move.
     */
    public static fromNotation(notation: string): Move {
        try {
            const [s, t] = notation.split('-');
            return new Move(Location.parseLocation(s), Location.parseLocation(t));
        } catch (e) {
            console.error(e);
            throw new Error(`Invalid move notation: ${notation}. ${e}`);
        }
    }

    public toNotation(): string {
        return `${this.source.toSubNotation()}-${this.target.toSubNotation()}`;
    }
}

export interface Game {
    moves: Move[];
    board: SizedStack<Gobblet>[][];
    boardHistory: bigint[];
    externalStack: SizedStack<Gobblet>[];
    externalStackHistory: bigint[];
    turn: Player;
    state: GameState;
    config: GameConfig;
}

export enum GameStatus {
    LIVE = "LIVE", 
    REPETITION_DRAW = "REPETITION_DRAW", 
    DOUBLE_DRAW = "DOUBLE_DRAW", 
    END = "END"
}

export interface GameConfig {
    boardSize: number;
    gobbletSize: number;
    gobbletsPerSize: number;
}

export interface MoveStatus {
    valid: boolean;
    reason: string;
}

export interface GameState {
    winner: Player | null;
    sequences: Location[][] | [];
    status: GameStatus;
}

export interface PlayerSequence {
    player: Player, 
    sequence: Location[]
}

export interface BoardAndExternalStack {
    board: SizedStack<Gobblet>[][],
    externalStack: SizedStack<Gobblet>[]
}