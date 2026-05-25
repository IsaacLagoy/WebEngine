import {
  getCharacterDefinitions,
  mergePersistedCharacter,
} from "../characters/characterCatalog";
import type {
  GameData,
  GiftsGivenByCharacter,
  Player,
  PlayerInventory,
  Clothing,
  ScheduledEvent,
  Character,
} from "../types";
import { DEFAULT_GAME_DATA, DEFAULT_PLAYER } from "../types";
import { getStarterInventory } from "../items/catalog";

function parseClothingEntry(raw: unknown): Clothing | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  return { id: o.id, name: o.name };
}

function parseOwnedGifts(raw: unknown): Record<string, number> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "number" && Number.isFinite(v) && Number.isInteger(v) && v > 0) {
      out[k] = v;
    }
  }
  return out;
}

function parseScheduledEvent(raw: unknown): ScheduledEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.eventId === "string" && o.eventId.length > 0) {
    return { eventId: o.eventId };
  }
  return null;
}

function parseCharacters(raw: unknown): Record<string, Character> {
  const saved =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const out: Record<string, Character> = {};
  for (const def of getCharacterDefinitions()) {
    out[def.id] = mergePersistedCharacter(def, saved[def.id]);
  }
  return out;
}

function parseGiftsGiven(raw: unknown): GiftsGivenByCharacter {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: GiftsGivenByCharacter = {};
  for (const [characterId, giftsRaw] of Object.entries(raw)) {
    if (giftsRaw == null || typeof giftsRaw !== "object" || Array.isArray(giftsRaw)) {
      continue;
    }
    const gifts: Record<string, number> = {};
    for (const [giftId, count] of Object.entries(giftsRaw)) {
      if (
        typeof count === "number" &&
        Number.isFinite(count) &&
        Number.isInteger(count) &&
        count > 0
      ) {
        gifts[giftId] = count;
      }
    }
    if (Object.keys(gifts).length > 0) {
      out[characterId] = gifts;
    }
  }
  return out;
}

function parseInventory(raw: unknown): PlayerInventory | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.ownedClothes)) return null;
  const ownedClothes = o.ownedClothes.map(parseClothingEntry).filter(Boolean) as Clothing[];
  const ownedGifts = parseOwnedGifts(o.ownedGifts);
  return { ownedClothes, ownedGifts };
}

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
    const characters = parseCharacters(parsed.characters);
    const inventory = parseInventory(parsed.inventory) ?? getStarterInventory();
    const giftsGiven = parseGiftsGiven(parsed.giftsGiven);
    const scheduledEvent = parseScheduledEvent(parsed.scheduledEvent);
    return {
      player: { money, clothing },
      currentScene,
      characters,
      inventory,
      giftsGiven,
      scheduledEvent,
    };
  } catch {
    return null;
  }
}
