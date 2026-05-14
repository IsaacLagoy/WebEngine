import { Character } from "./types";

const portrait = "/images/isaac/isaac_research.png";

/** Two rotating customers until dedicated assets / JSON exist. */
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
