import itemsJson from "../../json/items.json";
import type { Clothing, ClothingSlot, GameData, PlayerInventory } from "../types";
import { CLOTHING_SLOTS, DEFAULT_GAME_DATA } from "../types";

type JsonItemType = "head" | "top" | "bottom" | "shoes" | "gift";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function clothingIdFromJson(slot: ClothingSlot, name: string): string {
  return `${slot}_${slugify(name)}`;
}

export function giftIdFromJson(name: string): string {
  return `gift_${slugify(name)}`;
}

function isClothingSlot(t: string): t is ClothingSlot {
  return (CLOTHING_SLOTS as readonly string[]).includes(t);
}

type CatalogRow = {
  id: string;
  name: string;
  price: number;
  type: JsonItemType;
};

export type ShopListingRow = CatalogRow;

/** All rows from items.json with stable ids (clothing + gifts). */
export function getShopCatalog(): CatalogRow[] {
  type JsonItem = {
    name: string;
    price: number;
    type: string;
  };
  const rows = itemsJson as JsonItem[];
  const out: CatalogRow[] = [];
  for (const row of rows) {
    if (row.type === "gift") {
      out.push({
        id: giftIdFromJson(row.name),
        name: row.name,
        price: row.price,
        type: "gift",
      });
    } else if (isClothingSlot(row.type)) {
      out.push({
        id: clothingIdFromJson(row.type, row.name),
        name: row.name,
        price: row.price,
        type: row.type,
      });
    }
  }
  return out;
}

export function getCatalogNameById(itemId: string): string {
  const hit = getShopCatalog().find((r) => r.id === itemId);
  return hit?.name ?? itemId;
}

/** Up to `count` random listings: all gifts plus clothing the player does not own yet. */
export function pickRandomStoreStock(
  gameData: GameData,
  count = 4,
  random: () => number = Math.random
): ShopListingRow[] {
  const catalog = getShopCatalog();
  const ownedIds = new Set(gameData.inventory.ownedClothes.map((c) => c.id));
  const pool: ShopListingRow[] = [];
  for (const row of catalog) {
    if (row.type === "gift") pool.push(row);
    else if (!ownedIds.has(row.id)) pool.push(row);
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const t = pool[i]!;
    pool[i] = pool[j]!;
    pool[j] = t;
  }
  return pool.slice(0, Math.min(count, pool.length));
}

const STARTER_OWNED_CLOTHES: Clothing[] = [
  { id: "top_t_shirt", name: "T-Shirt" },
  { id: "bottom_pants", name: "Pants" },
  { id: "shoes_shoes", name: "Shoes" },
  { id: "head_glasses", name: "Glasses" },
];

/**
 * Default wardrobe when there is no localStorage save or no valid `inventory` in the save.
 * Fixed list — not derived from items.json (the shop catalog can grow independently).
 */
export function getStarterInventory(): PlayerInventory {
  return {
    ownedClothes: STARTER_OWNED_CLOTHES.map((c) => ({ ...c })),
    ownedGifts: {},
  };
}

export function createInitialGameData(): GameData {
  return {
    ...DEFAULT_GAME_DATA,
    inventory: getStarterInventory(),
  };
}
