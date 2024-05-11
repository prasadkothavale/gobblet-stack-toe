export interface Player {
    id: number,
    name: string,
    color: string
}

export interface Cup {
    player: Player,
    size: number
}

export interface Location {
    board: boolean
    x: number | null,
    y: number | null
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
