"use client";

import { useRef, useCallback, useState } from "react";
import type { ItemCallbacks } from "../../components/DraggableItem";
import {
  StationLayout,
  BottomBar,
  TrashZone,
  StorageBay,
  MachineSlot,
} from "../../components/station-shared";
import { useBoba } from "../../src/boba-context";
import { useDialoguePlayback } from "../../src/dialogue-playback-context";
import { buildCheckoutServeScript } from "./checkoutDialogueScript";

export default function CheckoutTab() {
  const {
    checkoutCups,
    trashCheckoutCup,
    orders,
    activeRecipeIndex,
    removeOrderAt,
  } = useBoba();
  const checkoutDialogue = useDialoguePlayback();
  const returnCallbacks = useRef<Map<string, ItemCallbacks>>(new Map());
  const [recipeSlotCupId, setRecipeSlotCupId] = useState<string | null>(null);

  const handleTrashDrop = useCallback(
    (id: string) => {
      trashCheckoutCup(id);
      setRecipeSlotCupId((cur) => (cur === id ? null : cur));
    },
    [trashCheckoutCup]
  );

  const ticket = orders[activeRecipeIndex] ?? null;
  const slotCup = recipeSlotCupId
    ? checkoutCups.find((c) => c.id === recipeSlotCupId) ?? null
    : null;

  const cupsForBay = checkoutCups.filter((c) => c.id !== recipeSlotCupId);

  const handleServe = () => {
    if (!ticket || !slotCup) return;
    const orderIndex = activeRecipeIndex;
    const cupId = slotCup.id;

    checkoutDialogue.resetScene();
    checkoutDialogue.clearScript();
    checkoutDialogue.queueScript(
      buildCheckoutServeScript(ticket.customer, () => {
        removeOrderAt(orderIndex);
        trashCheckoutCup(cupId);
        setRecipeSlotCupId(null);
      })
    );
    checkoutDialogue.advance();
  };

  return (
    <div style={{ height: "100%", minHeight: 0, overflow: "auto" }}>
      <StationLayout
        machinesArea={
          <div
            style={{
              width: "100%",
              minHeight: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              fontFamily: "monospace",
            }}
          >
            {ticket ? (
              <>
                <div
                  style={{
                    fontSize: 12,
                    textAlign: "center",
                    color: "#333",
                    maxWidth: 360,
                  }}
                >
                  <span style={{ color: ticket.customer.nameColor ?? "#333" }}>
                    {ticket.customer.name}
                  </span>
                  {" · "}
                  <strong>{ticket.boba.base.name}</strong>
                  {ticket.boba.syrup && (
                    <span style={{ color: "#806030" }}>
                      {" "}
                      + {ticket.boba.syrup.name}
                    </span>
                  )}
                  {ticket.boba.toppings.length > 0 && (
                    <span style={{ color: "#555" }}>
                      {" "}
                      |{" "}
                      {ticket.boba.toppings
                        .map((e) => `${e.quantity}×${e.topping.name}`)
                        .join(", ")}
                    </span>
                  )}
                </div>
                <MachineSlot
                  slotCup={slotCup}
                  returnCallbacks={returnCallbacks}
                  onDrop={(id) => setRecipeSlotCupId(id)}
                  onRemove={() => setRecipeSlotCupId(null)}
                  label="drop drink here"
                />
                {slotCup && (
                  <button
                    type="button"
                    onClick={handleServe}
                    style={{
                      padding: "8px 16px",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Serve
                  </button>
                )}
              </>
            ) : (
              <div style={{ fontSize: 12, color: "#888", textAlign: "center" }}>
                No ticket selected — add orders on the Order tab.
              </div>
            )}
          </div>
        }

        bottomBar={
          <BottomBar
            left={
              <TrashZone
                returnCallbacks={returnCallbacks}
                onDrop={handleTrashDrop}
              />
            }
            center={
              <StorageBay
                cups={cupsForBay}
                returnCallbacks={returnCallbacks}
                onDrop={() => {}}
                label="ready"
              />
            }
            right={<div />}
          />
        }
      />
    </div>
  );
}
