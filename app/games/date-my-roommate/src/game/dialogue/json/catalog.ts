import type { DialogueScriptJson } from "./types";

import alexCheckout              from "./scripts/alex/checkout/alex-checkout.json";
import alexCheckoutDateAccept    from "./scripts/alex/checkout/alex-checkout-date-accept.json";
import alexCheckoutEnding        from "./scripts/alex/checkout/alex-checkout-ending.json";
import alexCheckoutEndingSelect  from "./scripts/alex/checkout/alex-checkout-ending-select.json";
import alexCheckoutFarewell      from "./scripts/alex/checkout/alex-checkout-farewell.json";
import alexCheckoutReactionFail  from "./scripts/alex/checkout/alex-checkout-reaction-fail.json";
import alexCheckoutReactionGood  from "./scripts/alex/checkout/alex-checkout-reaction-good.json";
import alexCheckoutReactionMid   from "./scripts/alex/checkout/alex-checkout-reaction-mid.json";
import alexCheckoutScore         from "./scripts/alex/checkout/alex-checkout-score.json";
import alexCheckoutGiftReaction  from "./scripts/alex/checkout/alex-checkout-gift-reaction.json";
import alexCheckoutGiftLoved     from "./scripts/alex/checkout/alex-checkout-gift-loved.json";
import alexCheckoutGiftTolerated from "./scripts/alex/checkout/alex-checkout-gift-tolerated.json";
import alexCheckoutGiftHated     from "./scripts/alex/checkout/alex-checkout-gift-hated.json";
import alexCheckoutGiftForm      from "./scripts/alex/checkout/alex-checkout-gift-form.json";
import alexOrder                 from "./scripts/alex/order/alex-order.json";
import alexOrderGreetingGuess       from "./scripts/alex/order/alex-order-greeting-guess.json";
import alexOrderGuessResult         from "./scripts/alex/order/alex-order-guess-result.json";
import alexOrderGuessCorrect        from "./scripts/alex/order/alex-order-guess-correct.json";
import alexOrderGuessWrong          from "./scripts/alex/order/alex-order-guess-wrong.json";
import alexOrderTailGuessCorrect    from "./scripts/alex/order/alex-order-tail-guess-correct.json";
import alexOrderTailGuessWrong      from "./scripts/alex/order/alex-order-tail-guess-wrong.json";
import alexOrderGreetingHey         from "./scripts/alex/order/alex-order-greeting-hey.json";
import alexOrderGreetingKnown       from "./scripts/alex/order/alex-order-greeting-known.json";
import alexOrderGreetingWelcome     from "./scripts/alex/order/alex-order-greeting-welcome.json";
import alexOrderTail                from "./scripts/alex/order/alex-order-tail.json";

import jordanCheckout              from "./scripts/jordan/checkout/jordan-checkout.json";
import jordanCheckoutDateAccept    from "./scripts/jordan/checkout/jordan-checkout-date-accept.json";
import jordanCheckoutEnding        from "./scripts/jordan/checkout/jordan-checkout-ending.json";
import jordanCheckoutEndingSelect  from "./scripts/jordan/checkout/jordan-checkout-ending-select.json";
import jordanCheckoutFarewell      from "./scripts/jordan/checkout/jordan-checkout-farewell.json";
import jordanCheckoutReactionFail  from "./scripts/jordan/checkout/jordan-checkout-reaction-fail.json";
import jordanCheckoutReactionGood  from "./scripts/jordan/checkout/jordan-checkout-reaction-good.json";
import jordanCheckoutReactionMid   from "./scripts/jordan/checkout/jordan-checkout-reaction-mid.json";
import jordanCheckoutScore         from "./scripts/jordan/checkout/jordan-checkout-score.json";
import jordanCheckoutGiftReaction  from "./scripts/jordan/checkout/jordan-checkout-gift-reaction.json";
import jordanCheckoutGiftLoved     from "./scripts/jordan/checkout/jordan-checkout-gift-loved.json";
import jordanCheckoutGiftTolerated from "./scripts/jordan/checkout/jordan-checkout-gift-tolerated.json";
import jordanCheckoutGiftHated     from "./scripts/jordan/checkout/jordan-checkout-gift-hated.json";
import jordanCheckoutGiftForm      from "./scripts/jordan/checkout/jordan-checkout-gift-form.json";
import jordanOrder                 from "./scripts/jordan/order/jordan-order.json";
import jordanOrderGreetingGuess       from "./scripts/jordan/order/jordan-order-greeting-guess.json";
import jordanOrderGuessResult         from "./scripts/jordan/order/jordan-order-guess-result.json";
import jordanOrderGuessCorrect        from "./scripts/jordan/order/jordan-order-guess-correct.json";
import jordanOrderGuessWrong          from "./scripts/jordan/order/jordan-order-guess-wrong.json";
import jordanOrderTailGuessCorrect    from "./scripts/jordan/order/jordan-order-tail-guess-correct.json";
import jordanOrderTailGuessWrong      from "./scripts/jordan/order/jordan-order-tail-guess-wrong.json";
import jordanOrderGreetingHey         from "./scripts/jordan/order/jordan-order-greeting-hey.json";
import jordanOrderGreetingKnown       from "./scripts/jordan/order/jordan-order-greeting-known.json";
import jordanOrderGreetingWelcome     from "./scripts/jordan/order/jordan-order-greeting-welcome.json";
import jordanOrderTail                from "./scripts/jordan/order/jordan-order-tail.json";

