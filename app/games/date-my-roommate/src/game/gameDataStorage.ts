import type { GameData, Player } from "../types";
import { DEFAULT_GAME_DATA, DEFAULT_PLAYER } from "../types";

export const GAME_DATA_STORAGE_KEY = "date-my-roommate:game-data";

export function safeParseGameData(raw: string | null): GameData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameData>;
    const parsedPlayer: Partial<Player> =
      parsed.player && typeof parsed.player === "object" ? parsed.player : {};
    const money =
      typeof parsedPlayer.money === "number" ? parsedPlayer.money : DEFAULT_PLAYER.money;
    const clothing =
      parsedPlayer.clothing && typeof parsedPlayer.clothing === "object"
        ? parsedPlayer.clothing
        : {};
    const currentScene =
      typeof parsed.currentScene === "string" && parsed.currentScene.length > 0
        ? parsed.currentScene
        : DEFAULT_GAME_DATA.currentScene;
    const characters =
      parsed.characters && typeof parsed.characters === "object" ? parsed.characters : {};
    return {
      player: { money, clothing },
      currentScene,
      characters,
    };
  } catch {
    return null;
  }
}
