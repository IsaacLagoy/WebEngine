import type { Boba, Cup } from "./types";

/** Strict match of built cup to a ticketed recipe (for serve validation). */
export function cupMatchesOrder(cup: Cup, boba: Boba): boolean {
  if (!cup.base || cup.base.name !== boba.base.name) return false;
  if ((cup.syrup?.name ?? null) !== (boba.syrup?.name ?? null)) return false;

  const byName = (
    a: { topping: { name: string }; quantity: number },
    b: { topping: { name: string }; quantity: number }
  ) => a.topping.name.localeCompare(b.topping.name);

  const ct = [...cup.toppings].sort(byName);
  const bt = [...boba.toppings].sort(byName);
  if (ct.length !== bt.length) return false;
  for (let i = 0; i < ct.length; i++) {
    if (ct[i].topping.name !== bt[i].topping.name) return false;
    if (ct[i].quantity !== bt[i].quantity) return false;
  }
  return true;
}
