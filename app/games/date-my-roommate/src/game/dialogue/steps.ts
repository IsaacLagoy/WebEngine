import type { Character } from "../../types";
import type { DialogueStep } from "./engine";

export function enterStep(
  character: Character,
  side: "left" | "right" = "left"
): DialogueStep {
  return {
    kind: "enter",
    speaker: character,
    side,
    character,
  };
}

export function textStep(character: Character, text: string): DialogueStep {
  return {
    kind: "text",
    speaker: character,
    side: null,
    text,
  };
}

export function lowerStep(character: Character): DialogueStep {
  return { kind: "lower", speaker: character, side: null };
}

export function exitStep(character: Character): DialogueStep {
  return { kind: "exit", speaker: character, side: null };
}

export function funcStep(fn: () => void): DialogueStep {
  return { kind: "func", speaker: null, side: null, func: fn };
}
