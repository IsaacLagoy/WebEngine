import type { Boba, Character } from "../../../types";
import type { DialogueStep } from "../engine";
import {
  enterStep,
  exitStep,
  funcStep,
  lowerStep,
} from "../steps";
import type { DateMyRoommateGame } from "../../DateMyRoommateGame";
import { buildCheckoutReactionSteps } from "../content/checkoutContent";

export type StartCheckoutParams = {
  customer: Character;
  score: number;
  order: Boba;
  onComplete: () => void;
};

export function buildCheckoutInteraction(
  game: DateMyRoommateGame,
  params: StartCheckoutParams
): DialogueStep[] {
  const { customer, score, onComplete } = params;

  return [
    enterStep(customer),
    ...buildCheckoutReactionSteps(game, customer, score),
    lowerStep(customer),
    exitStep(customer),
    funcStep(onComplete),
  ];
}
