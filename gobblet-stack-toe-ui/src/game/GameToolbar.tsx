import { Player } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import { Rating, RatingChangeEvent } from "primereact/rating";
import { Button } from 'primereact/button';
import { Dispatch, SetStateAction } from "react";
import { ProgressBar } from 'primereact/progressbar';

export default function GameToolbar({difficulty, setDifficulty, human, turn, botProgress, onReset}: GameToolbarInterface) {

    const renderTurn = () => {
        if (turn === human) {
            return <h3>It's <span className="highlight-dark">your</span> turn!</h3>;
        } else {
            return <div>
                <h3>I am thinking!</h3>
                <ProgressBar value={botProgress} displayValueTemplate={() => (<></>)}></ProgressBar>
            </div>
        }
    };

    return (
        <div className="game-toolbar grid">
            <div className='col-6 md:col-3'>
                <h3>You are <span className={human === Player.WHITE? 'human human-white' : 'human human-black'}>{human}</span></h3>
            </div>
            <div className='col-6 md:col-3'>
                {renderTurn()}
            </div>
            <div className='col-8 md:col-4 difficulty'>
                <label>Difficulty</label> 
                <Rating value={difficulty} onChange={(e: RatingChangeEvent) => setDifficulty(e.value || 0)} cancel={false} />
            </div>
            <div className='col-4 md:col-2'>
                <Button icon="pi pi-refresh" onClick={onReset}/>
            </div>
        </div>
    );
}

export interface GameToolbarInterface {
    difficulty: number;
    setDifficulty: Dispatch<SetStateAction<number>>;
    human: Player | undefined;
    turn: Player | undefined;
    botProgress: number | null | undefined;
    onReset: () => void;
}