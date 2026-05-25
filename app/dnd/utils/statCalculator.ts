import {
  ARMOR_PIECES,
  createEmptyPieceMitigation,
  type ArmorPiece,
  type PieceMitigationStats,
} from "@/app/dnd/utils/armorUtils";

/**
 * Character stat model and computation pipeline.
 * Armor slots contribute fixed mitigation stats (and presets).
 * Ring and amulet contribute only via mods.
 */

export const RING_ITEM = "Ring" as const;
export const AMULET_ITEM = "Amulet" as const;

export const ACCESSORY_ITEMS = [RING_ITEM, AMULET_ITEM] as const;

export type AccessoryItem = (typeof ACCESSORY_ITEMS)[number];

export interface CharacterStats {
  str: number;
  con: number;
  dex: number;
  int: number;
  wis: number;
  cha: number;
  thac0: number;
  ac: number;
  hp: number;
  mana: number;
  damage_reduction: number;
  magic_resistance: number;
}

export type CoreStatKey =
  | "str"
  | "con"
  | "dex"
  | "int"
  | "wis"
  | "cha"
  | "thac0"
  | "ac"
  | "hp"
  | "mana";

export type BaseStatKey = CoreStatKey | "damage_reduction" | "magic_resistance";

export type StatKey = BaseStatKey;

export const CORE_STAT_DEFINITIONS: { key: CoreStatKey; label: string }[] = [
  { key: "str", label: "Str" },
  { key: "con", label: "Con" },
  { key: "dex", label: "Dex" },
  { key: "int", label: "Int" },
  { key: "wis", label: "Wis" },
  { key: "cha", label: "Cha" },
  { key: "thac0", label: "Thac0" },
  { key: "ac", label: "AC" },
  { key: "hp", label: "hp" },
  { key: "mana", label: "mana" },
];

export const BASE_EXTRA_STAT_DEFINITIONS: {
  key: "damage_reduction" | "magic_resistance";
  label: string;
}[] = [
  { key: "damage_reduction", label: "Damage Reduction %" },
  { key: "magic_resistance", label: "Magic Resistance %" },
];

export const BASE_STAT_DEFINITIONS: { key: BaseStatKey; label: string }[] = [
  ...CORE_STAT_DEFINITIONS,
  ...BASE_EXTRA_STAT_DEFINITIONS,
];

export type ArmorMitigationKey = keyof PieceMitigationStats;

export const ARMOR_MITIGATION_DEFINITIONS: {
  key: ArmorMitigationKey;
  label: string;
}[] = [
  { key: "damage_reduction", label: "Damage Reduction %" },
  { key: "magic_reduction", label: "Magic Reduction %" },
  { key: "rogue_reduction", label: "Rogue Skill Reduction %" },
  { key: "magic_resistance", label: "Magic Resistance %" },
];

export const TOTAL_DEFENSE_DEFINITIONS = ARMOR_MITIGATION_DEFINITIONS;

/** Defense stats shown in the totals header (base DR separate from armor DR). */
export const TOTAL_DEFENSE_DISPLAY_DEFINITIONS: {
  key: keyof ComputedCharacterTotals;
  label: string;
}[] = [
  { key: "armor_damage_reduction", label: "Armor Damage Reduction %" },
  { key: "damage_reduction", label: "Damage Reduction %" },
  { key: "magic_reduction", label: "Magic Reduction %" },
  { key: "rogue_reduction", label: "Rogue Skill Reduction %" },
  { key: "magic_resistance", label: "Magic Resistance %" },
];

export function formatPercentStat(value: number): string {
  return `${value}%`;
}

export type ModifiableStatKey =
  | CoreStatKey
  | "damage_reduction"
  | "magic_reduction"
  | "rogue_reduction"
  | "magic_resistance";

export const MODIFIABLE_STAT_DEFINITIONS: { key: ModifiableStatKey; label: string }[] = [
  ...CORE_STAT_DEFINITIONS,
  ...ARMOR_MITIGATION_DEFINITIONS,
];

const PERCENT_MOD_STATS = new Set<ModifiableStatKey>([
  "damage_reduction",
  "magic_reduction",
  "rogue_reduction",
  "magic_resistance",
]);

export function getModStatLabel(stat: ModifiableStatKey): string {
  return MODIFIABLE_STAT_DEFINITIONS.find((d) => d.key === stat)?.label ?? stat;
}

export function formatModValue(stat: ModifiableStatKey, value: number): string {
  return PERCENT_MOD_STATS.has(stat) ? formatPercentStat(value) : String(value);
}

