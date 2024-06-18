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

// TODO find better way to print table
export const logResult = (result: SimulationResult) => {
    console.log(`
    SIMULATION RESULT
    ===============================
    Bot1: ${result.bot1.name}
    
    White:
    * wins:             ${result.bot1.white.wins}
    * losses:           ${result.bot1.white.losses}
    * repetitionDraw:   ${result.bot1.white.repetitionDraw}
    * doubleDraw:       ${result.bot1.white.doubleDraw}
     
    Black:
    * wins:             ${result.bot1.black.wins}
    * losses:           ${result.bot1.black.losses}
    * repetitionDraw:   ${result.bot1.black.repetitionDraw}
    * doubleDraw:       ${result.bot1.black.doubleDraw}
    -------------------------------
    Bot2: ${result.bot2.name}
    
    White:
    * wins:             ${result.bot2.white.wins}
    * losses:           ${result.bot2.white.losses}
    * repetitionDraw:   ${result.bot2.white.repetitionDraw}
    * doubleDraw:       ${result.bot2.white.doubleDraw}
     
    Black:
    * wins:             ${result.bot2.black.wins}
    * losses:           ${result.bot2.black.losses}
    * repetitionDraw:   ${result.bot2.black.repetitionDraw}
    * doubleDraw:       ${result.bot2.black.doubleDraw}
    -------------------------------
    `);
}