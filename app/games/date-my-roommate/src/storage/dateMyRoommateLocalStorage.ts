import type { GameData } from "../types";

/**
 * Single localStorage namespace for Date My Roommate.
 * All persisted data is stored under this key as a versioned envelope so we can add
 * more slices later without colliding with other site keys.
 */
export const DATE_MY_ROOMMATE_STORAGE_ROOT_KEY = "date-my-roommate";

/** Older saves stored stringified `GameData` at this key; read as fallback until next persist. */
const DATE_MY_ROOMMATE_FLAT_GAME_DATA_FALLBACK_KEY = "date-my-roommate:game-data";

type PersistedEnvelopeV1 = {
  v: 1;
  gameData: GameData;
};

/** Returns JSON string of the inner `gameData` object, or `null`. */
export function loadDateMyRoommateGameDataJson(): string | null {
  const root = window.localStorage.getItem(DATE_MY_ROOMMATE_STORAGE_ROOT_KEY);
  if (root) {
    try {
      const parsed = JSON.parse(root) as Partial<PersistedEnvelopeV1>;
      if (parsed && typeof parsed === "object" && parsed.gameData != null) {
        return JSON.stringify(parsed.gameData);
      }
    } catch {
      return null;
    }
    return null;
  }
  return window.localStorage.getItem(DATE_MY_ROOMMATE_FLAT_GAME_DATA_FALLBACK_KEY);
}

export function persistDateMyRoommateGameData(gameData: GameData): void {
  const envelope: PersistedEnvelopeV1 = { v: 1, gameData };
  window.localStorage.setItem(DATE_MY_ROOMMATE_STORAGE_ROOT_KEY, JSON.stringify(envelope));
  window.localStorage.removeItem(DATE_MY_ROOMMATE_FLAT_GAME_DATA_FALLBACK_KEY);
}

export function clearDateMyRoommatePersistedStorage(): void {
  window.localStorage.removeItem(DATE_MY_ROOMMATE_STORAGE_ROOT_KEY);
  window.localStorage.removeItem(DATE_MY_ROOMMATE_FLAT_GAME_DATA_FALLBACK_KEY);
}
