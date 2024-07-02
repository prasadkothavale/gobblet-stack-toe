import { GameConfig, Gobblet, Move, Location, Constants } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import SizedStack from "@aehe-games/gobblet-stack-toe-engine/src/sized-stack";
import GobbletUI from "./GobbletUI";
import { ReactElement } from "react";
import './game-board.css'

export default function GameBoardUI({board, externalStack, playMove, gameConfig, difficulty}: BoardInterface) {


    const renderRows = (board: SizedStack<Gobblet>[][]): ReactElement[] => {
        const indexCells = [<td key="index-row"></td>];
        for (let i = 0; i < gameConfig.boardSize; i++) {
            const cellIndex: string = String.fromCharCode(Constants.ASCII_A + i);
            indexCells.push(<td key={cellIndex} style={{textAlign: 'center'}}>{cellIndex}</td>);
        }
        const rows = [<tr key="index-row">{indexCells}</tr>];
        board.forEach((row, r) => {
            const rowNum: number = r + 1;
            const cells = [<td key={rowNum}>{rowNum}</td>];
            row.forEach((cell: SizedStack<Gobblet>, c: number) => {
                const location: Location = new Location(true, r, c);
                const subNotation: string = location.toSubNotation();
                cells.push(<td className="board-cell" id={subNotation} key={subNotation}><GobbletUI gobblet={cell.peek()} /></td>);
            })
            rows.push(<tr key={r}>{cells}</tr>);
        })

        return rows;
    }

    const renderBoard = (board: SizedStack<Gobblet>[][]): ReactElement => {
        return <table className="game-board-table">
            <tbody>
                {renderRows(board)}
            </tbody>
        </table>
    }

    const renderExternalStack = (externalStack: SizedStack<Gobblet>[]): ReactElement => {
        const indexRow: ReactElement[] = [];
        const row: ReactElement[] = externalStack.map((stack, index) => {
            indexRow.push(<td key={index} style={{textAlign: 'center'}}>{index + 1}</td>);
            return <td className="board-cell" key={'#'+index} id={'#'+index}><GobbletUI gobblet={stack.peek()} /></td>;
        });
        return <table className="game-external-stack-ui">
            <tbody>
                <tr>{indexRow}</tr><tr>{row}</tr>
            </tbody>
        </table>;
    }

    return <div className="game-board-ui">
        {renderBoard(board)}
        {renderExternalStack(externalStack)}
    </div>
}

export interface BoardInterface {
    board: SizedStack<Gobblet>[][];
    externalStack: SizedStack<Gobblet>[];
    gameConfig: GameConfig;
    difficulty: number;
    playMove: (move: Move) => void;
}