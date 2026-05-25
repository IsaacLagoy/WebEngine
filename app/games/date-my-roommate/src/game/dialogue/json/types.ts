export type GiftReactionKind = "loved" | "hated" | "tolerated";

export type DialogueCondition =
  | { all: DialogueCondition[] }
  | { any: DialogueCondition[] }
  | { not: DialogueCondition }
  | { inventoryHas: string }
  | { inventoryHasAnyGift: boolean }
  | { hasScheduledEvent: boolean }
  | { scheduledEventId: string }
  | { disposition: NumericCompare; character?: string }
  | { playerMoney: NumericCompare }
  | { score: NumericCompare }
  | { flag: string; equals?: boolean }
  | { named: string }
  | { session: { key: string; equals: string } }
  | { giftGiven: { itemId: string; character?: string } & NumericCompare }
  | { giftPreference: { itemId: string; character?: string; eq: GiftReactionKind } };

export type NumericCompare = {
  eq?: number;
  lt?: number;
  lte?: number;
  gt?: number;
  gte?: number;
};

export type BranchCaseJson = {
  when: DialogueCondition;
  queue: string;
};

export type SelectOptionJson = {
  text: string;
  queue: string;
  when?: DialogueCondition;
  /** When true, show `unavailableText` (or `text`) as a disabled choice. */
  unavailableWhen?: DialogueCondition;
  unavailableText?: string;
};

export type JsonFormField =
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      required?: boolean;
    }
  | {
      type: "checkboxes";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    };

export type JsonDialogueFormPreset = "gift-select" | "order-guess";

export type JsonDialogueFormStep = {
  kind: "form";
  title?: string;
  submitLabel?: string;
  /** Built-in form layout (e.g. gift picker from inventory). */
  form?: JsonDialogueFormPreset;
  fields?: JsonFormField[];
  allowNone?: boolean;
  noneLabel?: string;
  /** Queued when the player picks a gift and submits. */
  onSubmitQueue?: string;
  /** Queued when the player skips (requires `allowNone`). */
  onNoneQueue?: string;
  /** Queued when the player skips, if `onNoneQueue` is omitted. */
  continueQueue?: string;
};

export type JsonDialogueStep =
  | { kind: "enter"; side?: "left" | "right" }
  | { kind: "text"; text: string }
  | { kind: "lower" }
  | { kind: "exit" }
  | { kind: "call"; action: string; args?: Record<string, unknown> }
  | { kind: "queue"; script: string }
  | { kind: "branch"; cases: BranchCaseJson[]; default: string }
  | { kind: "select"; when?: DialogueCondition; options: SelectOptionJson[] }
  | JsonDialogueFormStep;

export interface DialogueScriptJson {
  id: string;
  steps: JsonDialogueStep[];
}
