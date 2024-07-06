import { Gobblet } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import './gobblet.css';
import { MutableRefObject } from 'react';
import SizedStack from '@aehe-games/gobblet-stack-toe-engine/src/sized-stack';

export default function GobbletUI({cell, gobbletRef} : {cell: SizedStack<Gobblet>, gobbletRef: MutableRefObject<null>| undefined}) {
    const cellArray = cell.toArray();
    const gobblet = cellArray.length > 0? cell.peek() : null;
    const capturedGobblet = cellArray.length > 1? cellArray[cellArray.length - 2] : null;
    console.log(cellArray.length > 1? cellArray : null);
    
    if (gobblet) {
        if (capturedGobblet) {
            return <div className='gobblet-stack'>
                <div className={`gobblet gobblet-${gobblet?.player.charAt(0)} gobblet-${gobblet?.size}`} ref={gobbletRef}/>
                <div className={`gobblet gobblet-captured gobblet-${capturedGobblet?.player.charAt(0)} gobblet-${capturedGobblet?.size}`}/>
            </div>;
        } else {
            return <div className={`gobblet gobblet-${gobblet?.player.charAt(0)} gobblet-${gobblet?.size}`} ref={gobbletRef}/>;
        }
    } else {
        return <></>;
    }
}