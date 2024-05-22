import SizedStack, {Sized} from './sized-stack';

export enum Player {
    WHITE = "WHITE", BLACK = "BLACK"
}

export class Gobblet implements Sized {
    player: Player;
    size: number;

    constructor(player: Player, size: number) {
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

    /** If board is true x is x axis of the board else x is external stack number */
    x: number;

    /** If board is true y is y axis of the board else insignificant for external stack */
    y: number;

    constructor(board: boolean, x: number, y: number) {
        this.board = board;
        this.x = x;
        this.y = y;
    }
    
    equals(other: Location): boolean {
        return this.board === other.board && this.x === other.x && this.y === other.y;
    }

}

export interface Move {
    source: Location;
    target: Location;
}

export interface Game {
    moves: Move[];
    board: SizedStack<Gobblet>[][];
    externalStack: SizedStack<Gobblet>[];
    turn: Player;
    state: GameState;
    config: GameConfig;
}

export enum GameStatus {
    LIVE, DRAW, DOUBLE_DRAW, END
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