export interface CharacterItemMod {
  id: string;
  stat: ModifiableStatKey;
  value: number;
}

export interface ArmorPieceData extends PieceMitigationStats {
  mods: CharacterItemMod[];
}

export type ArmorSlotLoadout = Record<ArmorPiece, ArmorPieceData>;

/** Stats armor pieces and weapons may receive via mods (not built-in mitigation fields). */
export const ARMOR_PIECE_MOD_STAT_DEFINITIONS = MODIFIABLE_STAT_DEFINITIONS.filter(
  (d) => !ARMOR_MITIGATION_DEFINITIONS.some((m) => m.key === d.key)
);

export const PROFICIENCY_TIERS = [
  "none",
  "basic",
  "improved",
  "superior",
  "epic",
  "legendary",
  "godly",
] as const;

export type ProficiencyTier = (typeof PROFICIENCY_TIERS)[number];

export const PROFICIENCY_OPTIONS: { id: ProficiencyTier; label: string }[] = [
  { id: "none", label: "None" },
  { id: "basic", label: "Basic" },
  { id: "improved", label: "Improved" },
  { id: "superior", label: "Superior" },
  { id: "epic", label: "Epic" },
  { id: "legendary", label: "Legendary" },
  { id: "godly", label: "Godly" },
];

/** THAC0 subtracted from total per proficiency tier (none = 0, each step +1). */
export function proficiencyThac0Deduction(tier: ProficiencyTier): number {
  const index = PROFICIENCY_TIERS.indexOf(tier);
  return index >= 0 ? index : 0;
}

export interface WeaponData {
  materialId: string | null;
  mods: CharacterItemMod[];
}

export function createEmptyWeapon(): WeaponData {
  return { materialId: null, mods: [] };
}

export interface AccessoryData {
  mods: CharacterItemMod[];
}

export type AccessoryLoadout = Record<AccessoryItem, AccessoryData>;

export interface CharacterItemSaveData {
  armorSlots: ArmorSlotLoadout;
  accessories: AccessoryLoadout;
}

export interface ComputedCharacterTotals extends Record<ModifiableStatKey, number> {
  /** Sum of damage reduction % from all armor pieces. */
  armor_damage_reduction: number;
}

export function createEmptyArmorPieceData(): ArmorPieceData {
  return { ...createEmptyPieceMitigation(), mods: [] };
}

export function createEmptyArmorSlots(): ArmorSlotLoadout {
  return ARMOR_PIECES.reduce((loadout, piece) => {
    loadout[piece] = createEmptyArmorPieceData();
    return loadout;
  }, {} as ArmorSlotLoadout);
}

export function createEmptyAccessoryData(): AccessoryData {
  return { mods: [] };
}

export function createEmptyAccessories(): AccessoryLoadout {
  return {
    [RING_ITEM]: createEmptyAccessoryData(),
    [AMULET_ITEM]: createEmptyAccessoryData(),
  };
}

export function createEmptyCharacterItems(): CharacterItemSaveData {
  return {
    armorSlots: createEmptyArmorSlots(),
    accessories: createEmptyAccessories(),
  };
}

export function createEmptyStats(): CharacterStats {
  return {
    str: 10,
    con: 10,
    dex: 10,
    int: 10,
    wis: 10,
    cha: 10,
    thac0: 20,
    ac: 10,
    hp: 1,
    mana: 0,
    damage_reduction: 0,
    magic_resistance: 0,
  };
}

function isModifiableStatKey(value: string): value is ModifiableStatKey {
  return MODIFIABLE_STAT_DEFINITIONS.some((d) => d.key === value);
}

function normalizeMods(raw: unknown): CharacterItemMod[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (mod): mod is CharacterItemMod =>
        !!mod &&
        typeof mod.id === "string" &&
        isModifiableStatKey(mod.stat) &&
        typeof mod.value === "number" &&
        Number.isFinite(mod.value)
    )
    .map((mod) => ({
      id: mod.id,
      stat: mod.stat,
      value: mod.value,
    }));
}

function normalizeEquipmentMods(raw: unknown): CharacterItemMod[] {
  return normalizeMods(raw).filter(
    (mod) => !ARMOR_MITIGATION_DEFINITIONS.some((d) => d.key === mod.stat)
  );
}

function normalizeArmorPieceMods(raw: unknown): CharacterItemMod[] {
  return normalizeEquipmentMods(raw);
}

