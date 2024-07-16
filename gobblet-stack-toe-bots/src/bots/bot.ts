import { GameConfig, Game, Move, Player } from '@aehe-games/gobblet-stack-toe-engine/src/interface';

export default interface Bot {
    
    /**
     * Tells if the bot can play games for given game config
     * @param gameConfig 
     */
    canPlay(gameConfig: GameConfig): boolean,

    /**
     * Initialize the bot, called only once
     * @param gameConfig
     * @param player 
     */
    onLoad?(gameConfig: GameConfig): void
    
    /**
    * Tells bot a new game has started
    * @param gameConfig
    * @param player 
    */
    onNewGame?(gameConfig: GameConfig, player: Player): void
    
    /**
     * For provided game, the bot calculates the next move that can be played
     * @param game 
     * @returns the next move
     */
    playMove(game: Game): Promise<Move>

    /**
     * Tells bot the game has ended
     * @param game
     */
    onGameEnd?(game: Game): void

    /**
     * Deactivate the bot
     */
    unload?(): void
}