// TODO, change this to json file

import type { DialogueStep } from "../../src/dialogueEngine";
import {
  Boba,
  DRINK_ITEMS,
  SYRUP_ITEMS,
  TOPPING_ITEMS,
  type Character,
  type OrderTicket,
} from "../../src/types";

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

function formatCustomerOrder(boba: Boba): string {
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

/**
 * Counter flow: customer enters → you greet → customer orders →
 * ticket created → thanks → lower → exit.
 */
export function buildOrderCounterScript(
  customer: Character,
  addOrder: (ticket: OrderTicket) => void
): DialogueStep[] {
  const boba = makeRandomOrder();

  return [
    {
      kind: "enter",
      speaker: customer,
      side: "right",
      character: customer,
    },
    {
      kind: "select",
      speaker: customer,
      side: null,
      options: [
        {
          text: "Welcome in.",
          func: () => {},
        },
        {
          text: "hey",
          func: () => {},
        },
        {
          text: "Oh, it's you.",
          func: () => {},
        },
        {
          text: "Let me guess ... (TODO add order guessing game)",
          func: () => {},
        }
      ],
    },
    {
      kind: "text",
      speaker: customer,
      side: "right",
      text: formatCustomerOrder(boba),
    },
    {
      kind: "func",
      speaker: customer,
      side: null,
      func: () => addOrder({ boba, customer }),
    },
    {
      kind: "text",
      speaker: customer,
      side: null,
      text: "Thanks — I'll be waiting.",
    },
    {
      kind: "lower",
      speaker: customer,
      side: null,
    },
    {
      kind: "exit",
      speaker: customer,
      side: null,
    },
  ];
}
