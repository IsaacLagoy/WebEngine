import type { DateMyRoommateGame } from "./game/DateMyRoommateGame";
import { Character } from "./types";

const portrait = "/images/isaac/isaac_research.png";

export const BOBA_CUSTOMER_ALEX = new Character(
  "boba_customer_alex",
  "Alex",
  portrait,
  50,
  "#90c8ff"
);

export const BOBA_CUSTOMER_JORDAN = new Character(
  "boba_customer_jordan",
  "Jordan",
  portrait,
  55,
  "#c4a8ff"
);

export const BOBA_CUSTOMER_ROSTER: Character[] = [
  BOBA_CUSTOMER_ALEX,
  BOBA_CUSTOMER_JORDAN,
];

export function registerBobaCustomers(game: DateMyRoommateGame): void {
  for (const customer of BOBA_CUSTOMER_ROSTER) {
    game.upsertCharacter(customer);
  }
}
