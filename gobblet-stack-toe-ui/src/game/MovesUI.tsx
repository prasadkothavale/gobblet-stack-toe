import { Move } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import { ReactElement } from "react";
import { Chip } from 'primereact/chip';
import { Badge } from 'primereact/badge';
import './moves-ui.css';

export default function MovesUI ({moves}: MovesUIInterface) {

    const moveTemplate = (index: number, move: Move) => {
        return <>
            <Badge value={index} className={index % 2 === 0? 'move-badge black' : 'move-badge white'}/>
            <span>{move.toNotation()}</span>
        </>
    }

    const moveNotations: ReactElement[] = moves.map((move: Move, index: number) => <Chip key={'move-' + index} className="move-chip" template={moveTemplate(index+1, move)} />);

    return <div style={{padding: '0 2rem'}}>
        <h3>Moves:</h3>
        <ol>{moveNotations}</ol>
    </div>

}

export interface MovesUIInterface {
    moves: Move[];
}