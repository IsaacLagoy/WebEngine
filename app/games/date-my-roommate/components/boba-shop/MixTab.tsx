"use client";

import { useRef, useState, useCallback } from "react";
import type { ItemCallbacks } from "../../components/DraggableItem";
import {
  MachineSlot, StationLayout, BottomBar,
  TrashZone, SendZone, StorageBay,
} from "../../components/station-shared";
import { useGame } from "../../src/game-context";
import { placeholderQuality } from "../../src/placeholderQuality";
import type { Cup } from "../../src/types";

export default function MixTab() {
  const { boba } = useGame();
  const { mixCups, setMix, setLid, trashMixCup, forwardToCheckout } = boba;
  const returnCallbacks = useRef<Map<string, ItemCallbacks>>(new Map());

  const [mixSlotCupId, setMixSlotCupId] = useState<string | null>(null);
  const [lidSlotCupId, setLidSlotCupId] = useState<string | null>(null);

  const getCup = (id: string | null): Cup | null => id ? (mixCups.find((c) => c.id === id) ?? null) : null;

  const mixSlotCup = getCup(mixSlotCupId);
  const lidSlotCup = getCup(lidSlotCupId);
  const storedCups = mixCups.filter(
    (c) => c.id !== mixSlotCupId && c.id !== lidSlotCupId
  );

  const clearSlotFor = useCallback((cupId: string) => {
    if (cupId === mixSlotCupId) setMixSlotCupId(null);
    if (cupId === lidSlotCupId) setLidSlotCupId(null);
  }, [mixSlotCupId, lidSlotCupId]);

  // TODO: replace this with minigame
  const handleMixSlotDrop = useCallback((id: string) => {
    clearSlotFor(id);
    if (mixSlotCup) setMixSlotCupId(null);
    setMixSlotCupId(id);
  }, [clearSlotFor, mixSlotCup]);

  // TODO: replace this with minigame
  const handleLidSlotDrop = useCallback((id: string) => {
    clearSlotFor(id);
    if (lidSlotCup) setLidSlotCupId(null);
    setLidSlotCupId(id);
  }, [clearSlotFor, lidSlotCup]);

  const handleStorageDrop = useCallback((id: string) => { clearSlotFor(id); }, [clearSlotFor]);
  const handleTrashDrop   = useCallback((id: string) => { clearSlotFor(id); trashMixCup(id); }, [clearSlotFor, trashMixCup]);

  // check if cup can move to next station
  const validateSend = useCallback(
    (id: string): boolean => {
      const cup = mixCups.find((c) => c.id === id);
      return Boolean(cup && cup.quality.mix > 0 && cup.quality.lid > 0);
    },
    [mixCups]
  );

  const handleSendDrop = useCallback(
    (id: string) => {
      if (!validateSend(id)) return;
      clearSlotFor(id);
      forwardToCheckout(id);
    },
    [clearSlotFor, forwardToCheckout, validateSend]
  );

  return (
    <StationLayout
      machinesArea={<>
        <div>
          <p><strong>Mix Machine</strong> (mini-game placeholder)</p>
          <MachineSlot
            slotCup={mixSlotCup}
            returnCallbacks={returnCallbacks}
            onDrop={handleMixSlotDrop}
            onRemove={() => setMixSlotCupId(null)}
          />
          {mixSlotCup && mixSlotCup.quality.mix > 0
            ? <p>✓ mixed</p>
            : <button disabled={!mixSlotCupId} onClick={() => mixSlotCupId && setMix(mixSlotCupId, placeholderQuality())}>Mix</button>
          }
        </div>

        <div>
          <p><strong>Lid Machine</strong> (mini-game placeholder)</p>
          <MachineSlot
            slotCup={lidSlotCup}
            returnCallbacks={returnCallbacks}
            onDrop={handleLidSlotDrop}
            onRemove={() => setLidSlotCupId(null)}
          />
          {lidSlotCup && lidSlotCup.quality.lid > 0
            ? <p>✓ lid on</p>
            : <button disabled={!lidSlotCupId} onClick={() => lidSlotCupId && setLid(lidSlotCupId, placeholderQuality())}>Seal Lid</button>
          }
        </div>
      </>}

      bottomBar={
        <BottomBar
          left={<TrashZone returnCallbacks={returnCallbacks} onDrop={handleTrashDrop} />}
          center={<StorageBay cups={storedCups} returnCallbacks={returnCallbacks} onDrop={handleStorageDrop} label="incoming" />}
          right={
            <SendZone
              label="→ checkout"
              returnCallbacks={returnCallbacks}
              validate={validateSend}
              onDrop={handleSendDrop}
            />
          }
        />
      }
    />
  );
}