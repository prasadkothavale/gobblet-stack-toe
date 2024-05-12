export interface Player {
    id: number,
    name: string,
    color: string
}

export class Cup {
    player: Player;
    size: number;

    equals(other: Cup): boolean {
        return this.player === other.player && this.size === other.size;
    }
}

export class Location {
    
    board: boolean;
    x: number;
    y: number;
    
    equals(other: Location): boolean {
        return this.board === other.board && this.x === other.x && this.y === other.y;
    }

}

export interface Move {
    cup: Cup;
    source: Location;
    target: Location;
}

export interface Game {
    moves: Move[];
    board: Cup[][][];
    pool: Cup[];
    turn: Player;
    state: GameState;
    winner: Player | null;
    config: GameConfig;
}

export enum GameState {
    LIVE, END
}

export interface GameConfig {
    players: Player[];
    boardSize: number;
    cupSize: number;
    cupsPerSize: number;
    turn: Player;
}

export interface MoveStatus {
    valid: boolean;
    reason: string;
}
