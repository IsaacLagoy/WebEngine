"use client";

import { useRef, useState, useCallback } from "react";
import DraggableItem from "../../components/DraggableItem";
import DropZone from "../../components/DropZone";
import type { ItemCallbacks } from "../../components/DraggableItem";
import {
  CupItem, StationLayout, BottomBar,
  TrashZone, SendZone, StorageBay,
} from "../../components/station-shared";
import { useGame } from "../../src/game-context";
import { placeholderQuality } from "../../src/placeholderQuality";
import { TOPPING_ITEMS } from "../../src/types";

export default function ToppingsTab() {
  const { boba } = useGame();
  const { toppingsCups, addTopping, removeToppingEntry, trashToppingsCup, forwardToMix } = boba;
  const returnCallbacks = useRef<Map<string, ItemCallbacks>>(new Map());
  const [workCupId, setWorkCupId] = useState<string | null>(null);

  const workCup    = workCupId ? (toppingsCups.find((c) => c.id === workCupId) ?? null) : null;
  const storedCups = toppingsCups.filter((c) => c.id !== workCupId);

  const handleWorkCupDrop   = useCallback((id: string) => setWorkCupId(id), []);
  const handleWorkCupRemove = useCallback(() => setWorkCupId(null), []);

  const handleStorageDrop = useCallback((id: string) => {
    if (id === workCupId) setWorkCupId(null);
  }, [workCupId]);

  const handleTrashDrop = useCallback((id: string) => {
    if (id === workCupId) setWorkCupId(null);
    trashToppingsCup(id);
  }, [workCupId, trashToppingsCup]);

  const handleSendDrop = useCallback((id: string) => {
    if (id === workCupId) setWorkCupId(null);
    forwardToMix(id);
  }, [workCupId, forwardToMix]);

  // TODO: replace this with minigame
  const handleToppingDrop = useCallback((id: string) => {
    if (!workCupId) return;
    const topping = TOPPING_ITEMS.find((t) => t.name === id);
    if (topping) addTopping(workCupId, topping, placeholderQuality());
  }, [workCupId, addTopping]);

  return (
    <StationLayout
      machinesArea={
        <div style={{ display: "flex", gap: 32 }}>
          {/* Topping palette */}
          <div>
            <p><strong>Toppings</strong></p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {TOPPING_ITEMS.map((t) => (
                <DraggableItem
                  key={t.name}
                  id={t.name}
                  name={`${t.name} +$${t.price.toFixed(2)}`}
                  variant="return"
                  returnCallbacks={returnCallbacks}
                />
              ))}
            </div>
          </div>

          {/* Work surface */}
          <div>
            <p><strong>Work Surface</strong></p>
            <DropZone
              label={workCup ? "" : "drag cup here"}
              returnCallbacks={returnCallbacks}
              validate={(id) => toppingsCups.some((c) => c.id === id)}
              onDrop={handleWorkCupDrop}
              onRemove={handleWorkCupRemove}
            >
              {workCup && <CupItem cup={workCup} returnCallbacks={returnCallbacks} />}
            </DropZone>

            {workCup && (
              <>
                <DropZone
                  label="drop topping here"
                  returnCallbacks={returnCallbacks}
                  validate={(id) => TOPPING_ITEMS.some((t) => t.name === id)}
                  onDrop={handleToppingDrop}
                />
                {workCup.toppings.length > 0 && (
                  <ul style={{ fontFamily: "monospace", fontSize: 12, margin: "6px 0 0" }}>
                    {workCup.toppings.map((e) => (
                      <li key={e.topping.name}>
                        {e.topping.name} × {e.quantity}{" "}
                        <button onClick={() => removeToppingEntry(workCupId!, e.topping.name)}>
                          remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        </div>
      }

      bottomBar={
        <BottomBar
          left={<TrashZone returnCallbacks={returnCallbacks} onDrop={handleTrashDrop} />}
          center={<StorageBay cups={storedCups} returnCallbacks={returnCallbacks} onDrop={handleStorageDrop} label="incoming" />}
          right={
            <SendZone
              label="→ mix & lid"
              returnCallbacks={returnCallbacks}
              validate={(id) => toppingsCups.some((c) => c.id === id)}
              onDrop={handleSendDrop}
            />
          }
        />
      }
    />
  );
}