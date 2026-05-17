import { getCharacterDefinitions } from "../characters/characterCatalog";

export function eventScriptIdForScriptKey(scriptKey: string): string {
  return `${scriptKey}-date`;
}

export function isEventScriptId(sceneOrScriptId: string): boolean {
  return getCharacterDefinitions().some(
    (d) => eventScriptIdForScriptKey(d.scriptKey) === sceneOrScriptId
  );
}

export function characterNameForEventScript(eventScriptId: string): string | null {
  const def = getCharacterDefinitions().find(
    (d) => eventScriptIdForScriptKey(d.scriptKey) === eventScriptId
  );
  return def?.name ?? null;
}
