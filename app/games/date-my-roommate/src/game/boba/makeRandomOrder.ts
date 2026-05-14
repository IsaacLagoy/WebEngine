import {
  Boba,
  DRINK_ITEMS,
  SYRUP_ITEMS,
  TOPPING_ITEMS,
} from "../../types";

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function makeRandomOrder(): Boba {
  const base = randomFrom(DRINK_ITEMS);
  const syrup = Math.random() > 0.4 ? randomFrom(SYRUP_ITEMS) : undefined;
  const numToppings = Math.floor(Math.random() * (TOPPING_ITEMS.length + 1));
  const shuffled = [...TOPPING_ITEMS].sort(() => Math.random() - 0.5);
  const toppingEntries = shuffled.slice(0, numToppings).map((t) => ({
    topping: t,
    quantity: Math.floor(Math.random() * 2) + 1,
  }));
  return new Boba(base, toppingEntries, syrup);
}
