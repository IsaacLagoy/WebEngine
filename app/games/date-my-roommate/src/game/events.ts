function slugifyEventPart(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Stable id for a character's default after-work date (e.g. `alex-date`). */
export function dateEventId(characterName: string): string {
  return `${slugifyEventPart(characterName)}-date`;
}
