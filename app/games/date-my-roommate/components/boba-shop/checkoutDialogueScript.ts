import type { DialogueStep } from "../../src/dialogueEngine";
import type { Character } from "../../src/types";

/**
 * Customer picks up drink: reaction, then exit, then `onComplete` (remove order + cup).
 * Later: branch on {@link BobaQuality} and disposition.
 */
export function buildCheckoutServeScript(
  customer: Character,
  onComplete: () => void
): DialogueStep[] {
  return [
    {
      kind: "enter",
      speaker: customer,
      side: "left",
      character: customer,
    },
    {
      kind: "text",
      speaker: customer,
      side: null,
      text: "Mmm — that's actually pretty close. Thanks!",
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
    {
      kind: "func",
      speaker: null,
      side: null,
      func: onComplete,
    },
  ];
}
