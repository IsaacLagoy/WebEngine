import { getCharacterDefinitions } from "../../characters/characterCatalog";
import { getGiftIdByName } from "../../items/catalog";

export type GiftReaction = "loved" | "hated" | "tolerated";

function giftIdsFromNames(
  names: string[],
  characterId: string,
  listLabel: string
): Set<string> {
  const ids = new Set<string>();
  for (const name of names) {
    const id = getGiftIdByName(name);
    if (id) ids.add(id);
    else console.warn(`Unknown ${listLabel} gift "${name}" for ${characterId}`);
  }
  return ids;
}

function buildGiftPreferenceMaps(): {
  loved: Record<string, Set<string>>;
  hated: Record<string, Set<string>>;
} {
  const loved: Record<string, Set<string>> = {};
  const hated: Record<string, Set<string>> = {};

  for (const def of getCharacterDefinitions()) {
    loved[def.id] = giftIdsFromNames(def.lovedGifts ?? [], def.id, "loved");
    hated[def.id] = giftIdsFromNames(def.hatedGifts ?? [], def.id, "hated");
  }

  return { loved, hated };
}

const { loved: lovedByCharacter, hated: hatedByCharacter } = buildGiftPreferenceMaps();

/** How a character feels about receiving a specific gift (by item id). */
export function getGiftReaction(characterId: string, giftId: string): GiftReaction {
  if (lovedByCharacter[characterId]?.has(giftId)) return "loved";
  if (hatedByCharacter[characterId]?.has(giftId)) return "hated";
  return "tolerated";
}
