// ------------------------------------------------------------
// Damage dice calculator
// ------------------------------------------------------------
// Dice ordered by variance descending (prioritize high variance)
const DICE = [12, 10, 8, 6, 4] as const;
type Die = (typeof DICE)[number];

/**
 * Given a target average damage, find the single die type and count
 * that best approximates it. Prioritizes high variance dice.
 * The "average" of a die using the half-max method = die / 2.
 * e.g. d12 = 6, d10 = 5, d8 = 4, d6 = 3, d4 = 2
 * Minimum result is always 1d4.
 */
export function computeDamageDice(average: number): { count: number; die: Die } {
  for (const die of DICE) {
    const dieAverage = die / 2;
    const count = Math.round(average / dieAverage);
    if (count >= 1) {
      return { count, die };
    }
  }
  // Floor: average too low for any die — return 1d4
  return { count: 1, die: 4 };
}

/**
 * Computes the damage dice string for a spell given its level and targeting.
 * Returns null if the spell is not damaging or has no valid targeting.
 */
export function computeSpellDamage(
  damaging: boolean,
  targeting: { type: string; range?: number; count?: number; radius?: number } | undefined,
  level: number
): string | null {
  if (!damaging) return null;

  // Level 0 is treated as level 1
  const effectiveLevel = Math.max(level, 1);
  const base = effectiveLevel * 6;

  let average: number;

  switch (targeting?.type) {
    case "single":
      average = base;
      break;
    case "aoe":
      average = base / 3;
      break;
    case "cone":
      average = base / 2;
      break;
    case "chain": {
      const chains = targeting.count ?? 1;
      const divisor = Math.max(chains / 1.5, 1);
      average = base / divisor;
      break;
    }
    default:
      // self or undefined — not a damaging targeting type
      return null;
  }

  const { count, die } = computeDamageDice(average);
  return `${count}d${die}`;
}