import { MutableRefObject, useEffect, useRef, useState } from "react";
import GameToolbar from "./GameToolbar";
import { Move, Player, Game, Gobblet, GameConfig, GameStatus, Location } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import './game-ui.css';
import SizedStack from "@aehe-games/gobblet-stack-toe-engine/src/sized-stack";
import { ProgressSpinner } from 'primereact/progressspinner';
import GameEngine from "@aehe-games/gobblet-stack-toe-engine/src/game-engine";
import GameBoardUI from "./GameBoardUI";
import MovesUI from "./MovesUI";
import { Toast } from 'primereact/toast';
import HeuristicBot, { MoveScore } from '@aehe-games/gobblet-stack-toe-bots/src/bots/heuristic-bot';
        

const gameConfig: GameConfig = {
    boardSize: 4,
    gobbletSize: 3,
    gobbletsPerSize: 3
}

export default function GameUI() {

    const [turn, setTurn] = useState<Player>(Player.WHITE);
    const [human, setHuman] = useState<Player>([Player.WHITE, Player.BLACK][Math.round(Math.random())]);
    const [difficulty, setDifficulty] = useState<number>(3);
    const [botProgress, setBotProgress] = useState<number>(0);
    const [moves, setMoves] = useState<Move[]>([])
    const [game, setGame] = useState<Game>(GameEngine.createGame(gameConfig));
    const [board, setBoard] = useState<SizedStack<Gobblet>[][]>([]);
    const [externalStack, setExternalStack] = useState<SizedStack<Gobblet>[]>([]);
    const [lastMove, setLastMove] = useState<Move>();
    const [source, setSource] = useState<Location | null>();

    const toast = useRef(null);
    const selectedGobbletRef: MutableRefObject<HTMLElement | undefined> = useRef<HTMLElement>();
    const selectedTargetRef: MutableRefObject<HTMLElement | undefined> = useRef<HTMLElement>();


    const heuristicBot: HeuristicBot = new HeuristicBot(difficulty-1);
    heuristicBot.onLoad(gameConfig);

    useEffect(() => {
        init(3, human);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (turn !== human && board.length > 0) {
            botsTurn();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [turn, human, board]);

    useEffect(() => {
        if (lastMove) {
        animateMove(selectedGobbletRef, selectedTargetRef)
            .then(() => postPlayMove(lastMove))
            .catch(() => {console.warn('animation failed')});
        }
    }, [lastMove]);

    const init = (difficulty: number, human: Player) => {
        setTurn(Player.WHITE);
        setHuman(human);
        setDifficulty(difficulty);
        const game: Game = GameEngine.createGame(gameConfig);
        const board = GameEngine.getBoard(GameEngine.getBoardNumber(game.board, game.config), game.config);
        const externalStack = GameEngine.getExternalStack(GameEngine.getExternalStackNumber(game.externalStack, game.config), game.config);
        setGame(game);
        setBoard(board);
        setExternalStack(externalStack);
        setExternalStack(game.externalStack);
        setMoves([]);
        setLastMove(undefined);
        heuristicBot.onNewGame(gameConfig, human === Player.WHITE? Player.BLACK : Player.WHITE );
    }

    const onReset = () => {
        init(difficulty, human === Player.WHITE ? Player.BLACK : Player.WHITE);
    }

    const onPlayMove = async (move: Move): Promise<boolean> => {
        try {
            GameEngine.performMove(game, move);
            setLastMove(move);
            return true;
        } catch (err) {
            // @ts-expect-error(18047)
            toast.current.show({severity:'warn', summary: 'Invalid Move', detail:`${err}`.replace('Error: Invalid move: ', ''), life: 5000});
            setSource(null);
            return false;
        }
    }

    const postPlayMove = (move: Move | undefined) => {
        if (!move) {
            return;
        }
        
        //GameEngine.performMove(game, move);
        const board = GameEngine.getBoard(GameEngine.getBoardNumber(game.board, game.config), game.config);
        const externalStack = GameEngine.getExternalStack(GameEngine.getExternalStackNumber(game.externalStack, game.config), game.config);
        setBoard(board);
        setExternalStack(externalStack);
        setMoves([...moves, move]);
        setTurn(game.turn);
        setSource(null);

        if (game.state.status === GameStatus.END) {
            if (game.state.winner === human) {
                // @ts-expect-error(18047)
                toast.current.show({severity:'success', summary: 'Game Over', detail:'Congratulations! You won.', life: 30000});
            } else {
                // @ts-expect-error(18047)
                toast.current.show({severity:'error', summary: 'Game Over', detail:'You lost! Try again.', life: 30000});

            }
        } else if (game.state.status !== GameStatus.LIVE) {
            // @ts-expect-error(18047)
            toast.current.show({severity:'info', summary: 'Game Over', detail:'It\'s a draw.', life: 30000});
        }
    }

    const botsTurn = async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const moves: Move[] = GameEngine.getValidMoves(game);
                const scoreBoards: MoveScore[] = moves.map((nextMove: Move, index: number) => {
                    const start = new Date().getTime();
                    const moveScore: MoveScore = heuristicBot.minMax(board, externalStack, gameConfig, nextMove, turn, difficulty-1, [nextMove.toNotation()]);
                    moveScore.time = new Date().getTime() - start;
                    setBotProgress((index+1)*100/(moves.length));
                    return moveScore;
                }).sort((m1, m2) => {
                    if (m1.score === m2.score) {
                        return m1.tree.length - m2.tree.length;
                    } else {
                        return game.turn === Player.WHITE ? (m2.score - m1.score) : (m1.score - m2.score);
                    }
                });
                onPlayMove(scoreBoards[0].move);
                resolve(scoreBoards[0].move);
            }, 500);
        });
    }

    const animateMove = (selectedGobbletRef: MutableRefObject<HTMLElement | undefined>, selectedTargetRef: MutableRefObject<HTMLElement | undefined>):Promise<void> => {
        const gobbletElement = selectedGobbletRef?.current
        const targetCellElement = selectedTargetRef?.current;
        if (!gobbletElement || !targetCellElement) {
            return Promise.reject();
        }

        const sourceCellElement = gobbletElement.parentElement;
        if (!sourceCellElement) {
            return Promise.reject();
        }

        const sourceRect = sourceCellElement.getBoundingClientRect();
        const targetRect = targetCellElement.getBoundingClientRect();
        const xTranslate = targetRect.left - sourceRect.left + 2;
        const yTranslate = targetRect.top - sourceRect.top + 2;
        gobbletElement.style.transitionDuration = '500ms';
        gobbletElement.style.transform = `translate(${xTranslate}px, ${yTranslate}px)`;
        gobbletElement.style.zIndex = '4';
        return new Promise((resolve) => {
            setTimeout(() => {
                gobbletElement.style.transitionDuration = '0ms';
                gobbletElement.style.transform = `translate(0px, 0px)`;
                resolve();
            }, 500); // should be same as transition-duration of .gobblet css class + some buffer time
        });
    }

    const renderGameUI = () => {
        if (game) {
            return <div className="grid">
                <div className="col-12">
                    <GameToolbar 
                        difficulty={difficulty} 
                        setDifficulty={setDifficulty}
                        human={human}
                        turn={turn}
                        botProgress={botProgress}
                        onReset={onReset}
                    />
                </div>
                <div className="col-12">
                    <GameBoardUI
                        board={board}
                        externalStack={externalStack}
                        playMove={onPlayMove}
                        gameConfig={gameConfig}
                        turn={turn}
                        lastMove={lastMove}
                        human={human}
                        source={source}
                        setSource={setSource}
                        sequences={game.state.sequences || []}
                        selectedGobbletRef={selectedGobbletRef}
                        selectedTargetRef={selectedTargetRef}
                    />
                 </div>
                 <div className="col-12">
                    <MovesUI moves={moves} />
                </div>
            </div>;
        } else {
            return <ProgressSpinner strokeWidth="3"/>;
        }
    }

    return <>
        <Toast ref={toast} />
        {renderGameUI()}
    </>
}