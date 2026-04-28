// ------------------------------------------------------------
// Shared utilities for potions, enchantments, and other
// level/dice/stat/element-driven effects.
// ------------------------------------------------------------

export type FormField = "level" | "stat" | "element" | "dice";

export interface EffectData {
  name: string;
  description: string;
  base: number;
  linear: number;
  exponential: number;
  quadratic?: number;
  form: FormField[];
}

export const STATS = [
  "Strength",
  "Constitution",
  "Dexterity",
  "Wisdom",
  "Intelligence",
  "Charisma",
];

export const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
export type DiceSides = (typeof DICE_SIDES)[number];

/**
 * Computes the price of an effect given a numeric scalar (level or dice EV).
 */
export function computePrice(effect: EffectData, scalar: number): number {
  const exp =
    effect.exponential > 0
      ? effect.base * Math.pow(effect.exponential, scalar)
      : effect.base;
  const quad = effect.quadratic ?? 0;
  return Math.round(exp + effect.linear * scalar + quad * Math.pow(scalar, 2));
}

/**
 * Replaces %c, %s, %e, %d tokens in a description string.
 */
export function fillDescription(
  description: string,
  costFactorToken: string,
  stat: string,
  element: string
): string {
  return description
    .replace(/%c/g, costFactorToken)
    .replace(/%d/g, costFactorToken) // %d is an alias for dice display
    .replace(/%s/g, stat || "___")
    .replace(/%e/g, element || "___");
}

/**
 * Sanitizes form fields — deduplicates and ensures dice takes precedence over level.
 */
export function sanitizeForm(value: unknown): FormField[] {
  if (!Array.isArray(value)) return [];
  const filtered = value.filter(
    (f): f is FormField =>
      f === "level" || f === "stat" || f === "element" || f === "dice"
  );
  const deduped = Array.from(new Set(filtered));
  return deduped.includes("dice") ? deduped.filter((f) => f !== "level") : deduped;
}

/**
 * Parses a positive integer string. Returns null if invalid.
 */
export function parsePositiveInteger(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.floor(parsed);
}

/**
 * Computes the expected value of NdX using a high-dice bias.
 */
export function computeDiceExpectedValue(count: number, sides: number): number {
  const averageDie = (sides + 1) / 2;
  const highDiceBias = sides / (sides - 1);
  return count * averageDie * highDiceBias;
}