function normalizeArmorPieceData(raw: unknown): ArmorPieceData {
  const empty = createEmptyArmorPieceData();
  if (!raw || typeof raw !== "object") return empty;

  const record = raw as Record<string, unknown>;
  for (const { key } of ARMOR_MITIGATION_DEFINITIONS) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      empty[key] = value;
    }
  }
  empty.mods = normalizeArmorPieceMods(record.mods);
  return empty;
}

export function normalizeArmorSlots(
  slots?: Partial<Record<ArmorPiece, unknown>>
): ArmorSlotLoadout {
  const empty = createEmptyArmorSlots();
  if (!slots) return empty;

  for (const piece of ARMOR_PIECES) {
    const raw = slots[piece];
    if (raw) empty[piece] = normalizeArmorPieceData(raw);
  }
  return empty;
}

export function normalizeAccessories(
  accessories?: Partial<Record<AccessoryItem, Partial<AccessoryData>>>
): AccessoryLoadout {
  const empty = createEmptyAccessories();
  if (!accessories) return empty;

  for (const item of ACCESSORY_ITEMS) {
    const raw = accessories[item];
    if (raw) empty[item].mods = normalizeMods(raw.mods);
  }
  return empty;
}

/** Migrates legacy unified `armorPieces` loadouts (all slots shared one shape). */
export function normalizeLegacyItemLoadout(
  loadout?: Record<string, unknown>
): CharacterItemSaveData {
  const result = createEmptyCharacterItems();
  if (!loadout) return result;

  for (const piece of ARMOR_PIECES) {
    const raw = loadout[piece];
    if (raw) result.armorSlots[piece] = normalizeArmorPieceData(raw);
  }

  for (const item of ACCESSORY_ITEMS) {
    const raw = loadout[item];
    if (raw && typeof raw === "object") {
      result.accessories[item].mods = normalizeMods(
        (raw as Record<string, unknown>).mods
      );
    }
  }

  return result;
}

export function normalizeWeapon(raw?: Partial<WeaponData>): WeaponData {
  const empty = createEmptyWeapon();
  if (!raw) return empty;
  if (typeof raw.materialId === "string" && raw.materialId.trim()) {
    empty.materialId = raw.materialId.trim();
  }
  empty.mods = normalizeEquipmentMods(raw.mods);
  return empty;
}

export function normalizeProficiency(raw?: unknown): ProficiencyTier {
  if (
    typeof raw === "string" &&
    PROFICIENCY_TIERS.includes(raw as ProficiencyTier)
  ) {
    return raw as ProficiencyTier;
  }
  return "none";
}

export function normalizeCharacterItems(
  data?: Partial<CharacterItemSaveData> & {
    armorPieces?: Record<string, unknown>;
  }
): CharacterItemSaveData {
  if (data?.armorSlots || data?.accessories) {
    return {
      armorSlots: normalizeArmorSlots(data.armorSlots),
      accessories: normalizeAccessories(data.accessories),
    };
  }
  return normalizeLegacyItemLoadout(data?.armorPieces);
}

export function normalizeBaseStats(
  stats?: Partial<CharacterStats>
): CharacterStats {
  const empty = createEmptyStats();
  if (!stats) return empty;

  for (const { key } of BASE_STAT_DEFINITIONS) {
    const value = stats[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      empty[key] = value;
    }
  }
  return empty;
}

function sumArmorMitigation(
  armor: ArmorSlotLoadout,
  key: ArmorMitigationKey
): number {
  return ARMOR_PIECES.reduce((sum, piece) => sum + armor[piece][key], 0);
}

function maxModAcrossItems(
  armorSlots: ArmorSlotLoadout,
  accessories: AccessoryLoadout,
  weapon: WeaponData,
  stat: ModifiableStatKey
): number {
  let max = 0;
  for (const mod of weapon.mods) {
    if (mod.stat === stat) max = Math.max(max, mod.value);
  }
  for (const piece of ARMOR_PIECES) {
    for (const mod of armorSlots[piece].mods) {
      if (mod.stat === stat) max = Math.max(max, mod.value);
    }
  }
  for (const item of ACCESSORY_ITEMS) {
    for (const mod of accessories[item].mods) {
      if (mod.stat === stat) max = Math.max(max, mod.value);
    }
  }
  return max;
}

function sumModsAcrossItems(
  armorSlots: ArmorSlotLoadout,
  accessories: AccessoryLoadout,
  weapon: WeaponData,
  stat: ModifiableStatKey
): number {
  let sum = weapon.mods
    .filter((mod) => mod.stat === stat)
    .reduce((s, mod) => s + mod.value, 0);
  for (const piece of ARMOR_PIECES) {
    sum += armorSlots[piece].mods
      .filter((mod) => mod.stat === stat)
      .reduce((s, mod) => s + mod.value, 0);
  }
  for (const item of ACCESSORY_ITEMS) {
    sum += accessories[item].mods
      .filter((mod) => mod.stat === stat)
      .reduce((s, mod) => s + mod.value, 0);
  }
  return sum;
}

