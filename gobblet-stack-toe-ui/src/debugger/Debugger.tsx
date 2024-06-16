import React, {useEffect, useState, ReactElement} from 'react';
import GameEngine from '../../../gobblet-stack-toe-engine/src/game-engine';
import {GameConfig, Game, Location, Constants, Gobblet} from '../../../gobblet-stack-toe-engine/src/interface';
import SizedStack from '../../../gobblet-stack-toe-engine/src/sized-stack';
import GobbletUI from '../game/GobbletUI';

let game: Game;
const gameConfig: GameConfig = {
    boardSize: 4,
    gobbletSize: 3,
    gobbletsPerSize: 3
}

export default function Debugger() {

    const [board, setBoard] = useState([]);
    const [moves, setMoves] = useState([]);
    const [movesText, setMovesText] = useState();
    const [lastMove, setLastMove] = useState();
    const [movePointer, setMovePointer] = useState(-1);

    useEffect(() => {
        game = GameEngine.createGame(gameConfig);
        setBoard(game.board);
    }, []);

    const updateMoves = (moveNotations: string) => {
        setMovesText(moveNotations);
        setMoves(moveNotations?.trim().split(/\s+/));
    }

    const nextMove = () => {
        const pointer: number = movePointer + 1;
        const move = moves[pointer];
        try {
            const board: SizedStack<Gobblet>[][] = [...GameEngine.performMoveFromNotation(game, move)];
            setBoard(board);
            setLastMove(move);
            setMovePointer(pointer);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error(e.message);
            console.log(game);
        }
    }

    const renderRows = (): ReactElement[] => {
        const indexCells: ReactElement[] = [<td key="index-row"></td>];
        for (let i = 0; i < gameConfig.boardSize; i++) {
            const cellIndex: string = String.fromCharCode(Constants.ASCII_A + i);
            indexCells.push(<td key={cellIndex} style={{textAlign: 'center'}}>{cellIndex}</td>);
        }
        const rows: ReactElement[] = [<tr key="index-row">{indexCells}</tr>];
        board.forEach((row, r) => {
            const rowNum: number = r + 1;
            const cells: ReactElement[] = [<td key={rowNum}>{rowNum}</td>];
            row.forEach((cell: SizedStack<Gobblet>, c: number) => {
                const location: Location = new Location(true, r, c);
                const subNotation: string = location.toSubNotation();
                cells.push(<td id={subNotation} key={subNotation}><GobbletUI gobblet={cell.peek()} /></td>);
            })
            rows.push(<tr key={r}>{cells}</tr>);
        })

        return rows;
    }

    const renderBoard = (): ReactElement => {
        return <table border={1}>
            <tbody>
                {renderRows()}
            </tbody>
        </table>
    }

    const renderExternalStack = (): ReactElement => {
        const indexRow: ReactElement[] = [];
        const row: ReactElement[] = game?.externalStack.map((stack, index) => {
            indexRow.push(<td key={index}>{index + 1}</td>);
            return <td key={'#'+index} id={'#'+index}><GobbletUI gobblet={stack.peek()} /></td>;
        });
        return <table border={1}>
            <tbody>
                <tr>{indexRow}</tr><tr>{row}</tr>
            </tbody>
        </table>;
    }
    
    return <div>
        <h1>Debugger</h1>
        {renderBoard()}<br/>
        {renderExternalStack()}
        <br/>
        <button disabled={movePointer <= 0}>&lt;</button>&nbsp;
        <button disabled={movePointer >= moves.length - 1} onClick={nextMove}>&gt;</button>&nbsp;
        Last move: {lastMove}, Turn: {game?.turn}
        <br/>
        <br/>
        <textarea rows={20} value={movesText} onChange={(event) => updateMoves(event.target.value)}></textarea>
    </div>;
}