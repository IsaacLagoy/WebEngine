import type { DateMyRoommateGame } from "../DateMyRoommateGame";
import type { DialogueContext } from "./context";
import { formatCustomerOrder } from "./formatOrder";
import type { DialogueActionArgs } from "./actionArgs";
import { runDialogueAction as runRuntimeAction } from "./actionRegistry";
import type { DialogueStep } from "./engine";
import { textStep } from "./steps";

/** Dialogue emitted at resolve time (must not enqueue during playback). */
export function resolveDialogueActionSteps(
  action: string,
  args: DialogueActionArgs,
  ctx: DialogueContext
): DialogueStep[] | null {
  if (action === "speakCustomerOrder") {
    if (!ctx.boba) return null;
    return [textStep(ctx.customer, formatCustomerOrder(ctx.boba))];
  }
  return null;
}

export function runDialogueAction(
  action: string,
  args: DialogueActionArgs,
  ctx: DialogueContext,
  game: DateMyRoommateGame
): void {
  runRuntimeAction(action, args, ctx, game);
}
