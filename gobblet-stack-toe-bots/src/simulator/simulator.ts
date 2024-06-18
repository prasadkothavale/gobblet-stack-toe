import { Game, GameConfig, GameStatus, Player } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import Bot from '../bots/bot';
import SimulationResult from './simulation-result';

export default class Simulator {

    classic: GameConfig = {
        boardSize: 4,
        gobbletSize: 3,
        gobbletsPerSize: 3
    };

    beginner: GameConfig = {
        boardSize: 3,
        gobbletSize: 3,
        gobbletsPerSize: 2
    };

    simulations: number;
    bot1: Bot;
    bot2: Bot;
    bot1Name: string;
    bot2Name: string;
    gameConfig: GameConfig;

    constructor(gameMode: string, simulations: number, bot1: Bot, bot2: Bot, bot1Name: string, bot2Name: string) {
        this.simulations = simulations;
        this.bot1 = bot1;
        this.bot2 = bot2;
        this.bot1Name = bot1Name;
        this.bot2Name = bot2Name;

        switch(gameMode) {
            case 'beginner':
                this.gameConfig = this.beginner;
                break;
            case 'classic':
                this.gameConfig = this.classic;
                break;
            default:
                throw new Error(`Invalid game mode: ${gameMode}`);
        }
        this.bot1.onLoad? this.bot1.onLoad(this.gameConfig) : undefined;
        this.bot2.onLoad? this.bot2.onLoad(this.gameConfig) : undefined;
    }

    public runSimulations(): SimulationResult {
        const result: SimulationResult = {
            bot1: {
                name: this.bot1Name,
                white: {
                    wins: 0,
                    losses: 0,
                    repetitionDraw: 0,
                    doubleDraw: 0
                }, 
                black: {
                    wins: 0,
                    losses: 0,
                    repetitionDraw: 0,
                    doubleDraw: 0
                }
            },
            bot2: {
                name: this.bot2Name,
                white: {
                    wins: 0,
                    losses: 0,
                    repetitionDraw: 0,
                    doubleDraw: 0
                }, 
                black: {
                    wins: 0,
                    losses: 0,
                    repetitionDraw: 0,
                    doubleDraw: 0
                }
            }
        }
        for (let execution = 0; execution < this.simulations; execution++) {
            const game: Game = GameEngine.createGame(this.gameConfig);
            let turn = execution % 2 === 0? this.bot1 : this.bot2;
            let next = execution % 2 === 0? this.bot2 : this.bot1;

            while(game.state.status === GameStatus.LIVE) {
                GameEngine.performMove(game, turn.playMove(game));
                const current = turn;
                turn = next;
                next = current;
            }
            
            this.bot1.onGameEnd? this.bot1.onGameEnd(game) : undefined;
            this.bot2.onGameEnd? this.bot2.onGameEnd(game) : undefined;

            switch(game.state.status) {
                case GameStatus.END:
                    if (game.state.winner === Player.WHITE){
                        if(execution % 2 === 0){
                            result.bot1.white.wins++
                            result.bot2.black.losses++;
                        } else {
                            result.bot1.black.losses++
                            result.bot2.white.wins++;
                        }
                    } else {
                        if(execution % 2 === 0){
                            result.bot1.white.losses++
                            result.bot2.black.wins++;
                        } else {
                            result.bot1.black.wins++
                            result.bot2.white.losses++;
                        }
                    }
                break;
                case GameStatus.DOUBLE_DRAW:
                    if(execution % 2 === 0){
                        result.bot1.white.doubleDraw++;
                        result.bot2.black.doubleDraw++;
                    } else {
                        result.bot1.black.doubleDraw++;
                        result.bot2.white.doubleDraw++;
                    }
                break;
                case GameStatus.REPETITION_DRAW:
                    if(execution % 2 === 0){
                        result.bot1.white.repetitionDraw++;
                        result.bot2.black.repetitionDraw++;
                    } else {
                        result.bot1.black.repetitionDraw++;
                        result.bot2.white.repetitionDraw++;
                    }
                break;
                default:
                    throw new Error(`Invalid game status: ${game.state.status}`);
            }

        }
        this.bot1.unload? this.bot1.unload() : undefined;
        this.bot2.unload? this.bot2.unload() : undefined;

        return result;
    }
}

