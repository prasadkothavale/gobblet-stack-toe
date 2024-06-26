import { Player, GameStatus } from "@aehe-games/gobblet-stack-toe-engine/src/interface";

export default interface SimulationResult {
    bot1: BotResult;
    bot2: BotResult;
}

export interface BotResult {
    name: string;
    white: PlayerResult;
    black: PlayerResult;
}

export interface PlayerResult {
    wins: number;
    losses: number;
    repetitionDraw: number;
    doubleDraw: number;
}

export interface SimulatedGame {
    winner: Player;
    gameStatus: GameStatus;
    boardHistory: string[];
    externalStackHistory: string[];
    moves: string[]
}

export const logResult = (result: SimulationResult, iteration?: number) => {
    iteration? console.log(` SIMULATION #${iteration} RESULT`) : console.log(' SIMULATION RESULT');
    console.table([
        Object.assign({bot: 1, name: result.bot1.name, player: 'white'}, result.bot1.white),
        Object.assign({bot: 1, name: result.bot1.name, player: 'black'}, result.bot1.black),
        Object.assign({bot: 2, name: result.bot2.name, player: 'white'}, result.bot2.white),
        Object.assign({bot: 2, name: result.bot2.name, player: 'black'}, result.bot2.black),
    ]);
}