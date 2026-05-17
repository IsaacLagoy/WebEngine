import type { DateMyRoommateGame } from "./game/DateMyRoommateGame";
import {
  getBobaCustomerDefinitions,
  getBobaCustomerRoster,
  mergePersistedCharacter,
} from "./characters/characterCatalog";

export {
  getCharacterDefinitions,
  getCharacterDefinitionById,
  getCharacterDefinitionByName,
  resolveCharacterDefinition,
} from "./characters/characterCatalog";

export { resolveCharacterFromGame, requireCharacterFromGame } from "./characters/resolveCharacter";

export const BOBA_CUSTOMER_ROSTER = getBobaCustomerRoster();

export function registerBobaCustomers(game: DateMyRoommateGame): void {
  for (const def of getBobaCustomerDefinitions()) {
    const saved = game.gameData.characters[def.id];
    game.upsertCharacter(mergePersistedCharacter(def, saved));
  }
}
