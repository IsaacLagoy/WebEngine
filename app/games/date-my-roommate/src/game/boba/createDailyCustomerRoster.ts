import type { Character } from "../../types";

/** Builds today's customer queue: one random character, then others by appearance chance. */
export function createDailyCustomerRoster(
  pool: Character[],
  random: () => number = Math.random
): Character[] {
  if (pool.length === 0) return [];

  const roster: Character[] = [];
  const first = pool[Math.floor(random() * pool.length)]!;
  roster.push(first);

  for (const character of pool) {
    if (character.id === first.id) continue;
    if (random() < character.appearanceChance) {
      roster.push(character);
    }
  }

  return roster;
}
