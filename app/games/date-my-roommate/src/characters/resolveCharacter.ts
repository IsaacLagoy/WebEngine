import type { DateMyRoommateGame } from "../game/DateMyRoommateGame";
import {
  characterFromDefinition,
  mergePersistedCharacter,
  resolveCharacterDefinition,
} from "./characterCatalog";
import type { Character } from "../types";

/** Match by character id or display name (case-insensitive). */
export function resolveCharacterFromGame(
  game: DateMyRoommateGame,
  nameOrId: string
): Character | null {
  const def = resolveCharacterDefinition(nameOrId);
  if (!def) return null;

  const saved = game.gameData.characters[def.id];
  if (saved) {
    return mergePersistedCharacter(def, saved);
  }

  return characterFromDefinition(def);
}

export function requireCharacterFromGame(
  game: DateMyRoommateGame,
  nameOrId: string
): Character {
  const ch = resolveCharacterFromGame(game, nameOrId);
  if (!ch) {
    throw new Error(`Unknown character: ${nameOrId}`);
  }
  return ch;
}
