import React, {useEffect, useState, ReactElement} from 'react';
import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import {GameConfig, Game, Location, Constants, Gobblet, Move, Player} from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import SizedStack from '@aehe-games/gobblet-stack-toe-engine/src/sized-stack';
import GobbletUI from '../game/GobbletUI';
import matchboxBrainData from '@aehe-games/gobblet-stack-toe-bots/src/data/brain/beginner-matchbox-brain.json';
import {MoveMatchbox, Matchbox, matchBoxComparator} from '@aehe-games/gobblet-stack-toe-bots/src/bots/matchbox-bot';
import SortedArray from '@aehe-games/gobblet-stack-toe-engine/src/sorted-array';
import { getMinBoardNumber, getMinExternalStackNumber } from '@aehe-games/gobblet-stack-toe-bots/src/utils/board-utils';

const matchboxBrain = new SortedArray<Matchbox>(matchBoxComparator);
matchboxBrain.loadSortedArray(matchboxBrainData, matchBoxComparator);

let game: Game;
const gameConfig: GameConfig = {
    boardSize: 3,
    gobbletSize: 3,
    gobbletsPerSize: 2
}

export default function Debugger() {

    const [board, setBoard] = useState([]);
    const [moves, setMoves] = useState([]);
    const [movesJsonStr, setMovesJsonStr] = useState([]);
    const [movesText, setMovesText] = useState();
    const [lastMove, setLastMove] = useState();
    const [movePointer, setMovePointer] = useState(-1);
    const [nextMoveInput, setNextMoveInput] = useState();
    const [game, setGame] = useState();

    useEffect(() => {
        const game = GameEngine.createGame(gameConfig);
        setBoard(game.board);
        setGame(game);
    }, []);

    const updateMoves = (moveNotations: string) => {
        setMovesText(moveNotations);
        setMoves(moveNotations?.trim().split(/\s+/));
    }

    const nextMove = () => {
        const pointer: number = movePointer + 1;
        const move = moves[pointer];
        playMove(move);
    }

    const playMove = (move) => {
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

    const getMatchbox = (move: Move, game: Game): Matchbox | null => {
        const source = move.source;
        const target = move.target;
        const board: SizedStack<Gobblet>[][] = GameEngine.getBoard(GameEngine.getBoardNumber(game.board, game.config), game.config);
        const externalStack: SizedStack<Gobblet>[] = GameEngine.getExternalStack(GameEngine.getExternalStackNumber(game.externalStack, game.config), game.config);
        const sourceStack: SizedStack<Gobblet> = source.board ? board[source.y][source.x] : externalStack[source.y];
        const targetStack: SizedStack<Gobblet> = board[target.y][target.x];
        targetStack.push(sourceStack.pop());

        const boardNumber = getMinBoardNumber(GameEngine.getBoardNumber(board, game.config), game.config).toString();
        const externalStackNumber = getMinExternalStackNumber(GameEngine.getExternalStackNumber(externalStack, game.config), game.config).toString();
        return matchboxBrain.find({boardNumber, externalStackNumber});
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
        return <table border={1} style={{borderCollapse: 'collapse'}}>
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
        return <table border={1} style={{borderCollapse: 'collapse'}}>
            <tbody>
                <tr>{indexRow}</tr><tr>{row}</tr>
            </tbody>
        </table>;
    }

    const renderMatchboxMoves = (): ReactElement => {
        const moves: Move[] = GameEngine.getValidMoves(game);
        const rows = moves
            .map((move: Move) => {
                const matchbox: Matchbox | null = getMatchbox(move, game);
                const xp = matchbox? matchbox.whiteWins + matchbox.blackWins + matchbox.draws : 0;
                
                const score = matchbox && xp > 0? game?.turn === Player.WHITE ? 
                    (2*matchbox.whiteWins + matchbox.draws)/xp : 
                    (2*matchbox.blackWins + matchbox.draws)/xp : 0;
                return {move, matchbox, score, xp};
            })
            .sort((m1, m2) => m2.score - m1.score)
            .map((m: MoveMatchbox, index: number) => {
                return <tr key={'m-'+index}>
                    <td><button onClick={() => playMove(m.move.toNotation())}>{m.move.toNotation()}</button></td>
                    <td>{m.score}</td><td>{m.xp}</td><td>{m.matchbox?.whiteWins}</td><td>{m.matchbox?.draws}</td><td>{m.matchbox?.blackWins}</td>
                </tr>;
            });
        return <table border={1} style={{borderCollapse: 'collapse'}} cellPadding={6}>
            <thead>
                <tr><th>Move</th><th>Score</th><th>XP</th><th>White</th><th>Draw</th><th>Black</th></tr>
            </thead>
            <tbody>
                {rows}
            </tbody>
        </table>
    }
    
    return <div>
        <h1>Debugger</h1>
        <table cellPadding={10}><tbody>
            <tr>
                <td>
                    {game && <h2>Board#: {GameEngine.getBoardNumber(board, game.config).toString()}</h2>}
                    {game && <h3>Min Board#: {getMinBoardNumber(GameEngine.getBoardNumber(board, game.config), game.config).toString()}</h3>}
                    {renderBoard()}<br/>
                    {renderExternalStack()}<br/>
                    <button disabled={movePointer <= 0}>&lt;</button>&nbsp;
                    <button disabled={movePointer >= moves.length - 1} onClick={nextMove}>&gt;</button>&nbsp;
                    Last move: {lastMove}, Turn: {game?.turn}
                </td>
                <td>
                    <textarea placeholder="Plain text moves" rows={10} value={movesText} onChange={(event) => updateMoves(event.target.value)}></textarea><br/>
                    <input placeholder="JSON array moves" type="text" value={movesJsonStr} onChange={(event) => setMovesJsonStr(event.target.value)}/>
                    <button onClick={() => setMoves(JSON.parse(movesJsonStr))}>Load</button><br/>
                    <input placeholder="next move" type='text' value={nextMoveInput} onChange={(event) => setNextMoveInput(event.target.value)} />
                    <button onClick={() => playMove(nextMoveInput)}>Play</button><br/>
                </td>
                <td>
                    <h3>Matchbox</h3>
                    {game && renderMatchboxMoves()}
                </td>
            </tr>
        </tbody></table>
        
        <br/>
        <br/>
        
    </div>;
}