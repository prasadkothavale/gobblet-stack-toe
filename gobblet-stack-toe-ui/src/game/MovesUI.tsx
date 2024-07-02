import { Move } from "@aehe-games/gobblet-stack-toe-engine/src/interface";
import { Card } from 'primereact/card';
import { ReactElement } from "react";

export default function MovesUI ({moves}: MovesUIInterface) {

    const moveNotations: ReactElement[] = moves.map((move: Move, index: number) => <li key={'move-' + index}>{move.toNotation()}</li>);

    return <Card>
        <h3>Moves</h3>
        <ol>{moveNotations}</ol>
    </Card>

}

export interface MovesUIInterface {
    moves: Move[];
}