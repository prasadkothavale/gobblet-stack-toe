import React from 'react';
import { Gobblet } from '../../../gobblet-stack-toe-engine/dist';

export default function GobbletUI({gobblet} : {gobblet: Gobblet}) {

    return <div style={{width: '50px', height: '50px'}}>{gobblet?.player.charAt(0)}{gobblet?.size}</div>
}