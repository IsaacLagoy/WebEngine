import type { Boba } from "../../../types";
import type { DialogueStep } from "../engine";
import {
  enterStep,
  exitStep,
  funcStep,
  lowerStep,
  textStep,
} from "../steps";
import type { DateMyRoommateGame } from "../../DateMyRoommateGame";
import {
  ORDER_GREETINGS,
  buildGreetingReactionSteps,
  orderWaitingLine,
} from "../content/orderContent";

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

export type StartOrderParams = {
  customer: import("../../../types").Character;
  boba: Boba;
  onAddOrder: () => void;
};

export function buildOrderInteraction(
  game: DateMyRoommateGame,
  params: StartOrderParams
): DialogueStep[] {
  const { customer, boba, onAddOrder } = params;

  const tail: DialogueStep[] = [
    textStep(customer, formatCustomerOrder(boba)),
    funcStep(onAddOrder),
    textStep(customer, orderWaitingLine(customer)),
    lowerStep(customer),
    exitStep(customer),
  ];

  return [
    enterStep(customer, "right"),
    {
      kind: "select",
      speaker: "yn",
      side: null,
      options: ORDER_GREETINGS.map((g) => ({
        text: g.label,
        func: () => {
          game.enqueueSteps([
            ...buildGreetingReactionSteps(game, customer, g.id),
            ...tail,
          ]);
        },
      })),
    },
  ];
}
