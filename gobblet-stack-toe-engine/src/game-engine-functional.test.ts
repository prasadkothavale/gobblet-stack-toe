import GameEngine from "./game-engine";
import { GameConfig, Game, GameStatus, Player } from "./interface";

describe("Game engine functional test", () => {
    const ge = GameEngine;

    it("can play random games with all valid moves", () => {
        const totalGames = 10 ** 3;
        const gc: GameConfig = {
            boardSize: 4,
            gobbletSize: 3,
            gobbletsPerSize: 3
        }
        let whiteWins = 0;
        let blackWins = 0;
        let repetitionDraw = 0;
        let doubleDraw = 0;
        let movesPlayed = 0;

        for (let i: number = 0; i < totalGames; i++) {
            const game: Game = ge.createGame(gc);
            while(game.state.status === GameStatus.LIVE) {
                const moves: string[] = GameEngine.getValidMovesNotations(game);
                const randomMove: string = moves[Math.round(Math.random() * (moves.length - 1))];
                ge.performMoveFromNotation(game, randomMove);
                movesPlayed++;
            }
            
            switch(game.state.status) {
                case GameStatus.DOUBLE_DRAW: 
                    doubleDraw++;
                    break;
                case GameStatus.REPETITION_DRAW:
                    repetitionDraw++;
                    break;
                case GameStatus.END:
                    if (game.state.winner === Player.WHITE) {
                        whiteWins++;
                    } else {
                        blackWins++;
                    }
                    break;
                default:
                    throw new Error("Invalid game status: " + game.state.status);
            }
        }

        console.log(`Games execution status:\n=======================\nwhite wins: ${whiteWins}\nblack wins: ${blackWins}\ndraw by repetition: ${repetitionDraw}\ndouble draw: ${doubleDraw}\naverage moves: ${movesPlayed/totalGames}\n========================`);
    });
});