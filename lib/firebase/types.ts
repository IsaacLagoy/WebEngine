// ------------------------------------------------------------
// Magic Element Types
// ------------------------------------------------------------

export type MagicElement = {
  id: string;
  name: string;
  weaknessIds: string[];
};

export type MagicElementData = Omit<MagicElement, "id">;

// ------------------------------------------------------------
// Spell Types
// ------------------------------------------------------------

// Targeting variants
type AoeTargeting = { type: "aoe"; range: number };
type SingleTargeting = { type: "single" };
type SelfTargeting = { type: "self" };
type ConeTargeting = { type: "cone"; radius: number };
type ChainTargeting = { type: "chain"; count: number; range: number };

type TargetingData = AoeTargeting | SingleTargeting | SelfTargeting | ConeTargeting | ChainTargeting;

// Core spell type
export interface SpellData {
  name: string;
  description: string;
  cost: number;
  damaging: boolean;
  targeting?: TargetingData; // optional — non-damaging spells may omit it
}

export type Spell = SpellData & { id: string };

// ------------------------------------------------------------
// Skill Types
// ------------------------------------------------------------

export interface SkillData {
  name: string;
  description: string;
  rolls: string[];
}

export type Skill = SkillData & { id: string };

// ------------------------------------------------------------
// Skill Sheet Types
// ------------------------------------------------------------

export interface SkillSheetData {
  name: string;
  skills: Record<string, string[]>; // level → skill names ("0" = starting)
  spells: Record<string, string[]>; // level → spell names
}

export type SkillSheet = SkillSheetData & { id: string };

// ------------------------------------------------------------
// Class Types
// ------------------------------------------------------------

export interface ClassData {
  name: string;
  description: string;
  skill_sheets: string[];
  rules: string | null;
  alignment: string;
  thac0: [number, number]; // [starting, decrease per tier]
  ac: [number, number];    // [starting, decrease per tier]
  health: string;          // e.g. "d8"
  mana: number;
  skills: number;
  hidden: boolean;
}

export type DndClass = ClassData & { id: string };

// ------------------------------------------------------------
// Race Types
// ------------------------------------------------------------

// Add these to lib/firebase.ts alongside your other types

export interface RaceData {
  name: string;
  str: number | null;
  con: number | null;
  dex: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
  skills: string[];
  description: string;
  rules: string | null;
  hidden: boolean;
}

export type Race = RaceData & { id: string };

// ------------------------------------------------------------
// Potion Types
// ------------------------------------------------------------

export type PotionFormField = "level" | "stat" | "element" | "dice";

export interface PotionData {
  name: string;
  description: string;
  base: number;
  linear: number;
  quadratic: number;
  exponential: number;
  form: PotionFormField[];
  iterval: string; // "hour" | "round" — preserving original typo from data
}

export type Potion = PotionData & { id: string };

// ------------------------------------------------------------
// Item Types
// ------------------------------------------------------------

export interface EnchantmentData {
  name: string;
  description: string;
  base: number;
  linear: number;
  exponential: number;
  quadratic?: number;
  form: string[];
  type: "weapon" | "armor";
}
export type Enchantment = EnchantmentData & { id: string };

export interface MaterialData {
  name: string;
  description: string;
  modifier: number;
}
export type Material = MaterialData & { id: string };