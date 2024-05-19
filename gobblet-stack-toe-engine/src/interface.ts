export interface Player {
    id: number,
    name: string,
    color: string
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
    winner: Player | null;
    config: GameConfig;
    winningSequence: Location[] | null;
}

export enum GameState {
    LIVE, END
}

export interface GameConfig {
    players: Player[];
    boardSize: number;
    gobbletSize: number;
    gobbletsPerSize: number;
    turn: Player;
    winningSequenceSize: number;
}

export interface MoveStatus {
    valid: boolean;
    reason: string;
}

export interface EndGameState {
    winner: Player | null;
    winningSequence: Location[] | null;
    isEndGame: boolean;
}