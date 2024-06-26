import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import { GameConfig, Gobblet } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import { rotate90, hflip } from '2d-array-rotation';
import SizedStack from '@aehe-games/gobblet-stack-toe-engine/src/sized-stack';

export function getMinBoardNumber(boardNumber: bigint, gameConfig: GameConfig): bigint {
    let board = GameEngine.getBoard(boardNumber, gameConfig);
    let min = boardNumber;
    const rotations = [rotate90, rotate90, rotate90, hflip, rotate90, rotate90, rotate90];
    
    rotations.forEach(rotation => {
        board = rotation(board);
        const bn = GameEngine.getBoardNumber(board, gameConfig)
        if (bn < min) {
            min = bn;
        }
    });

    return min;
}

export function getMinExternalStackNumber(externalStackNumber: bigint, gameConfig: GameConfig): bigint {
    const externalStack:  SizedStack<Gobblet>[] = GameEngine.getExternalStack(externalStackNumber, gameConfig);
    const whiteStack = externalStack.slice(0, gameConfig.gobbletsPerSize).sort(extStackComparator);
    const blackStack = externalStack.slice(gameConfig.gobbletsPerSize, externalStack.length).sort(extStackComparator);
    return GameEngine.getExternalStackNumber([...whiteStack, ...blackStack], gameConfig);
}

function extStackComparator(e1: SizedStack<Gobblet>, e2: SizedStack<Gobblet>): number {
    if (e1.peek() === e2.peek()) {
        return 0;
    } else if (!e1.peek()) {
        return -1;
    } else if (!e2.peek()) {
        return 1;
    } else if (e1.peek().size === e2.peek().size) {
        return 0;
    } else if (e1.peek().size < e2.peek().size) {
        return -1;
    } else {
        return 1;
    }
}