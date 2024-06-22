import * as fs from 'fs';
import * as path from 'path';
import { SimulatedGame } from '../simulator/simulation-result';
import { Game, Move } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
    
export async function createFileIfNotExists(filePath: string, fileName: string): Promise<void> {
    try {
        await fs.promises.access(path.join(filePath, fileName));
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.promises.mkdir(filePath, { recursive: true });
            await fs.promises.writeFile(path.join(filePath, fileName), '');
        } else {
            throw err;
        }
    }
}

export async function appendFile(filePath: string, fileName: string, content: string): Promise<void> {
    await createFileIfNotExists(filePath, fileName);
    await fs.promises.appendFile(path.join(filePath, fileName), content);
}

export async function writeGameNdJson(fileName: string, game: Game): Promise<void> {
    const dataFilePath = path.join(__dirname, '..', 'data');
    const simulatedGame: SimulatedGame = {
        winner: game.state.winner,
        gameStatus: game.state.status,
        boardHistory: game.boardHistory.map((boardNumber: BigInt) => boardNumber.toString()),
        externalStackHistory: game.externalStackHistory.map((extStackNumber: BigInt) => extStackNumber.toString()),
        moves: game.moves.map((move: Move) => move.toNotation())
    }
    const line = JSON.stringify(simulatedGame) + '\r\n';
    await appendFile(dataFilePath, fileName, line);
}