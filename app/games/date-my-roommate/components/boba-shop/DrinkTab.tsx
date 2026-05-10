"use client";

import { useRef, useState, useCallback } from "react";
import DraggableItem from "../../components/DraggableItem";
import type { ItemCallbacks } from "../../components/DraggableItem";
import {
  STACK_ID, MachineSlot, StationLayout, BottomBar,
  TrashZone, SendZone, StorageBay,
} from "../../components/station-shared";
import { useBoba } from "../../src/boba-context";
import type { Cup } from "../../src/types";
import { DRINK_ITEMS, SYRUP_ITEMS } from "../../src/types";

export default function DrinkTab() {
  const { drinkCups, pickUpCup, setBase, setSyrup, trashCup, forwardToToppings } = useBoba();
  const returnCallbacks = useRef<Map<string, ItemCallbacks>>(new Map());

  const [baseSlotCupId,  setBaseSlotCupId]  = useState<string | null>(null);
  const [syrupSlotCupId, setSyrupSlotCupId] = useState<string | null>(null);
  const [selectedBase,   setSelectedBase]   = useState("");
  const [selectedSyrup,  setSelectedSyrup]  = useState("");

  const getCup = (id: string | null): Cup | null =>
    id ? (drinkCups.find((c) => c.id === id) ?? null) : null;

  const baseSlotCup  = getCup(baseSlotCupId);
  const syrupSlotCup = getCup(syrupSlotCupId);
  const storedCups   = drinkCups.filter(
    (c) => c.id !== baseSlotCupId && c.id !== syrupSlotCupId
  );

  const resolveId = useCallback((id: string): string =>
    id === STACK_ID ? pickUpCup() : id,
  [pickUpCup]);

  const clearSlotFor = useCallback((cupId: string) => {
    if (cupId === baseSlotCupId)  setBaseSlotCupId(null);
    if (cupId === syrupSlotCupId) setSyrupSlotCupId(null);
  }, [baseSlotCupId, syrupSlotCupId]);

  const handleBaseSlotDrop = useCallback((id: string) => {
    const nextId = resolveId(id);
    clearSlotFor(nextId);
    if (baseSlotCup) setBaseSlotCupId(null);
    setBaseSlotCupId(nextId);
  }, [resolveId, clearSlotFor, baseSlotCup]);

  const handleSyrupSlotDrop = useCallback((id: string) => {
    const nextId = resolveId(id);
    clearSlotFor(nextId);
    if (syrupSlotCup) setSyrupSlotCupId(null);
    setSyrupSlotCupId(nextId);
  }, [resolveId, clearSlotFor, syrupSlotCup]);

  const handleStorageDrop = useCallback((id: string) => {
    if (id === STACK_ID) { pickUpCup(); return; }
    clearSlotFor(id);
  }, [pickUpCup, clearSlotFor]);

  const handleTrashDrop = useCallback((id: string) => {
    clearSlotFor(id);
    trashCup(id);
  }, [clearSlotFor, trashCup]);

  const validateSend = useCallback((id: string) =>
    id !== STACK_ID && !!getCup(id)?.base,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [drinkCups]);

  const handleSendDrop = useCallback((id: string) => {
    clearSlotFor(id);
    forwardToToppings(id);
  }, [clearSlotFor, forwardToToppings]);

  const handlePourBase = () => {
    if (!baseSlotCupId || !selectedBase || baseSlotCup?.base) return;
    const drink = DRINK_ITEMS.find((d) => d.name === selectedBase);
    if (drink) setBase(baseSlotCupId, drink);
  };

  const handleAddSyrup = () => {
    if (!syrupSlotCupId || !selectedSyrup || !syrupSlotCup?.base) return;
    const syrup = SYRUP_ITEMS.find((s) => s.name === selectedSyrup);
    if (syrup) setSyrup(syrupSlotCupId, syrup);
  };

  const basePourDisabled  = !baseSlotCupId  || !selectedBase  || !!baseSlotCup?.base;
  const syrupAddDisabled  = !syrupSlotCupId || !selectedSyrup || !syrupSlotCup?.base;

  return (
    <StationLayout
      machinesArea={<>
        <div>
          <p><strong>Base Machine</strong></p>
          <select value={selectedBase} onChange={(e) => setSelectedBase(e.target.value)}>
            <option value="">— select base —</option>
            {DRINK_ITEMS.map((d) => (
              <option key={d.name} value={d.name}>{d.name} ${d.price.toFixed(2)}</option>
            ))}
          </select>
          <MachineSlot
            slotCup={baseSlotCup}
            returnCallbacks={returnCallbacks}
            onDrop={handleBaseSlotDrop}
            onRemove={() => setBaseSlotCupId(null)}
          />
          <button disabled={basePourDisabled} onClick={handlePourBase}>Pour Base</button>
        </div>

        <div>
          <p><strong>Syrup Machine</strong></p>
          <select value={selectedSyrup} onChange={(e) => setSelectedSyrup(e.target.value)}>
            <option value="">— select syrup —</option>
            {SYRUP_ITEMS.map((s) => (
              <option key={s.name} value={s.name}>{s.name} ${s.price.toFixed(2)}</option>
            ))}
          </select>
          <MachineSlot
            slotCup={syrupSlotCup}
            returnCallbacks={returnCallbacks}
            onDrop={handleSyrupSlotDrop}
            onRemove={() => setSyrupSlotCupId(null)}
          />
          {syrupSlotCup && !syrupSlotCup.base && <p>⚠ add a base first</p>}
          <button disabled={syrupAddDisabled} onClick={handleAddSyrup}>Add Syrup</button>
        </div>
      </>}

      bottomBar={
        <BottomBar
          left={<>
            <DraggableItem id={STACK_ID} name="new cup" variant="return" returnCallbacks={returnCallbacks} />
            <TrashZone
              returnCallbacks={returnCallbacks}
              validate={(id) => id !== STACK_ID}
              onDrop={handleTrashDrop}
            />
          </>}
          center={
            <StorageBay
              cups={storedCups}
              returnCallbacks={returnCallbacks}
              onDrop={handleStorageDrop}
            />
          }
          right={
            <SendZone
              label="→ toppings"
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