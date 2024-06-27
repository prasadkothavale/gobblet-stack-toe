import React from 'react';
import { Gobblet } from '../../../gobblet-stack-toe-engine/dist';
import './gobblet.css';

export default function GobbletUI({gobblet} : {gobblet: Gobblet}) {

    return <div className={`gobblet gobblet-${gobblet?.player.charAt(0)}-${gobblet?.size}`} />
}