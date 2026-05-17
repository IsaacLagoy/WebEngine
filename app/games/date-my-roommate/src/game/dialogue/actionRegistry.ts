import { dateEventId } from "../events";
import type { DateMyRoommateGame } from "../DateMyRoommateGame";
import { requireCharacterFromGame } from "../../characters/resolveCharacter";
import type { DialogueContext } from "./context";
import {
  optionalNumber,
  optionalString,
  requireNumber,
  requireString,
  type DialogueActionArgs,
} from "./actionArgs";

export type DialogueActionHandler = (
  args: DialogueActionArgs,
  ctx: DialogueContext,
  game: DateMyRoommateGame
) => void;

function targetCharacterName(
  args: DialogueActionArgs,
  ctx: DialogueContext
): string {
  return (
    optionalString(args, "character") ??
    optionalString(args, "characterName") ??
    ctx.customer.name
  );
}

export const RUNTIME_DIALOGUE_ACTIONS: Record<string, DialogueActionHandler> = {
  "money.add": (args, _ctx, game) => {
    game.addMoney(requireNumber(args, "delta"));
  },

  "money.spend": (args, _ctx, game) => {
    game.trySpendMoney(requireNumber(args, "amount"));
  },

  "disposition.add": (args, ctx, game) => {
    const name = targetCharacterName(args, ctx);
    game.addDisposition(name, requireNumber(args, "amount"));
  },

  "disposition.set": (args, ctx, game) => {
    const name = targetCharacterName(args, ctx);
    game.setDisposition(name, requireNumber(args, "value"));
  },

  "inventory.add": (args, _ctx, game) => {
    const itemId = requireString(args, "itemId");
    const quantity = optionalNumber(args, "quantity") ?? 1;
    game.addInventoryItem(itemId, quantity);
  },

  "inventory.remove": (args, _ctx, game) => {
    const itemId = requireString(args, "itemId");
    const quantity = optionalNumber(args, "quantity") ?? 1;
    game.removeInventoryItem(itemId, quantity);
  },

  "gift.give": (args, ctx, game) => {
    const name = targetCharacterName(args, ctx);
    const itemId = requireString(args, "itemId");
    game.tryGiveGift(name, itemId);
  },

  "event.schedule": (args, ctx, game) => {
    const eventId =
      optionalString(args, "eventId") ??
      dateEventId(
        optionalString(args, "character") ??
          optionalString(args, "characterName") ??
          ctx.customer.name
      );
    game.scheduleEvent(eventId);
  },

  "event.clear": (_args, _ctx, game) => {
    game.clearScheduledEvent();
  },

  "order.add": (_args, ctx) => {
    ctx.hooks.onAddOrder?.();
  },

  "checkout.complete": (_args, ctx) => {
    ctx.hooks.onComplete?.();
  },

  "event.complete": (_args, ctx) => {
    ctx.hooks.onEventComplete?.();
  },

  /** Session flag for branching within one dialogue (cleared when an event starts). */
  "flag.set": (args, _ctx, game) => {
    const key = requireString(args, "key");
    const value = args?.value === false || args?.value === 0 ? false : true;
    game.setDialogueFlag(key, value);
  },

  "flag.clear": (args, _ctx, game) => {
    const key = optionalString(args, "key");
    if (key) game.setDialogueFlag(key, false);
    else game.clearDialogueFlags();
  },
};

export function runDialogueAction(
  action: string,
  args: DialogueActionArgs,
  ctx: DialogueContext,
  game: DateMyRoommateGame
): void {
  const handler = RUNTIME_DIALOGUE_ACTIONS[action];
  if (!handler) {
    throw new Error(`Unknown dialogue action: ${action}`);
  }
  handler(args, ctx, game);
}
