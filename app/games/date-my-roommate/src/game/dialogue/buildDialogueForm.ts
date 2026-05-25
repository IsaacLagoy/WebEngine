import { orderGuessMatches, parseOrderGuessFormValues } from "../boba/orderGuess";
import { getGiftCatalog } from "../../items/catalog";
import type { DateMyRoommateGame } from "../DateMyRoommateGame";
import { DRINK_ITEMS, SYRUP_ITEMS, TOPPING_ITEMS } from "../../types";
import type { DialogueForm, DialogueFormField } from "./engine";
import type { DialogueContext } from "./context";
import type { JsonDialogueFormStep, JsonFormField } from "./json/types";

const GIFT_FIELD_NAME = "giftId";
const NONE_VALUE = "";
const ORDER_GUESS_CORRECT_DELTA = 5;
const ORDER_GUESS_WRONG_DELTA = -5;

function buildGiftSelectFields(
  game: DateMyRoommateGame,
  allowNone: boolean,
  noneLabel: string
): DialogueFormField[] {
  const catalog = getGiftCatalog();
  const options: { value: string; label: string }[] = [];

  if (allowNone) {
    options.push({ value: NONE_VALUE, label: noneLabel });
  }

  for (const [itemId, qty] of Object.entries(game.gameData.inventory.ownedGifts)) {
    if (typeof qty !== "number" || qty < 1) continue;
    const row = catalog.find((r) => r.id === itemId);
    const label = row?.name ?? itemId;
    options.push({
      value: itemId,
      label: qty > 1 ? `${label} (×${qty})` : label,
    });
  }

  return [
    {
      type: "select",
      name: GIFT_FIELD_NAME,
      label: "Gift",
      options,
      required: !allowNone,
    },
  ];
}

function buildOrderGuessFields(): DialogueFormField[] {
  return [
    {
      type: "select",
      name: "base",
      label: "Base drink",
      options: DRINK_ITEMS.map((d) => ({ value: d.name, label: d.name })),
      required: true,
    },
    {
      type: "select",
      name: "syrup",
      label: "Syrup (optional)",
      options: [
        { value: NONE_VALUE, label: "None" },
        ...SYRUP_ITEMS.map((s) => ({ value: s.name, label: s.name })),
      ],
    },
    {
      type: "checkboxes",
      name: "toppings",
      label: "Toppings (optional)",
      options: TOPPING_ITEMS.map((t) => ({ value: t.name, label: t.name })),
    },
  ];
}

function resolveFields(
  step: JsonDialogueFormStep,
  game: DateMyRoommateGame
): DialogueFormField[] {
  if (step.form === "gift-select") {
    return buildGiftSelectFields(
      game,
      step.allowNone === true,
      step.noneLabel ?? "No gift"
    );
  }
  if (step.form === "order-guess") {
    return buildOrderGuessFields();
  }
  return (step.fields ?? []).map((field: JsonFormField) => {
    if (field.type === "checkboxes") {
      return {
        type: "checkboxes" as const,
        name: field.name,
        label: field.label,
        options: field.options,
      };
    }
    return {
      type: "select" as const,
      name: field.name,
      label: field.label,
      options: field.options,
      required: field.required,
    };
  });
}

function handleGiftFormSubmit(
  step: JsonDialogueFormStep,
  values: Record<string, string>,
  ctx: DialogueContext,
  game: DateMyRoommateGame,
  onQueue: (scriptId: string) => void
): void {
  const allowNone = step.allowNone === true;
  const giftId = values[GIFT_FIELD_NAME] ?? "";
  const skipped = allowNone && giftId === NONE_VALUE;

  if (skipped) {
    game.setDialogueSession("lastGiftId", "");
    game.setDialogueSession("lastGiftReaction", "");
    if (step.onNoneQueue) onQueue(step.onNoneQueue);
    else if (step.continueQueue) onQueue(step.continueQueue);
    return;
  }

  if (!giftId) return;

  if (!game.tryGiveGift(ctx.customer.id, giftId)) {
    console.warn(`Failed to give gift ${giftId}`);
    if (step.continueQueue) onQueue(step.continueQueue);
    return;
  }

  if (step.onSubmitQueue) onQueue(step.onSubmitQueue);
  else if (step.continueQueue) onQueue(step.continueQueue);
}

function handleOrderGuessFormSubmit(
  step: JsonDialogueFormStep,
  values: Record<string, string>,
  ctx: DialogueContext,
  game: DateMyRoommateGame,
  onQueue: (scriptId: string) => void
): void {
  if (!ctx.boba) {
    console.warn("order-guess form requires ctx.boba");
    if (step.continueQueue) onQueue(step.continueQueue);
    return;
  }

  const guess = parseOrderGuessFormValues(values);
  const correct = orderGuessMatches(guess, ctx.boba);
  game.setDialogueSession("orderGuessCorrect", correct ? "true" : "false");
  game.addDisposition(
    ctx.customer.name,
    correct ? ORDER_GUESS_CORRECT_DELTA : ORDER_GUESS_WRONG_DELTA
  );

  if (step.onSubmitQueue) onQueue(step.onSubmitQueue);
  else if (step.continueQueue) onQueue(step.continueQueue);
}

export function buildDialogueFormStep(
  step: JsonDialogueFormStep,
  ctx: DialogueContext,
  game: DateMyRoommateGame,
  onQueue: (scriptId: string) => void
): DialogueForm | null {
  const fields = resolveFields(step, game);
  if (fields.length === 0) {
    if (step.continueQueue) {
      return {
        kind: "form",
        speaker: "yn",
        side: null,
        title: step.title ?? "",
        fields: [],
        submitLabel: step.submitLabel,
        onSubmit: () => onQueue(step.continueQueue!),
      };
    }
    return null;
  }

  const isOrderGuess = step.form === "order-guess";

  return {
    kind: "form",
    speaker: "yn",
    side: null,
    title: step.title ?? (isOrderGuess ? "Guess their order" : "Choose one"),
    fields,
    submitLabel: step.submitLabel ?? (isOrderGuess ? "Submit guess" : "Continue"),
    onSubmit: (values) => {
      if (step.form === "order-guess") {
        handleOrderGuessFormSubmit(step, values, ctx, game, onQueue);
        return;
      }
      handleGiftFormSubmit(step, values, ctx, game, onQueue);
    },
  };
}
