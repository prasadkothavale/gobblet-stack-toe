import {useEffect, useState, ReactElement} from 'react';
import GameEngine from '@aehe-games/gobblet-stack-toe-engine/src/game-engine';
import {GameConfig, Location, Constants, Gobblet, Move, Player } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import SizedStack from '@aehe-games/gobblet-stack-toe-engine/src/sized-stack';
import GobbletUI from '../game/GobbletUI';
import HeuristicBot, { MoveScore } from '@aehe-games/gobblet-stack-toe-bots/src/bots/heuristic-bot';


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
    const [inputBoardNumber, setInputBoardNumber] = useState(0);
    
    const heuristicBot: HeuristicBot = new HeuristicBot();
    heuristicBot.onLoad(gameConfig);

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
            //setMovePointer(pointer);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
            console.error(e.message);
            console.log(game);
        }
    }

    const renderRows = (board: SizedStack<Gobblet>[][]): ReactElement[] => {
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

    const renderBoard = (board: SizedStack<Gobblet>[][]): ReactElement => {
        return <table border={1} style={{borderCollapse: 'collapse'}}>
            <tbody>
                {renderRows(board)}
            </tbody>
        </table>
    }

    const renderExternalStack = (externalStack: SizedStack<Gobblet>[]): ReactElement => {
        const indexRow: ReactElement[] = [];
        const row: ReactElement[] = externalStack.map((stack, index) => {
            indexRow.push(<td key={index}>{index + 1}</td>);
            return <td key={'#'+index} id={'#'+index}><GobbletUI gobblet={stack.peek()} /></td>;
        });
        return <table border={1} style={{borderCollapse: 'collapse'}}>
            <tbody>
                <tr>{indexRow}</tr><tr>{row}</tr>
            </tbody>
        </table>;
    }

    const renderMoves = (): ReactElement => {
        const moves = game.moves.map((move: Move, index: number) => <li key={'move-' + index}>{move.toNotation()}</li>);
        return <ol>{moves}</ol>;
    }

    const renderMatchboxMoves = (): ReactElement => {
        const moves: Move[] = GameEngine.getValidMoves(game);
        const scoreBoards: MoveScore[] = moves.map((nextMove: Move) => 
            heuristicBot.minMax(game.board, game.externalStack, game.config, nextMove, game.turn, 3, [nextMove.toNotation()]));
        const rows = scoreBoards
            .sort((m1, m2) => {
                return game.turn === Player.WHITE ? (m2.score - m1.score) : (m1.score - m2.score);
            })
            .map((m: MoveScore, index: number) => {
                return <tr key={'m-'+index}>
                    <td><button onClick={() => playMove(m.move.toNotation())}>{m.move.toNotation()}</button></td>
                    <td>{m.score}</td><td>{m.boardNumber?.toString()}</td><td>{m.tree.join(', ')}</td>
                </tr>;
            });
        return <table border={1} style={{borderCollapse: 'collapse'}} cellPadding={6}>
            <thead>
                <tr><th>Move</th><th>Score</th><th>Board#</th><th>Tree</th></tr>
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
                    {game && <h3>Score: {heuristicBot.getHeuristicScore(board, 'beginner')}</h3>}
                    {renderBoard(board)}<br/>
                    {game && renderExternalStack(game.externalStack)}<br/>
                    <button disabled={movePointer <= 0}>&lt;</button>&nbsp;
                    <button disabled={movePointer >= moves.length - 1} onClick={nextMove}>&gt;</button>&nbsp;
                    Last move: {lastMove}, Turn: {game?.turn}
                    <hr/>
                    <h2>View Board</h2>
                    Board Number: <input type="text" placeholder="Board number" value={inputBoardNumber} onChange={event => setInputBoardNumber(event.target.value)}/>
                    <br/><br/>
                    {renderBoard(GameEngine.getBoard(BigInt(inputBoardNumber), gameConfig))}<br/>
                </td>
                <td>
                    <h3>Moves</h3>
                    {game && renderMoves()}
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