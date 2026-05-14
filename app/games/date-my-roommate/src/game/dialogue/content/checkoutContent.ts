import type { DialogueStep } from "../engine";
import { pickDialogueBranch } from "../branch";
import { textStep } from "../steps";
import type { Character } from "../../../types";
import type { DateMyRoommateGame } from "../../DateMyRoommateGame";

export function buildCheckoutReactionSteps(
  game: DateMyRoommateGame,
  customer: Character,
  score: number
): DialogueStep[] {
  const playerMoney = game.gameData.player.money;

  if (customer.id === "boba_customer_alex") {
    return pickDialogueBranch(
      { score, playerMoney },
      [
        {
          when: (c) => c.score === 0,
          steps: [
            textStep(
              customer,
              "Alex squints at the cup. \"…Did you even read the ticket?\""
            ),
          ],
        },
        {
          when: (c) => c.score < 0.5,
          steps: [
            textStep(
              customer,
              "\"It's the right order, I guess. Could've been better.\""
            ),
          ],
        },
      ],
      [
        textStep(
          customer,
          "\"Okay, that's actually really good. You nailed it.\""
        ),
      ]
    );
  }

  if (customer.id === "boba_customer_jordan") {
    return pickDialogueBranch(
      { score, playerMoney },
      [
        {
          when: (c) => c.score === 0,
          steps: [
            textStep(
              customer,
              "Jordan laughs nervously. \"Wrong drink — but points for trying?\""
            ),
          ],
        },
        {
          when: (c) => c.score < 0.5,
          steps: [
            textStep(
              customer,
              "\"I'll drink it. Don't tell anyone I said that.\""
            ),
          ],
        },
      ],
      [
        textStep(
          customer,
          "\"Yes! This is exactly what I wanted. You're amazing.\""
        ),
      ]
    );
  }

  return pickDialogueBranch(
    { score, playerMoney },
    [
      {
        when: (c) => c.score === 0,
        steps: [
          textStep(
            customer,
            "Um… this isn't what I ordered. I'll come back later."
          ),
        ],
      },
      {
        when: (c) => c.score < 0.4,
        steps: [
          textStep(
            customer,
            "Hmm. Right drink, but something's off. Thanks anyway."
          ),
        ],
      },
      {
        when: (c) => c.score < 0.75,
        steps: [
          textStep(customer, "Not bad — close enough. I'll take it!"),
        ],
      },
    ],
    [textStep(customer, "Wow, that's perfect. Thank you!")]
  );
}
