import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import { Game, GameConfig, GameStatus, Gobblet, Player } from '@aehe-games/gobblet-stack-toe-engine/src/interface';

import BotFactory from './bots/bot-factory';
import Bot from './bots/bot';
import * as cliProgress from 'cli-progress';

import promptSync = require('prompt-sync');
import SizedStack from '@aehe-games/gobblet-stack-toe-engine/src/sized-stack';
const prompt = promptSync()


console.log("gobblet-stack-toe");

const gameConfig: GameConfig = { boardSize: 4, gobbletSize: 3, gobbletsPerSize: 3 };
const game: Game = GameEngine.createGame(gameConfig);
const bot: Bot = BotFactory.createBot('heuristic-bot-3');
bot.onLoad && bot.onLoad(gameConfig);

const humanPieces = Math.random() <= 0.5 ? Player.WHITE : Player.BLACK;
const botPieces = humanPieces === Player.WHITE ? Player.BLACK : Player.WHITE;

console.log(`You have ${humanPieces} pieces`);

bot.onNewGame && bot.onNewGame(gameConfig, botPieces);

async function execute() {
    while (game.state.status === GameStatus.LIVE) {
        let moveNotation: string;
        if (game.turn === humanPieces) {
            printBoard(game);
            moveNotation = prompt("Enter your move: ");
        } else {
            if (bot.playMoveWithProgress) {
                const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
                bar.start(100, 0);
                moveNotation = (await bot.playMoveWithProgress(game, (progress) => bar.update(progress))).toNotation();
                bar.stop();
            } else {
                moveNotation = (await bot.playMove(game)).toNotation();
            }
            console.log(`My move: \x1b[36m${moveNotation}\x1b[0m`);
        }

        try {
            GameEngine.performMoveFromNotation(game, moveNotation);
        } catch (error) {
            console.error(`\x1b[31m${error}\x1b[0m`);
            if (!moveNotation) {
                throw (error);
            }
        }
    }
}

function printBoard(game: Game) {
    const boardTable = game.board.map(row => row.map(toChar));
    const externalStackTable = game.externalStack.map(toChar);
    console.table(boardTable);
    console.table(externalStackTable);
}

function toChar(cell: SizedStack<Gobblet>) {
    const gobblet = cell.isEmpty()? null: cell.peek();
    if (!gobblet) {
        return '';
    } else if (gobblet.player === Player.WHITE) {
        if (gobblet.size === 0 ) {
            return 'W0';
        } else if (gobblet.size === 1) {
            return 'W1';
        } else {
            return 'W2';
        }
    } else {
        if (gobblet.size === 0 ) {
            return 'B0';
        } else if (gobblet.size === 1) {
            return 'B1';
        } else {
            return 'B2';
        }
    }
}

execute().then(() => {
    bot.onGameEnd && bot.onGameEnd(game);
    bot.unload && bot.unload();
    
    console.log("GAME OVER");
    switch(game.state.status) {
        case GameStatus.REPETITION_DRAW:
        case GameStatus.DOUBLE_DRAW:
            console.log("It's a draw");
            break;
        case GameStatus.END:
            if (game.state.winner === humanPieces) {
                console.log("You win!");
            } else {
                console.log("You lose!");
            }
    }
    process.exit(0);
});