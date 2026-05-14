import type { Boba, Cup } from "../../types";
import { cupMatchesOrder } from "./match";

export function averageRelevantQuality(cup: Cup, order: Boba): number {
  const parts: number[] = [cup.quality.base, cup.quality.mix, cup.quality.lid];

  if (order.syrup) {
    parts.push(cup.quality.syrup);
  }

  if (order.toppings.length > 0) {
    const totalScoops = cup.toppings.reduce((sum, e) => sum + e.quantity, 0);
    parts.push(totalScoops > 0 ? cup.quality.toppings / totalScoops : 0);
  }

  return parts.reduce((sum, q) => sum + q, 0) / parts.length;
}

export function scoreServedDrink(order: Boba, cup: Cup): number {
  if (!cupMatchesOrder(cup, order)) return 0;
  return averageRelevantQuality(cup, order);
}
