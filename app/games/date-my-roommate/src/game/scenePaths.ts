export const SCENE_APARTMENT = "apartment";
export const SCENE_BOBA_SHOP = "boba-shop";
export const SCENE_STORE = "store";

const BASE = "/games/date-my-roommate";

export function pathForCurrentScene(scene: string): string {
  switch (scene) {
    case SCENE_BOBA_SHOP:
      return `${BASE}/boba-shop`;
    case SCENE_STORE:
      return `${BASE}/store`;
    case SCENE_APARTMENT:
    default:
      return `${BASE}/apartment`;
  }
}
