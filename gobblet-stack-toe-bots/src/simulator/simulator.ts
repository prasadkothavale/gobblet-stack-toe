import { Game, GameConfig, GameStatus, Move, Player } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import Bot from '../bots/bot';
import SimulationResult, {PlayerResult, BotResult} from './simulation-result';
import {writeGameNdJson} from '../utils/file-utils';
import getGameConfig from '../utils/game-config-utils';
import * as cliProgress from 'cli-progress';

export default class Simulator {

    simulations: number;
    bot1: Bot;
    bot2: Bot;
    bot1Name: string;
    bot2Name: string;
    gameConfig: GameConfig;
    outputFile: string;

    constructor(gameMode: string, simulations: number, bot1: Bot, bot2: Bot, bot1Name: string, bot2Name: string, outputFile: string) {
        this.simulations = simulations;
        this.bot1 = bot1;
        this.bot2 = bot2;
        this.bot1Name = bot1Name;
        this.bot2Name = bot2Name;
        this.outputFile = outputFile;

        this.gameConfig = getGameConfig(gameMode);
        this.bot1.onLoad? this.bot1.onLoad(this.gameConfig) : undefined;
        this.bot2.onLoad? this.bot2.onLoad(this.gameConfig) : undefined;
    }

    /**
     * This method runs the specified number of simulations between two bots.
     *
     * @returns {SimulationResult} - The result of the simulations.
     */
    public async runSimulations(): Promise<SimulationResult> {
        const result: SimulationResult = this.getInitialSimulationResult();
        const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
        bar.start(this.simulations, 0);

        for (let execution = 0; execution < this.simulations; execution++) {
            const game: Game = GameEngine.createGame(this.gameConfig);
            let turn = execution % 2 === 0? this.bot1 : this.bot2;
            let next = execution % 2 === 0? this.bot2 : this.bot1;
            if (execution % 2 === 0) {
                this.bot1.onNewGame && this.bot1.onNewGame(this.gameConfig, Player.WHITE);
                this.bot2.onNewGame && this.bot2.onNewGame(this.gameConfig, Player.BLACK);
            } else {
                this.bot1.onNewGame && this.bot1.onNewGame(this.gameConfig, Player.BLACK);
                this.bot2.onNewGame && this.bot2.onNewGame(this.gameConfig, Player.WHITE);
            }

            while(game.state.status === GameStatus.LIVE) {
                let move: Move;
                try {
                    move = await turn.playMove(game);
                    GameEngine.performMove(game, move);
                    const current = turn;
                    turn = next;
                    next = current;
                } catch (error) {
                    console.error(`Error executing move ${move?.toNotation()}, player: ${game.turn}, source gobblet: ${move && JSON.stringify(game.board[move.source.y][move.source.x]?.peek())}`);
                    throw error;
                }
            }
            
            this.bot1.onGameEnd? this.bot1.onGameEnd(game) : undefined;
            this.bot2.onGameEnd? this.bot2.onGameEnd(game) : undefined;

            const whitePlayerResult: PlayerResult = execution % 2 === 0 ? result.bot1.white : result.bot2.white;
            const blackPlayerResult: PlayerResult = execution % 2 === 0 ? result.bot2.black : result.bot1.black;
            switch(game.state.status) {
                case GameStatus.END:
                    game.state.winner === Player.WHITE ? 
                        this.updateWinner(whitePlayerResult, blackPlayerResult) :
                        this.updateWinner(blackPlayerResult, whitePlayerResult);
                break;
                case GameStatus.DOUBLE_DRAW:
                    this.updateDoubleDraw(whitePlayerResult, blackPlayerResult);
                break;
                case GameStatus.REPETITION_DRAW:
                    this.updateRepetitionDraw(whitePlayerResult, blackPlayerResult);
                break;
                default:
                    throw new Error(`Invalid game status: ${game.state.status}`);
            }

            await this.writeFile(game);
            bar.update(execution + 1);

        }
        this.bot1.unload? this.bot1.unload() : undefined;
        this.bot2.unload? this.bot2.unload() : undefined;
        bar.stop();

        return result;
    }

    private getInitialPlayerResult(): PlayerResult {
        return {wins: 0, losses: 0, repetitionDraw: 0, doubleDraw: 0};
    }

    private getInitialBotResult(name: string): BotResult {
        return {
            name,
            white: this.getInitialPlayerResult(),
            black: this.getInitialPlayerResult()
        };
    }

    private getInitialSimulationResult(): SimulationResult {
        return {
            bot1: this.getInitialBotResult(this.bot1Name),
            bot2: this.getInitialBotResult(this.bot2Name)
        };
    }

    private updateWinner(winner: PlayerResult, loser: PlayerResult): void {
        winner.wins++
        loser.losses++
    }

    private updateRepetitionDraw(p1: PlayerResult, p2: PlayerResult): void {
        p1.repetitionDraw++
        p2.repetitionDraw++
    }

    private updateDoubleDraw(p1: PlayerResult, p2: PlayerResult): void {
        p1.doubleDraw++
        p2.doubleDraw++
    }

    private async writeFile(game: Game): Promise<void> {
        if(this.outputFile && this.outputFile.trim().length > 0) {
            await writeGameNdJson(this.outputFile, game);
        }
    }
}

