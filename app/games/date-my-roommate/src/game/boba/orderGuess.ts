import type { Boba } from "../../types";

export type OrderGuess = {
  baseName: string;
  syrupName: string | null;
  toppingNames: string[];
};

const SYRUP_NONE = "";

export function parseOrderGuessFormValues(values: Record<string, string>): OrderGuess {
  const syrupRaw = values.syrup?.trim() ?? "";
  const toppingsRaw = values.toppings?.trim() ?? "";
  return {
    baseName: values.base?.trim() ?? "",
    syrupName: syrupRaw === "" || syrupRaw === SYRUP_NONE ? null : syrupRaw,
    toppingNames: toppingsRaw
      ? toppingsRaw
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .sort()
      : [],
  };
}

/** Match base, syrup, and topping names (ignores topping quantities). */
export function orderGuessMatches(guess: OrderGuess, order: Boba): boolean {
  if (guess.baseName !== order.base.name) return false;

  const orderSyrup = order.syrup?.name ?? null;
  if (guess.syrupName !== orderSyrup) return false;

  const orderToppingNames = order.toppings
    .map((e) => e.topping.name)
    .sort();
  if (guess.toppingNames.length !== orderToppingNames.length) return false;
  for (let i = 0; i < guess.toppingNames.length; i++) {
    if (guess.toppingNames[i] !== orderToppingNames[i]) return false;
  }
  return true;
}
