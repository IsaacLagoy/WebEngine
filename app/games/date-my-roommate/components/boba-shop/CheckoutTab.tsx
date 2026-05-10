"use client";

import { useRef, useCallback } from "react";
import type { ItemCallbacks } from "../../components/DraggableItem";
import { StationLayout, BottomBar, TrashZone, StorageBay } from "../../components/station-shared";
import DropZone from "../../components/DropZone";
import { useBoba } from "../../src/boba-context";

export default function CheckoutTab() {
  const { checkoutCups, trashCheckoutCup } = useBoba();
  const returnCallbacks = useRef<Map<string, ItemCallbacks>>(new Map());

  const handleTrashDrop = useCallback((id: string) => { trashCheckoutCup(id); }, [trashCheckoutCup]);

  return (
    <StationLayout
      machinesArea={
        <div>
          <p><strong>Ready to Serve</strong></p>
          {checkoutCups.length === 0
            ? <p>No drinks yet.</p>
            : checkoutCups.map((cup) => (
              <div key={cup.id} style={{ fontFamily: "monospace", fontSize: 12, marginBottom: 6 }}>
                {cup.base?.name ?? "?"}{cup.syrup ? ` + ${cup.syrup.name}` : ""}
                {cup.toppings.length > 0 && ` | ${cup.toppings.map((e) => `${e.quantity}×${e.topping.name}`).join(", ")}`}
                {` | mix:${cup.quality?.mix ?? 0} lid:${cup.quality?.lid ?? 0}`}
              </div>
            ))
          }
        </div>
      }

      bottomBar={
        <BottomBar
          left={<TrashZone returnCallbacks={returnCallbacks} onDrop={handleTrashDrop} />}
          center={<StorageBay cups={checkoutCups} returnCallbacks={returnCallbacks} onDrop={() => {}} label="completed" />}
          right={
            <DropZone
              label="serve → (todo)"
              returnCallbacks={returnCallbacks}
              validate={() => false}
              onDrop={() => {}}
            />
          }
        />
      }
    />
  );
}