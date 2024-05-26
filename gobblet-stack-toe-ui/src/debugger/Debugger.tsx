import React, {useEffect, useState, ReactElement} from 'react';
import GameEngine from '../../../gobblet-stack-toe-engine/src/game-engine';
import {GameConfig, Game, Location, ASCII_A, Gobblet} from '../../../gobblet-stack-toe-engine/src/interface';
import SizedStack from '../../../gobblet-stack-toe-engine/src/sized-stack';
import GobbletUI from '../game/GobbletUI';

export default function Debugger() {

    const boardSize: number = 4;
    const gameConfig: GameConfig = {
        boardSize: 4,
        gobbletSize: 3,
        gobbletsPerSize: 3
    }
    const game: Game = GameEngine.createGame(gameConfig);

    const [board, setBoard] = useState(game.board);
    const [moves, setMoves] = useState([]);
    const [movesText, setMovesText] = useState();
    const [lastMove, setLastMove] = useState();
    const [movePointer, setMovePointer] = useState(-1);

    const updateMoves = (moveNotations: string) => {
        setMovesText(moveNotations);
        setMoves(moveNotations.split(/\v+/));
    }

    const nextMove = () => {
        const pointer: number = movePointer + 1;
        const board: SizedStack<Gobblet>[][] = GameEngine.performMoveFromNotation(game, moves[pointer]);
        setBoard(board);
        setMovePointer(pointer);
    }

    const renderRows = (): ReactElement[] => {
        const rows: ReactElement[] = [];
        board.forEach((row, r) => {
            const rowNum: number = gameConfig.boardSize - r;
            const cells: ReactElement[] = [<td key={rowNum}>{rowNum}</td>];
            row.forEach((cell, c) => {
                const location: Location = new Location(true, r, c);
                const subNotation: string = location.toSubNotation();
                cells.push(<td id={subNotation} key={subNotation}><GobbletUI gobblet={cell.peek()} /></td>);
            })
            rows.push(<tr key={r}>{cells}</tr>);
        })

        const indexCells: ReactElement[] = [<td key="index-row"></td>];
        for (let i = 0; i < gameConfig.boardSize; i++) {
            const cellIndex: string = String.fromCharCode(ASCII_A + i);
            indexCells.push(<td key={cellIndex} style={{textAlign: 'center'}}>{cellIndex}</td>);
        }
        rows.push(<tr key="index-row">{indexCells}</tr>);
        return rows;
    }

    const renderBoard = (): ReactElement => {
        return <table border={1}>
            <tbody>
                {renderRows()}
            </tbody>
        </table>
    }
    
    return <div>
        <h1>Debugger</h1>
        {renderBoard()}
        <br/>
        <button disabled={movePointer <= 0}>&lt;</button>&nbsp;
        <button disabled={movePointer >= moves.length - 1} onClick={nextMove}>&gt;</button>&nbsp;
        Last move: {lastMove}
        <br/>
        <br/>
        <textarea rows={20} value={movesText} onChange={(event) => updateMoves(event.target.value)}></textarea>
    </div>;
}