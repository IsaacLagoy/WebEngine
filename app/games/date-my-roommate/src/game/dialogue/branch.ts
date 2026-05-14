import type { DialogueStep } from "./engine";

export type DialogueBranch<T> = {
  when: (ctx: T) => boolean;
  steps: DialogueStep[] | ((ctx: T) => DialogueStep[]);
};

export function pickDialogueBranch<T>(
  ctx: T,
  branches: DialogueBranch<T>[],
  fallback: DialogueStep[] | ((ctx: T) => DialogueStep[])
): DialogueStep[] {
  for (const branch of branches) {
    if (branch.when(ctx)) {
      return typeof branch.steps === "function"
        ? branch.steps(ctx)
        : branch.steps;
    }
  }
  return typeof fallback === "function" ? fallback(ctx) : fallback;
}
