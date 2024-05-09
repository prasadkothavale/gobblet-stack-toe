export enum Cup {
    B1, B2, B3, R1, R2, R3
}

export enum Location {
    A1, A2, A3, B1, B2, B3, C1, C2, C3, X
}

export enum Player {
    B, R
}

export interface Move {
    cup: Cup;
    source: Location;
    target: Location;
}

export interface Game {
    moves: Move[];
    board: Map<Location, Cup[]>
    turn: Player
}
