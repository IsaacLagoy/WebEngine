import { isEventScriptId } from "./eventScripts";

export const SCENE_APARTMENT = "apartment";
export const SCENE_BOBA_SHOP = "boba-shop";
/** @deprecated Saved games use event script ids (e.g. `alex-date`) as currentScene. */
export const SCENE_EVENT = "event";
export const SCENE_STORE = "store";

const BASE = "/games/date-my-roommate";

export function pathForCurrentScene(scene: string): string {
  if (scene === SCENE_BOBA_SHOP) return `${BASE}/boba-shop`;
  if (scene === SCENE_STORE) return `${BASE}/store`;
  if (scene === SCENE_APARTMENT) return `${BASE}/apartment`;
  if (scene === SCENE_EVENT || isEventScriptId(scene)) return `${BASE}/event`;
  return `${BASE}/apartment`;
}
