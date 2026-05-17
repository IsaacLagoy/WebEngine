import type { Boba, Character } from "../../types";

export type DialogueHooks = {
  onAddOrder?: () => void;
  onComplete?: () => void;
  onEventComplete?: () => void;
};

export type DialogueContext = {
  customer: Character;
  boba?: Boba;
  score?: number;
  hooks: DialogueHooks;
};
