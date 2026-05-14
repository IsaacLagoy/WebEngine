import { Cup } from "../../types";

let _id = 0;

export function nextCupId(): string {
  return `cup_${++_id}`;
}

export function cloneCup(c: Cup): Cup {
  const cup = new Cup(c.id);
  if (c.base) cup.setBase(c.base, c.quality.base);
  if (c.syrup) cup.setSyrup(c.syrup, c.quality.syrup);
  cup.toppings = c.toppings.map((e) => ({
    topping: e.topping,
    quantity: e.quantity,
  }));
  cup.quality.toppings = c.quality.toppings;
  if (c.quality.mix > 0) cup.setMix(c.quality.mix);
  if (c.quality.lid > 0) cup.setLid(c.quality.lid);
  return cup;
}
