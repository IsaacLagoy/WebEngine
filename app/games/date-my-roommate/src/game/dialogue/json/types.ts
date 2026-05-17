export type DialogueCondition =
  | { all: DialogueCondition[] }
  | { any: DialogueCondition[] }
  | { not: DialogueCondition }
  | { inventoryHas: string }
  | { hasScheduledEvent: boolean }
  | { scheduledEventId: string }
  | { disposition: NumericCompare; character?: string }
  | { playerMoney: NumericCompare }
  | { score: NumericCompare }
  | { flag: string; equals?: boolean }
  | { named: string };

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

export type JsonDialogueStep =
  | { kind: "enter"; side?: "left" | "right" }
  | { kind: "text"; text: string }
  | { kind: "lower" }
  | { kind: "exit" }
  | { kind: "call"; action: string; args?: Record<string, unknown> }
  | { kind: "queue"; script: string }
  | { kind: "branch"; cases: BranchCaseJson[]; default: string }
  | { kind: "select"; when?: DialogueCondition; options: SelectOptionJson[] };

export interface DialogueScriptJson {
  id: string;
  steps: JsonDialogueStep[];
}
