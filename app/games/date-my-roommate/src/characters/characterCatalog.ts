import charactersJson from "../../json/characters.json";
import { Character } from "../types";

export type CharacterDefinition = {
  id: string;
  name: string;
  scriptKey: string;
  imageSrc: string;
  disposition: number;
  nameColor?: string;
  appearanceChance: number;
};

const DEFINITIONS = charactersJson as CharacterDefinition[];

const BY_ID = new Map(DEFINITIONS.map((d) => [d.id, d]));
const BY_NAME_LOWER = new Map(
  DEFINITIONS.map((d) => [d.name.trim().toLowerCase(), d])
);

export function getCharacterDefinitions(): CharacterDefinition[] {
  return DEFINITIONS.map((d) => ({ ...d }));
}

export function getCharacterDefinitionById(id: string): CharacterDefinition | undefined {
  return BY_ID.get(id);
}

export function getCharacterDefinitionByName(name: string): CharacterDefinition | undefined {
  return BY_NAME_LOWER.get(name.trim().toLowerCase());
}

export function resolveCharacterDefinition(nameOrId: string): CharacterDefinition | undefined {
  return getCharacterDefinitionById(nameOrId) ?? getCharacterDefinitionByName(nameOrId);
}

export type PersistedCharacterFields = {
  id?: string;
  name?: string;
  imageSrc?: string;
  disposition?: number;
  nameColor?: string;
  appearanceChance?: number;
};

export function characterFromDefinition(
  def: CharacterDefinition,
  overrides?: PersistedCharacterFields | null
): Character {
  return new Character(
    def.id,
    overrides?.name ?? def.name,
    overrides?.imageSrc ?? def.imageSrc,
    overrides?.disposition ?? def.disposition,
    overrides?.nameColor ?? def.nameColor,
    overrides?.appearanceChance ?? def.appearanceChance
  );
}

export function mergePersistedCharacter(
  def: CharacterDefinition,
  saved: unknown
): Character {
  if (!saved || typeof saved !== "object") {
    return characterFromDefinition(def);
  }
  return characterFromDefinition(def, saved as PersistedCharacterFields);
}

export function getBobaCustomerDefinitions(): CharacterDefinition[] {
  return DEFINITIONS.filter((d) => d.id.startsWith("boba_customer_"));
}

export function getBobaCustomerRoster(): Character[] {
  return getBobaCustomerDefinitions().map((d) => characterFromDefinition(d));
}
