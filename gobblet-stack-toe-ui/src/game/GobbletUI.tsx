import { Gobblet } from '@aehe-games/gobblet-stack-toe-engine/src/interface';
import './gobblet.css';

export default function GobbletUI({gobblet} : {gobblet: Gobblet}) {

    return <div className={`gobblet gobblet-${gobblet?.player.charAt(0)} gobblet-${gobblet?.size}`} />
}