import { GameConfig, Gobblet, Move, Location, Constants, Player } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import SizedStack from "@aehe-games/gobblet-stack-toe-engine/src/sized-stack";
import GobbletUI from "./GobbletUI";
import { Dispatch, MutableRefObject, ReactElement, SetStateAction, useRef } from "react";
import './game-board-ui.css'
import { Toast } from "primereact/toast";

export default function GameBoardUI({board, externalStack, playMove, gameConfig, turn, human, lastMove, source, setSource, sequences, selectedGobbletRef, selectedTargetRef}: BoardInterface) {
    const toast = useRef(null);

    const onCellClick = (location: Location) => {
        if (!source) {
            const sourceStack = (location.board && location.x !== null) ? board[location.y][location.x] : externalStack[location.y]
            if (turn !== human) {
                // @ts-expect-error(18047)
                toast.current.show({severity:'info', summary: 'Not You Turn', detail: 'Please wait, I am thinking my move!', life: 5000});
            }else if (sourceStack.isEmpty()) {
                // @ts-expect-error(18047)
                toast.current.show({severity:'info', summary: 'Invalid Move', detail: 'You cannot select an empty location.', life: 5000});
            } else if (sourceStack.peek().player !== turn) {
                // @ts-expect-error(18047)
                toast.current.show({severity:'info', summary: 'Invalid Move', detail: 'Don\'t move opponent\'s gobblet', life: 5000});
            } else {
                setSource(location);
            }
        } else if (location.equals(source)) {
            setSource(null);
        } else {
            playMove(new Move(source, location));
        }
    }

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
                const location: Location = new Location(true, c, r);
                const subNotation: string = location.toSubNotation();
                const selected = source && source.board && source.y === r && source.x === c;
                const lastSelectionSource = lastMove && (lastMove.source.board && lastMove.source.y === r && lastMove.source.x === c);
                const lastSelectionTarget = lastMove && (lastMove.target.y === r && lastMove.target.x === c);
                const isInSequence = (sequences || [])
                    .flatMap((sequence: Location[]) => sequence)
                    .some((sequenceLocation: Location) => location.equals(sequenceLocation));
                const classes = ['board-cell'];
                selected && classes.push('selected');
                lastSelectionSource && classes.push('last-selection-source');
                lastSelectionTarget && classes.push('last-selection-target');
                isInSequence && classes.push('in-sequence');
                cells.push(
                    <td className={classes.join(' ')} 
                        id={subNotation} key={subNotation} 
                        onClick={() => onCellClick(new Location(true, c, r))}
                        ref={lastSelectionTarget ? selectedTargetRef : undefined}
                    >
                        <GobbletUI cell={cell} gobbletRef={lastSelectionSource ? selectedGobbletRef : undefined} />
                    </td>);
            })
            rows.push(<tr key={r}>{cells}</tr>);
        });

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
            const selected = source && !source.board && source.y === index;
            const lastSelection = lastMove && !lastMove.source.board && lastMove.source.y === index;
            const classes = ['board-cell'];
            selected && classes.push('selected');
            lastSelection && classes.push('last-selection-source');
            return <td className={classes.join(' ')}
                key={'#'+index} id={'#'+index}
                onClick={() => onCellClick(new Location(false, null, index))}
            >
                <GobbletUI cell={stack} gobbletRef={lastSelection ? selectedGobbletRef:undefined}/>
            </td>;
        });
        return <table className="game-external-stack-ui">
            <tbody>
                <tr>{indexRow}</tr><tr>{row}</tr>
            </tbody>
        </table>;
    }

    return <div className="game-board-ui">
        <Toast ref={toast} />
        {renderBoard(board)}
        {renderExternalStack(externalStack)}
    </div>
}

export interface BoardInterface {
    board: SizedStack<Gobblet>[][];
    externalStack: SizedStack<Gobblet>[];
    gameConfig: GameConfig;
    turn: Player;
    human: Player;
    playMove: (move: Move) => Promise<boolean>;
    lastMove: Move | null | undefined;
    source: Location | null | undefined;
    setSource: Dispatch<SetStateAction<Location | null | undefined>>;
    sequences: Location[][];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedGobbletRef: MutableRefObject<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectedTargetRef: MutableRefObject<any>;
}