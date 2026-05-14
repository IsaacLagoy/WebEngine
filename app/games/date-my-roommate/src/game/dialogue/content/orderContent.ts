import type { DialogueStep } from "../engine";
import { textStep } from "../steps";
import type { Character } from "../../../types";
import type { DateMyRoommateGame } from "../../DateMyRoommateGame";

export type OrderGreeting = "welcome" | "hey" | "known" | "guess";

export const ORDER_GREETINGS: { id: OrderGreeting; label: string }[] = [
  { id: "welcome", label: "Welcome in." },
  { id: "hey", label: "hey" },
  { id: "known", label: "Oh, it's you." },
  { id: "guess", label: "Let me guess your order..." },
];

const GREETING_LINES: Record<
  string,
  Partial<Record<OrderGreeting, string>>
> = {
  boba_customer_alex: {
    welcome: "\"Appreciate it. I'll try not to make this complicated.\"",
    hey: "\"Hey. Line's not too bad today, right?\"",
    known: "\"Ha. You say that every time I show up.\"",
    guess: "\"Go ahead — last person got it wrong.\"",
  },
  boba_customer_jordan: {
    welcome: "\"Aww, thanks for the welcome!\"",
    hey: "\"Heyyy! Good to see you.\"",
    known: "\"You remembered me! …Kind of, right?\"",
    guess: "\"Ooh, a challenge? I'm ready.\"",
  },
};

const DEFAULT_GREETING_LINES: Record<OrderGreeting, string> = {
  welcome: "Thanks — good to be here.",
  hey: "Hey.",
  known: "Yeah, yeah — you know me.",
  guess: "Oh? Let's see if you can guess.",
};

const WAITING_LINES: Record<string, string> = {
  boba_customer_alex: "\"Cool. I'll wait over there.\"",
  boba_customer_jordan: "\"Yay! I'll be right over there waiting.\"",
};

export function orderWaitingLine(customer: Character): string {
  return WAITING_LINES[customer.id] ?? "Thanks — I'll be waiting.";
}

export function buildGreetingReactionSteps(
  _game: DateMyRoommateGame,
  customer: Character,
  greeting: OrderGreeting
): DialogueStep[] {
  const lines = {
    ...DEFAULT_GREETING_LINES,
    ...GREETING_LINES[customer.id],
  };
  return [textStep(customer, lines[greeting])];
}
