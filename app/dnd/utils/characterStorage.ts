import type { CharacterItemSaveData } from "@/app/dnd/utils/statCalculator";
import {
  CharacterStats,
  createEmptyCharacterItems,
  createEmptyStats,
  createEmptyWeapon,
  normalizeCharacterItems,
  normalizeBaseStats,
  normalizeWeapon,
  normalizeProficiency,
  type ProficiencyTier,
  type WeaponData,
} from "@/app/dnd/utils/statCalculator";

export const DND_CHARACTERS_STORAGE_KEY = "dnd-characters";

export interface CharacterSaveData {
  baseStats: CharacterStats;
  weapon: WeaponData;
  proficiency: ProficiencyTier;
  armorSlots: CharacterItemSaveData["armorSlots"];
  accessories: CharacterItemSaveData["accessories"];
}

export interface SavedCharacter extends CharacterSaveData {
  name: string;
  updatedAt: number;
}

interface CharacterStore {
  characters: Record<string, SavedCharacter>;
}

function normalizeSaveData(
  data?: Partial<CharacterSaveData> & { armorPieces?: Record<string, unknown> }
): CharacterSaveData {
  const items = normalizeCharacterItems(data);
  return {
    baseStats: normalizeBaseStats(data?.baseStats),
    weapon: normalizeWeapon(data?.weapon),
    proficiency: normalizeProficiency(data?.proficiency),
    armorSlots: items.armorSlots,
    accessories: items.accessories,
  };
}

function normalizeSavedCharacter(raw: Partial<SavedCharacter>): SavedCharacter {
  const data = normalizeSaveData(raw);
  return {
    name: raw.name?.trim() ?? "",
    baseStats: data.baseStats,
    weapon: data.weapon,
    proficiency: data.proficiency,
    armorSlots: data.armorSlots,
    accessories: data.accessories,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now(),
  };
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function readStore(): CharacterStore {
  if (typeof window === "undefined") return { characters: {} };
  try {
    const raw = localStorage.getItem(DND_CHARACTERS_STORAGE_KEY);
    if (!raw) return { characters: {} };
    const parsed = JSON.parse(raw) as CharacterStore;
    if (!parsed?.characters || typeof parsed.characters !== "object") {
      return { characters: {} };
    }
    const characters: Record<string, SavedCharacter> = {};
    for (const [key, value] of Object.entries(parsed.characters)) {
      characters[key] = normalizeSavedCharacter(value);
    }
    return { characters };
  } catch {
    return { characters: {} };
  }
}

function writeStore(store: CharacterStore): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(DND_CHARACTERS_STORAGE_KEY, JSON.stringify(store));
}

export function listCharacterNames(): string[] {
  const store = readStore();
  return Object.values(store.characters)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function characterNameExists(name: string): boolean {
  const key = normalizeName(name);
  if (!key) return false;
  return key in readStore().characters;
}

export function loadCharacter(name: string): SavedCharacter | null {
  const key = normalizeName(name);
  const raw = readStore().characters[key];
  if (!raw) return null;
  return normalizeSavedCharacter(raw);
}

export function saveCharacter(name: string, data: CharacterSaveData): void {
  const trimmed = name.trim();
  const key = normalizeName(trimmed);
  if (!key) return;

  const normalized = normalizeSaveData(data);
  const store = readStore();
  store.characters[key] = {
    name: trimmed,
    baseStats: normalized.baseStats,
    weapon: normalized.weapon,
    proficiency: normalized.proficiency,
    armorSlots: normalized.armorSlots,
    accessories: normalized.accessories,
    updatedAt: Date.now(),
  };
  writeStore(store);
}

export function createCharacter(name: string): SavedCharacter {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Character name is required.");
  }
  if (characterNameExists(trimmed)) {
    throw new Error("A character with this name already exists.");
  }

  const emptyItems = createEmptyCharacterItems();
  const character: SavedCharacter = {
    name: trimmed,
    baseStats: createEmptyStats(),
    weapon: createEmptyWeapon(),
    proficiency: "none",
    armorSlots: emptyItems.armorSlots,
    accessories: emptyItems.accessories,
    updatedAt: Date.now(),
  };

  const store = readStore();
  store.characters[normalizeName(trimmed)] = character;
  writeStore(store);
  return character;
}

export function deleteCharacter(name: string): boolean {
  const key = normalizeName(name);
  if (!key) return false;

  const store = readStore();
  if (!(key in store.characters)) return false;

  delete store.characters[key];
  writeStore(store);
  return true;
}
