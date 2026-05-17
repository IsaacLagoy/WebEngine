import { resolveCharacterFromGame } from "../../characters/resolveCharacter";
import type { DateMyRoommateGame } from "../DateMyRoommateGame";
import type { DialogueContext } from "./context";
import type { DialogueCondition, NumericCompare } from "./json/types";
import type { Character } from "../../types";

export type NamedConditionFn = (
  ctx: DialogueContext,
  game: DateMyRoommateGame
) => boolean;

const namedConditions = new Map<string, NamedConditionFn>();

export function registerNamedCondition(
  name: string,
  fn: NamedConditionFn
): void {
  namedConditions.set(name, fn);
}

function compareNumeric(actual: number, spec: NumericCompare): boolean {
  if (spec.eq !== undefined && actual !== spec.eq) return false;
  if (spec.lt !== undefined && !(actual < spec.lt)) return false;
  if (spec.lte !== undefined && !(actual <= spec.lte)) return false;
  if (spec.gt !== undefined && !(actual > spec.gt)) return false;
  if (spec.gte !== undefined && !(actual >= spec.gte)) return false;
  return true;
}

export function evalCondition(
  condition: DialogueCondition,
  ctx: DialogueContext,
  game: DateMyRoommateGame
): boolean {
  if ("all" in condition) {
    return condition.all.every((c) => evalCondition(c, ctx, game));
  }
  if ("any" in condition) {
    return condition.any.some((c) => evalCondition(c, ctx, game));
  }
  if ("not" in condition) {
    return !evalCondition(condition.not, ctx, game);
  }
  if ("inventoryHas" in condition) {
    const { ownedGifts } = game.gameData.inventory;
    const qty = ownedGifts[condition.inventoryHas];
    return typeof qty === "number" && qty > 0;
  }
  if ("hasScheduledEvent" in condition) {
    return game.hasScheduledEvent() === condition.hasScheduledEvent;
  }
  if ("scheduledEventId" in condition) {
    return game.gameData.scheduledEvent?.eventId === condition.scheduledEventId;
  }
  if ("disposition" in condition) {
    const ch = resolveConditionCharacter(condition.character, ctx, game);
    if (!ch || ch.disposition === undefined) return false;
    return compareNumeric(ch.disposition, condition.disposition);
  }
  if ("playerMoney" in condition) {
    return compareNumeric(game.gameData.player.money, condition.playerMoney);
  }
  if ("score" in condition) {
    if (ctx.score === undefined) return false;
    return compareNumeric(ctx.score, condition.score);
  }
  if ("flag" in condition) {
    const value = game.getDialogueFlag(condition.flag);
    const expected = condition.equals ?? true;
    return value === expected;
  }
  if ("named" in condition) {
    const fn = namedConditions.get(condition.named);
    if (!fn) {
      console.warn(`Unknown named dialogue condition: ${condition.named}`);
      return false;
    }
    return fn(ctx, game);
  }
  return false;
}

function resolveConditionCharacter(
  name: string | undefined,
  ctx: DialogueContext,
  game: DateMyRoommateGame
): Character | null {
  if (name) {
    return resolveCharacterFromGame(game, name);
  }
  return ctx.customer;
}

export function pickBranchQueue(
  cases: { when: DialogueCondition; queue: string }[],
  defaultQueue: string,
  ctx: DialogueContext,
  game: DateMyRoommateGame
): string {
  for (const c of cases) {
    if (evalCondition(c.when, ctx, game)) return c.queue;
  }
  return defaultQueue;
}