import alexDate             from "./scripts/alex/date/alex-date.json";
import alexDateAnotherDate  from "./scripts/alex/date/alex-date-another-date.json";
import alexDateAnotherNo    from "./scripts/alex/date/alex-date-another-no.json";
import alexDateAnotherYes   from "./scripts/alex/date/alex-date-another-yes.json";
import alexDateEndingSelect from "./scripts/alex/date/alex-date-ending-select.json";
import alexDateFarewell     from "./scripts/alex/date/alex-date-farewell.json";
import alexDateMean         from "./scripts/alex/date/alex-date-mean.json";
import alexDateNice         from "./scripts/alex/date/alex-date-nice.json";
import jordanDate           from "./scripts/jordan/date/jordan-date.json";

function asScript(raw: DialogueScriptJson): DialogueScriptJson {
  return raw;
}

const SCRIPTS: DialogueScriptJson[] = [
  asScript(alexCheckout                as DialogueScriptJson),
  asScript(alexCheckoutDateAccept      as DialogueScriptJson),
  asScript(alexCheckoutEnding          as DialogueScriptJson),
  asScript(alexCheckoutEndingSelect    as DialogueScriptJson),
  asScript(alexCheckoutFarewell        as DialogueScriptJson),
  asScript(alexCheckoutReactionFail    as DialogueScriptJson),
  asScript(alexCheckoutReactionGood    as DialogueScriptJson),
  asScript(alexCheckoutReactionMid     as DialogueScriptJson),
  asScript(alexCheckoutScore           as DialogueScriptJson),
  asScript(alexCheckoutGiftReaction    as DialogueScriptJson),
  asScript(alexCheckoutGiftLoved       as DialogueScriptJson),
  asScript(alexCheckoutGiftTolerated   as DialogueScriptJson),
  asScript(alexCheckoutGiftHated       as DialogueScriptJson),
  asScript(alexCheckoutGiftForm        as DialogueScriptJson),
  asScript(alexOrder                   as DialogueScriptJson),
  asScript(alexOrderGreetingGuess      as DialogueScriptJson),
  asScript(alexOrderGuessResult        as DialogueScriptJson),
  asScript(alexOrderGuessCorrect       as DialogueScriptJson),
  asScript(alexOrderGuessWrong         as DialogueScriptJson),
  asScript(alexOrderTailGuessCorrect   as DialogueScriptJson),
  asScript(alexOrderTailGuessWrong     as DialogueScriptJson),
  asScript(alexOrderGreetingHey        as DialogueScriptJson),
  asScript(alexOrderGreetingKnown      as DialogueScriptJson),
  asScript(alexOrderGreetingWelcome    as DialogueScriptJson),
  asScript(alexOrderTail               as DialogueScriptJson),
  asScript(jordanCheckout              as DialogueScriptJson),
  asScript(jordanCheckoutDateAccept    as DialogueScriptJson),
  asScript(jordanCheckoutEnding        as DialogueScriptJson),
  asScript(jordanCheckoutEndingSelect  as DialogueScriptJson),
  asScript(jordanCheckoutFarewell      as DialogueScriptJson),
  asScript(jordanCheckoutReactionFail  as DialogueScriptJson),
  asScript(jordanCheckoutReactionGood  as DialogueScriptJson),
  asScript(jordanCheckoutReactionMid   as DialogueScriptJson),
  asScript(jordanCheckoutScore         as DialogueScriptJson),
  asScript(jordanCheckoutGiftReaction  as DialogueScriptJson),
  asScript(jordanCheckoutGiftLoved     as DialogueScriptJson),
  asScript(jordanCheckoutGiftTolerated as DialogueScriptJson),
  asScript(jordanCheckoutGiftHated     as DialogueScriptJson),
  asScript(jordanCheckoutGiftForm      as DialogueScriptJson),
  asScript(jordanOrder                 as DialogueScriptJson),
  asScript(jordanOrderGreetingGuess    as DialogueScriptJson),
  asScript(jordanOrderGuessResult      as DialogueScriptJson),
  asScript(jordanOrderGuessCorrect     as DialogueScriptJson),
  asScript(jordanOrderGuessWrong       as DialogueScriptJson),
  asScript(jordanOrderTailGuessCorrect as DialogueScriptJson),
  asScript(jordanOrderTailGuessWrong   as DialogueScriptJson),
  asScript(jordanOrderGreetingHey      as DialogueScriptJson),
  asScript(jordanOrderGreetingKnown    as DialogueScriptJson),
  asScript(jordanOrderGreetingWelcome  as DialogueScriptJson),
  asScript(jordanOrderTail             as DialogueScriptJson),
  asScript(alexDate                    as DialogueScriptJson),
  asScript(alexDateNice                as DialogueScriptJson),
  asScript(alexDateMean                as DialogueScriptJson),
  asScript(alexDateEndingSelect        as DialogueScriptJson),
  asScript(alexDateAnotherDate         as DialogueScriptJson),
  asScript(alexDateAnotherYes          as DialogueScriptJson),
  asScript(alexDateAnotherNo           as DialogueScriptJson),
  asScript(alexDateFarewell            as DialogueScriptJson),
  asScript(jordanDate                  as DialogueScriptJson),
];

const BY_ID = new Map<string, DialogueScriptJson>(
  SCRIPTS.map((s) => [s.id, s])
);

export function getDialogueScript(id: string): DialogueScriptJson | undefined {
  return BY_ID.get(id);
}