/** Computes displayed totals from base stats, equipment, and proficiency. */
export function computeCharacterTotals(
  base: CharacterStats,
  armorSlots: ArmorSlotLoadout,
  accessories: AccessoryLoadout,
  weapon: WeaponData,
  proficiency: ProficiencyTier,
  weaponMaterialThac0 = 0
): ComputedCharacterTotals {
  return {
    str: base.str + maxModAcrossItems(armorSlots, accessories, weapon, "str"),
    con: base.con + maxModAcrossItems(armorSlots, accessories, weapon, "con"),
    dex: base.dex + maxModAcrossItems(armorSlots, accessories, weapon, "dex"),
    int: base.int + maxModAcrossItems(armorSlots, accessories, weapon, "int"),
    wis: base.wis + maxModAcrossItems(armorSlots, accessories, weapon, "wis"),
    cha: base.cha + maxModAcrossItems(armorSlots, accessories, weapon, "cha"),
    thac0:
      base.thac0 -
      weaponMaterialThac0 -
      proficiencyThac0Deduction(proficiency) -
      maxModAcrossItems(armorSlots, accessories, weapon, "thac0"),
    ac: base.ac - maxModAcrossItems(armorSlots, accessories, weapon, "ac"),
    hp: base.hp + sumModsAcrossItems(armorSlots, accessories, weapon, "hp"),
    mana: base.mana + sumModsAcrossItems(armorSlots, accessories, weapon, "mana"),
    damage_reduction:
      base.damage_reduction +
      maxModAcrossItems(armorSlots, accessories, weapon, "damage_reduction"),
    armor_damage_reduction: sumArmorMitigation(armorSlots, "damage_reduction"),
    magic_reduction:
      sumArmorMitigation(armorSlots, "magic_reduction") +
      maxModAcrossItems(armorSlots, accessories, weapon, "magic_reduction"),
    rogue_reduction:
      sumArmorMitigation(armorSlots, "rogue_reduction") +
      maxModAcrossItems(armorSlots, accessories, weapon, "rogue_reduction"),
    magic_resistance:
      base.magic_resistance +
      sumArmorMitigation(armorSlots, "magic_resistance") +
      maxModAcrossItems(armorSlots, accessories, weapon, "magic_resistance"),
  };
}

export function isValidPositiveDamageInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return false;
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0;
}

export interface DamageResistanceStep {
  label: string;
  resistancePercent: number;
  roll: number;
  applied: boolean;
  damageBefore: number;
  damageAfter: number;
}

export interface IncomingDamageResult {
  incomingDamage: number;
  steps: [DamageResistanceStep, DamageResistanceStep];
  finalDamage: number;
}

function rollD100(): number {
  return Math.floor(Math.random() * 100) + 1;
}

function reduceDamageByRoll(damage: number, roll: number): number {
  return Math.max(0, damage - roll);
}

/** Rolls d100 for each DR; when roll is at or under resistance %, subtract the roll from damage. */
export function computeIncomingDamage(
  incomingDamage: number,
  damageReductionPercent: number,
  armorDamageReductionPercent: number
): IncomingDamageResult {
  const rollCharacter = rollD100();
  const rollArmor = rollD100();

  const characterApplied =
    damageReductionPercent > 0 && rollCharacter <= damageReductionPercent;
  const afterCharacter = characterApplied
    ? reduceDamageByRoll(incomingDamage, rollCharacter)
    : incomingDamage;

  const armorApplied =
    armorDamageReductionPercent > 0 && rollArmor <= armorDamageReductionPercent;
  const afterArmor = armorApplied
    ? reduceDamageByRoll(afterCharacter, rollArmor)
    : afterCharacter;

  return {
    incomingDamage,
    steps: [
      {
        label: "Damage Reduction",
        resistancePercent: damageReductionPercent,
        roll: rollCharacter,
        applied: characterApplied,
        damageBefore: incomingDamage,
        damageAfter: afterCharacter,
      },
      {
        label: "Armor Damage Reduction",
        resistancePercent: armorDamageReductionPercent,
        roll: rollArmor,
        applied: armorApplied,
        damageBefore: afterCharacter,
        damageAfter: afterArmor,
      },
    ],
    finalDamage: afterArmor,
  };
}
