export enum Player {
    WHITE, BLACK
}

export class Gobblet {
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
    
    board: boolean;
    x: number;
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
    gobblet: Gobblet;
    source: Location;
    target: Location;
}

export interface Game {
    moves: Move[];
    board: Gobblet[][][];
    pool: Gobblet[];
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
    turn: Player;
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