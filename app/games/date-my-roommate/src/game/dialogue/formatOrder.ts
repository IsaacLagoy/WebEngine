import type { Boba } from "../../types";

export function formatCustomerOrder(boba: Boba): string {
  let order = boba.base.name;
  if (boba.syrup) order += ` with ${boba.syrup.name}`;
  if (boba.toppings.length > 0) {
    const tops = boba.toppings
      .map((e) =>
        e.quantity > 1 ? `${e.quantity}×${e.topping.name}` : e.topping.name
      )
      .join(", ");
    order += boba.syrup ? ` and ${tops}` : ` with ${tops}`;
  }
  return `Can I get a ${order}?`;
}
