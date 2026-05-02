// ------------------------------------------------------------
// Damage dice calculator
// ------------------------------------------------------------
// Dice ordered by variance descending.
// d20 is included for high-level, high-variance spells.
const DICE = [20, 12, 10, 8, 6, 4] as const;
type Die = (typeof DICE)[number];
type VariancePreference = "high" | "low";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getLevelTargetDie(level: number, variance: VariancePreference): Die {
  if (variance === "high") {
    if (level >= 13) return 20;
    if (level >= 9) return 12;
    if (level >= 5) return 10;
    if (level >= 3) return 8;
    return 6;
  }

  // Low variance still trends upward with level, but caps at d12.
  if (level >= 11) return 12;
  if (level >= 7) return 10;
  if (level >= 4) return 8;
  return 6;
}

/**
 * Given a target average damage, choose the die type/count that best
 * balances mean closeness and variance preference.
 * The "average" of a die using the half-max method = die / 2.
 * e.g. d12 = 6, d10 = 5, d8 = 4, d6 = 3, d4 = 2
 * Minimum result is always 1d4.
 */
export function computeDamageDice(
  average: number,
  level: number,
  variance: VariancePreference
): { count: number; die: Die } {
  const targetDie = getLevelTargetDie(level, variance);
  const minDie: Die = level > 3 ? 6 : 4;
  const maxDie: Die = variance === "high" ? 20 : 12;
  const dieRange = Math.max(maxDie - minDie, 1);

  let best: { score: number; count: number; die: Die } | null = null;

  for (const die of DICE) {
    if (die > maxDie || die < minDie) continue;

    const dieAverage = die / 2;
    const count = Math.max(1, Math.round(average / dieAverage));
    const candidateAverage = count * dieAverage;
    const meanError = Math.abs(candidateAverage - average) / Math.max(average, 1);

    // Variance proxy: coefficient of variation for sum of dice.
    const perDieVariance = (die * die - 1) / 12;
    const stdDev = Math.sqrt(count * perDieVariance);
    const cv = stdDev / Math.max(candidateAverage, 1);

    // A target CV derived from level target die.
    const targetCount = Math.max(1, Math.round(average / (targetDie / 2)));
    const targetVariance = (targetDie * targetDie - 1) / 12;
    const targetStdDev = Math.sqrt(targetCount * targetVariance);
    const targetAverage = targetCount * (targetDie / 2);
    const baseTargetCv = targetStdDev / Math.max(targetAverage, 1);
    const targetCv =
      variance === "high" ? baseTargetCv * 1.15 : clamp(baseTargetCv * 0.8, 0.15, baseTargetCv);
    const varianceError = Math.abs(cv - targetCv);

    // Higher levels should trend toward larger dice.
    const diePreferenceError = Math.abs(die - targetDie) / dieRange;

    // Keep side count comfortably above multiplier for feel.
    const multiplierPenalty = count >= die ? 0.4 : 0;
    const largeCountPenalty = Math.max(0, count - 6) * 0.05;
    const d4Penalty = level > 3 && die === 4 ? 0.5 : 0;

    const score =
      meanError * 0.6 +
      varianceError * 0.2 +
      diePreferenceError * 0.15 +
      multiplierPenalty +
      largeCountPenalty +
      d4Penalty;

    if (!best || score < best.score) {
      best = { score, count, die };
    }
  }

  if (best) return { count: best.count, die: best.die };

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
  const base = effectiveLevel * 4;

  let average: number;
  let variancePreference: VariancePreference;

  switch (targeting?.type) {
    case "single":
      average = base;
      variancePreference = "high";
      break;
    case "aoe":
      average = base / 3;
      variancePreference = "low";
      break;
    case "cone": {
      const coneRadius = targeting?.radius;
      average =
        coneRadius !== undefined && coneRadius > 5 ? base / 1.75 : base; // reduce variance for smaller cones
      variancePreference = "low";
      break;
    }
    case "chain": {
      average = base / 1.5;
      variancePreference = "high";
      break;
    }
    default:
      // self or undefined — not a damaging targeting type
      return null;
  }

  const { count, die } = computeDamageDice(average, effectiveLevel, variancePreference);
  return `${count}d${die}`;
}