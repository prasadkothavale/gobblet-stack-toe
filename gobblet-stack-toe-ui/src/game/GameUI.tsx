import { useEffect, useState } from "react";
import GameToolbar from "./GameToolbar";
import { Move, Player, Game, Gobblet, GameConfig } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import './game-ui.css';
import SizedStack from "@aehe-games/gobblet-stack-toe-engine/src/sized-stack";
import { ProgressSpinner } from 'primereact/progressspinner';
import GameEngine from "@aehe-games/gobblet-stack-toe-engine/src/game-engine";
import GameBoardUI from "./GameBoardUI";
import MovesUI from "./MovesUI";
        

const gameConfig: GameConfig = {
    boardSize: 4,
    gobbletSize: 3,
    gobbletsPerSize: 3
}

export default function GameUI() {

    const [turn, setTurn] = useState<Player>();
    const [human, setHuman] = useState<Player>();
    const [difficulty, setDifficulty] = useState<number>(3);
    const [botProgress, setBotProgress] = useState<number>(0);
    const [moves, setMoves] = useState<Move[]>([])
    const [game, setGame] = useState<Game>();
    const [board, setBoard] = useState<SizedStack<Gobblet>[][]>([]);
    const [externalStack, setExternalStack] = useState<SizedStack<Gobblet>[]>([]);

    useEffect(() => {
        init(3, [Player.WHITE, Player.BLACK][Math.round(Math.random())]);
    }, []);

    const init = (difficulty: number, human: Player) => {
        setTurn(Player.WHITE);
        setHuman(human);
        setDifficulty(difficulty);
        setBotProgress(Math.random() * 100);
        const game: Game = GameEngine.createGame(gameConfig);
        setGame(game);
        setBoard(game.board);
        setExternalStack(game.externalStack);
    }

    const onReset = () => {
        init(difficulty, human === Player.WHITE ? Player.BLACK : Player.WHITE);
    }

    const onPlayMove = (move: Move): void => {

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
                <div className="col-12 sm:col-8">
                    <GameBoardUI
                        difficulty={difficulty}
                        board={board}
                        externalStack={externalStack}
                        playMove={onPlayMove}
                        gameConfig={gameConfig}
                    />
                 </div>
                 <div className="col-12 sm:col-4">
                    <MovesUI moves={moves} />
                </div>
            </div>;
        } else {
            return <ProgressSpinner strokeWidth="3"/>;
        }
    }

    return <>{renderGameUI()}</>
}