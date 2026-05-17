import type { DateMyRoommateGame } from "../DateMyRoommateGame";
import { evalCondition } from "./conditions";
import type { DialogueContext } from "./context";
import type { SelectOption } from "./playback";
import type { SelectOptionJson } from "./json/types";

export function buildSelectOptions(
  options: SelectOptionJson[],
  ctx: DialogueContext,
  game: DateMyRoommateGame,
  onQueue: (scriptId: string) => void
): SelectOption[] {
  const out: SelectOption[] = [];

  for (const opt of options) {
    if (opt.when && !evalCondition(opt.when, ctx, game)) continue;

    if (
      opt.unavailableWhen &&
      evalCondition(opt.unavailableWhen, ctx, game)
    ) {
      out.push({
        text: opt.unavailableText ?? opt.text,
        func: () => {},
        disabled: true,
      });
      continue;
    }

    out.push({
      text: opt.text,
      func: () => onQueue(opt.queue),
    });
  }

  return out;
}
