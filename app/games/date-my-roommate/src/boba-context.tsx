"use client";

/**
 * BobaContext
 *
 * Holds all in-progress cups as they move through the shop stations:
 *   Drink → Toppings → Mix & Lid → Checkout
 *
 * Nothing here is persisted. State resets when the component unmounts.
 *
 * pickUpCup() returns the new cup's id synchronously so callers (e.g. the
 * cup-stack drag handler) can immediately insert the new cup into a slot.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { Cup, Drink, Syrup, Topping, ToppingEntry } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _id = 0;
function nextId(): string {
  return `cup_${++_id}`;
}

function upsertTopping(entries: ToppingEntry[], topping: Topping): ToppingEntry[] {
  const idx = entries.findIndex((e) => e.topping.name === topping.name);
  if (idx >= 0) {
    return entries.map((e, i) =>
      i === idx ? { ...e, quantity: e.quantity + 1 } : e
    );
  }
  return [...entries, { topping, quantity: 1 }];
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface BobaContextValue {
  // --- Drink ---
  drinkCups: Cup[];
  /** Spawns a new empty cup, adds it to drinkCups, returns its id. */
  pickUpCup: () => string;
  setBase: (cupId: string, base: Drink) => void;
  setSyrup: (cupId: string, syrup: Syrup) => void;
  trashCup: (cupId: string) => void;
  forwardToToppings: (cupId: string) => void;

  // --- Toppings ---
  toppingsCups: Cup[];
  addTopping: (cupId: string, topping: Topping) => void;
  removeToppingEntry: (cupId: string, toppingName: string) => void;
  trashToppingsCup: (cupId: string) => void;
  forwardToMix: (cupId: string) => void;

  // --- Mix & Lid ---
  mixCups: Cup[];
  setMix: (cupId: string) => void;
  setLid: (cupId: string) => void;
  trashMixCup: (cupId: string) => void;
  forwardToCheckout: (cupId: string) => void;

  // --- Checkout ---
  checkoutCups: Cup[];
  trashCheckoutCup: (cupId: string) => void;
}

// ---------------------------------------------------------------------------
// Context + provider
// ---------------------------------------------------------------------------

const BobaContext = createContext<BobaContextValue | null>(null);

export function BobaProvider({ children }: { children: ReactNode }) {
  const [drinkCups,    setDrinkCups]    = useState<Cup[]>([]);
  const [toppingsCups, setToppingsCups] = useState<Cup[]>([]);
  const [mixCups,      setMixCups]      = useState<Cup[]>([]);
  const [checkoutCups, setCheckoutCups] = useState<Cup[]>([]);

  // ── Drink ──────────────────────────────────────────────────────────────

  const pickUpCup = useCallback((): string => {
    const id = nextId();
    const cup: Cup = { id, toppings: [] };
    setDrinkCups((prev) => [...prev, cup]);
    return id;
  }, []);

  const updateDrinkCup = useCallback((cupId: string, patch: Partial<Cup>) => {
    setDrinkCups((prev) =>
      prev.map((c) => (c.id === cupId ? { ...c, ...patch } : c))
    );
  }, []);

  const setBase = useCallback(
    (cupId: string, base: Drink) => updateDrinkCup(cupId, { base }),
    [updateDrinkCup]
  );

  const setSyrup = useCallback(
    (cupId: string, syrup: Syrup) => updateDrinkCup(cupId, { syrup }),
    [updateDrinkCup]
  );

  const trashCup = useCallback((cupId: string) => {
    setDrinkCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  const forwardToToppings = useCallback((cupId: string) => {
    let movedCup: Cup | undefined;
    setDrinkCups((prev) => {
      movedCup = prev.find((c) => c.id === cupId);
      return prev.filter((c) => c.id !== cupId);
    });
    if (movedCup) {
      setToppingsCups((prev) => [...prev, movedCup!]);
    }
  }, []);

  // ── Toppings ───────────────────────────────────────────────────────────

  const addTopping = useCallback((cupId: string, topping: Topping) => {
    setToppingsCups((prev) =>
      prev.map((c) =>
        c.id === cupId
          ? { ...c, toppings: upsertTopping(c.toppings, topping) }
          : c
      )
    );
  }, []);

  const removeToppingEntry = useCallback((cupId: string, toppingName: string) => {
    setToppingsCups((prev) =>
      prev.map((c) =>
        c.id === cupId
          ? { ...c, toppings: c.toppings.filter((e) => e.topping.name !== toppingName) }
          : c
      )
    );
  }, []);

  const trashToppingsCup = useCallback((cupId: string) => {
    setToppingsCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  const forwardToMix = useCallback((cupId: string) => {
    let movedCup: Cup | undefined;
    setToppingsCups((prev) => {
      movedCup = prev.find((c) => c.id === cupId);
      return prev.filter((c) => c.id !== cupId);
    });
    if (movedCup) {
      setMixCups((prev) => [...prev, movedCup!]);
    }
  }, []);

  // ── Mix & Lid ──────────────────────────────────────────────────────────

  const updateMixCup = useCallback((cupId: string, patch: Partial<Cup>) => {
    setMixCups((prev) =>
      prev.map((c) => (c.id === cupId ? { ...c, ...patch } : c))
    );
  }, []);

  const setMix = useCallback((cupId: string) => {
    setMixCups((prev) =>
      prev.map((c) =>
        c.id === cupId
          ? { ...c, quality: { ...(c.quality ?? { base: 0, toppings: 0, syrup: 0, lid: 0 }), mix: 1 } }
          : c
      )
    );
  }, []);

  const setLid = useCallback((cupId: string) => {
    setMixCups((prev) =>
      prev.map((c) =>
        c.id === cupId
          ? { ...c, quality: { ...(c.quality ?? { base: 0, toppings: 0, syrup: 0, mix: 0 }), lid: 1 } }
          : c
      )
    );
  }, []);

  const trashMixCup = useCallback((cupId: string) => {
    setMixCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  const forwardToCheckout = useCallback((cupId: string) => {
    let movedCup: Cup | undefined;
    setMixCups((prev) => {
      movedCup = prev.find((c) => c.id === cupId);
      return prev.filter((c) => c.id !== cupId);
    });
    if (movedCup) {
      setCheckoutCups((prev) => [...prev, movedCup!]);
    }
  }, []);

  // ── Checkout ───────────────────────────────────────────────────────────

  const trashCheckoutCup = useCallback((cupId: string) => {
    setCheckoutCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  return (
    <BobaContext.Provider
      value={{
        drinkCups, pickUpCup, setBase, setSyrup, trashCup, forwardToToppings,
        toppingsCups, addTopping, removeToppingEntry, trashToppingsCup, forwardToMix,
        mixCups, setMix, setLid, trashMixCup, forwardToCheckout,
        checkoutCups, trashCheckoutCup,
      }}
    >
      {children}
    </BobaContext.Provider>
  );
}

export function useBoba(): BobaContextValue {
  const ctx = useContext(BobaContext);
  if (!ctx) throw new Error("useBoba must be used inside <BobaProvider>");
  return ctx;
}