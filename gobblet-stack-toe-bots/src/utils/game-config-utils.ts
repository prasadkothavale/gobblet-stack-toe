import { GameConfig } from "@aehe-games/gobblet-stack-toe-engine/src/interface";

export const classic: GameConfig = {
  boardSize: 4,
  gobbletSize: 3,
  gobbletsPerSize: 3,
};

export const beginner: GameConfig = {
  boardSize: 3,
  gobbletSize: 3,
  gobbletsPerSize: 2,
};

export default function getGameConfig(gameMode: string): GameConfig {
  switch (gameMode) {
    case "beginner":
      return beginner;
    case "classic":
      return classic;
    default:
      throw new Error(`Invalid game mode: ${gameMode}`);
  }
}
