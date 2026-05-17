import type { DateMyRoommateGame } from "../DateMyRoommateGame";
import { resolveDialogueActionSteps, runDialogueAction } from "./actions";
import { buildSelectOptions } from "./buildSelectOptions";
import { evalCondition, pickBranchQueue } from "./conditions";
import type { DialogueContext } from "./context";
import { getDialogueScript } from "./json/catalog";
import type { JsonDialogueStep } from "./json/types";
import type { DialogueStep } from "./engine";
import { enterStep, exitStep, funcStep, lowerStep, textStep } from "./steps";

export class DialogueResolver {
  constructor(private readonly game: DateMyRoommateGame) {}

  resolve(scriptId: string, ctx: DialogueContext): DialogueStep[] {
    const script = getDialogueScript(scriptId);
    if (!script) {
      throw new Error(`Unknown dialogue script: ${scriptId}`);
    }
    return this.resolveSteps(script.steps, ctx);
  }

  private resolveSteps(
    steps: JsonDialogueStep[],
    ctx: DialogueContext
  ): DialogueStep[] {
    const out: DialogueStep[] = [];
    const { customer } = ctx;

    for (const step of steps) {
      switch (step.kind) {
        case "enter":
          out.push(enterStep(customer, step.side ?? "left"));
          break;
        case "text":
          out.push(textStep(customer, step.text));
          break;
        case "lower":
          out.push(lowerStep(customer));
          break;
        case "exit":
          out.push(exitStep(customer));
          break;
        case "call": {
          const resolved = resolveDialogueActionSteps(
            step.action,
            step.args,
            ctx
          );
          if (resolved) {
            out.push(...resolved);
            break;
          }
          out.push(
            funcStep(() =>
              runDialogueAction(step.action, step.args, ctx, this.game)
            )
          );
          break;
        }
        case "queue":
          out.push(
            funcStep(() => {
              this.game.queueDialogue(step.script, ctx);
            })
          );
          break;
        case "branch":
          out.push(
            funcStep(() => {
              const next = pickBranchQueue(
                step.cases,
                step.default,
                ctx,
                this.game
              );
              this.game.queueDialogue(next, ctx);
            })
          );
          break;
        case "select": {
          if (step.when && !evalCondition(step.when, ctx, this.game)) break;
          const options = buildSelectOptions(
            step.options,
            ctx,
            this.game,
            (scriptId) => this.game.queueDialogue(scriptId, ctx)
          );
          if (options.length === 0) break;
          out.push({
            kind: "select",
            speaker: "yn",
            side: null,
            options,
          });
          break;
        }
        default:
          break;
      }
    }

    return out;
  }
}
