/**
 * CupDisplay
 *
 * Plain text representation of a cup's contents.
 * No visual styling — just shows what's in the cup.
 * 
 * TODO: add graphics for the cup and what's in it
 */

import type { Cup } from "../src/types";

export default function CupDisplay({ cup }: { cup: Cup }) {
  const parts: string[] = [];
  if (cup.base) parts.push(cup.base.name);
  if (cup.syrup) parts.push(`+${cup.syrup.name}`);
  if (cup.toppings.length > 0)
    parts.push(cup.toppings.map((e) => `${e.quantity}×${e.topping.name}`).join(", "));
  if (cup.quality.mix > 0) parts.push("[mixed]");
  if (cup.quality.lid > 0) parts.push("[lid]");

  return (
    <span style={{ fontFamily: "monospace", fontSize: 13 }}>
      {parts.length > 0 ? parts.join(" | ") : "(empty)"}
    </span>
  );
}