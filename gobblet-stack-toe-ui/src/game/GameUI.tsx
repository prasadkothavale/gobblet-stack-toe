import { useEffect, useRef, useState } from "react";
import GameToolbar from "./GameToolbar";
import { Move, Player, Game, Gobblet, GameConfig, GameStatus } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
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

    const toast = useRef(null);
    const heuristicBot: HeuristicBot = new HeuristicBot();
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

    const init = (difficulty: number, human: Player) => {
        setTurn(Player.WHITE);
        setHuman(human);
        setDifficulty(difficulty);
        const game: Game = GameEngine.createGame(gameConfig);
        setGame(game);
        setBoard(game.board);
        setExternalStack(game.externalStack);
        heuristicBot.onNewGame(gameConfig, human === Player.WHITE? Player.BLACK : Player.WHITE );
    }

    const onReset = () => {
        init(difficulty, human === Player.WHITE ? Player.BLACK : Player.WHITE);
    }

    const onPlayMove = (move: Move): boolean => {
        try {
            GameEngine.performMove(game, move);
            const board = GameEngine.getBoard(GameEngine.getBoardNumber(game.board, game.config), game.config);
            const externalStack = GameEngine.getExternalStack(GameEngine.getExternalStackNumber(game.externalStack, game.config), game.config);
            setBoard(board);
            setExternalStack(externalStack);
            setMoves([...moves, move]);
            setTurn(game.turn);
            setLastMove(move);

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

            return true;
        } catch (err) {
            // @ts-expect-error(18047)
            toast.current.show({severity:'warn', summary: 'Invalid Move', detail:`${err}`.replace('Error: Invalid move: ', ''), life: 5000});
            return false;
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
            }, 250);
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