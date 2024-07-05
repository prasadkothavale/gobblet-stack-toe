import { Gobblet } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import './gobblet.css';
import { MutableRefObject } from 'react';

export default function GobbletUI({gobblet, gobbletRef} : {gobblet: Gobblet, gobbletRef: MutableRefObject<null>| undefined}) {

    return <div className={`gobblet gobblet-${gobblet?.player.charAt(0)} gobblet-${gobblet?.size}`} ref={gobbletRef}/>
}