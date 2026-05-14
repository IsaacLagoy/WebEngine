"use client";

/**
 * BobaContext
 *
 * All in-progress cups live here, split into per-station arrays.
 * Nothing is persisted — resets when the provider unmounts.
 *
 * Key correctness rule: never call one setState inside another's updater
 * function. React StrictMode runs updaters twice in dev, which causes
 * double-adds. Instead, every "forward" function reads current state via
 * a ref mirror and issues two independent setState calls.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Cup, type Drink, type OrderTicket, type Syrup, type Topping } from "./types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _id = 0;
function nextId(): string {
  return `cup_${++_id}`;
}

function cloneCup(c: Cup): Cup {
  const cup = new Cup(c.id);
  if (c.base) cup.setBase(c.base, c.quality.base);
  if (c.syrup) cup.setSyrup(c.syrup, c.quality.syrup);
  cup.toppings = c.toppings.map((e) => ({
    topping: e.topping,
    quantity: e.quantity,
  }));
  cup.quality.toppings = c.quality.toppings;
  if (c.quality.mix > 0) cup.setMix(c.quality.mix);
  if (c.quality.lid > 0) cup.setLid(c.quality.lid);
  return cup;
}

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface BobaContextValue {
  drinkCups: Cup[];
  /** Spawns a new empty cup, adds it to drinkCups, returns its id. */
  pickUpCup: () => string;
  setBase: (cupId: string, base: Drink, quality: number) => void;
  setSyrup: (cupId: string, syrup: Syrup, quality: number) => void;
  trashCup: (cupId: string) => void;
  forwardToToppings: (cupId: string) => void;

  toppingsCups: Cup[];
  addTopping: (cupId: string, topping: Topping, quality: number) => void;
  removeToppingEntry: (cupId: string, toppingName: string) => void;
  trashToppingsCup: (cupId: string) => void;
  forwardToMix: (cupId: string) => void;

  mixCups: Cup[];
  setMix: (cupId: string, quality: number) => void;
  setLid: (cupId: string, quality: number) => void;
  trashMixCup: (cupId: string) => void;
  forwardToCheckout: (cupId: string) => void;

  orders: OrderTicket[];
  addOrder: (ticket: OrderTicket) => void;
  removeOrderAt: (index: number) => void;

  /** Which ticket the header / recipe strip is focused on (clamped when orders change). */
  activeRecipeIndex: number;
  setActiveRecipeIndex: Dispatch<SetStateAction<number>>;

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
  const [orders, setOrders] = useState<OrderTicket[]>([]);
  const [activeRecipeIndex, setActiveRecipeIndex] = useState(0);

  // Ref mirrors so callbacks can read current state without being
  // re-created on every render and without nesting setState calls.
  const drinkRef    = useRef(drinkCups);
  const toppingsRef = useRef(toppingsCups);
  const mixRef      = useRef(mixCups);

  useEffect(() => { drinkRef.current    = drinkCups;    }, [drinkCups]);
  useEffect(() => { toppingsRef.current = toppingsCups; }, [toppingsCups]);
  useEffect(() => { mixRef.current      = mixCups;      }, [mixCups]);

  useEffect(() => {
    setActiveRecipeIndex((i) =>
      orders.length === 0 ? 0 : Math.min(i, orders.length - 1)
    );
  }, [orders.length]);

  // ── Drink ──────────────────────────────────────────────────────────────

  const pickUpCup = useCallback((): string => {
    const id = nextId();
    setDrinkCups((prev) => [...prev, new Cup(id)]);
    return id;
  }, []);

  const setBase = useCallback((cupId: string, base: Drink, quality: number) => {
    setDrinkCups((prev) =>
      prev.map((c) => {
        if (c.id !== cupId) return c;
        const cup = cloneCup(c);
        cup.setBase(base, quality);
        return cup;
      })
    );
  }, []);

  const setSyrup = useCallback((cupId: string, syrup: Syrup, quality: number) => {
    setDrinkCups((prev) =>
      prev.map((c) => {
        if (c.id !== cupId) return c;
        const cup = cloneCup(c);
        cup.setSyrup(syrup, quality);
        return cup;
      })
    );
  }, []);

  const trashCup = useCallback((cupId: string) => {
    setDrinkCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  const forwardToToppings = useCallback((cupId: string) => {
    const cup = drinkRef.current.find((c) => c.id === cupId);
    if (!cup) return;
    setDrinkCups((prev) => prev.filter((c) => c.id !== cupId));
    setToppingsCups((prev) =>
      prev.some((c) => c.id === cupId) ? prev : [...prev, cup]
    );
  }, []);

  // ── Toppings ───────────────────────────────────────────────────────────

  const addTopping = useCallback((cupId: string, topping: Topping, quality: number) => {
    setToppingsCups((prev) =>
      prev.map((c) => {
        if (c.id !== cupId) return c;
        const cup = cloneCup(c);
        cup.addTopping(topping, quality);
        return cup;
      })
    );
  }, []);

  const removeToppingEntry = useCallback((cupId: string, toppingName: string) => {
    setToppingsCups((prev) =>
      prev.map((c) => {
        if (c.id !== cupId) return c;
        const cup = cloneCup(c);
        const removed = cup.toppings.find((e) => e.topping.name === toppingName);
        const totalQty = cup.toppings.reduce((sum, e) => sum + e.quantity, 0);
        cup.toppings = cup.toppings.filter((e) => e.topping.name !== toppingName);
        if (removed && totalQty > 0) {
          cup.quality.toppings *= 1 - removed.quantity / totalQty;
        }
        return cup;
      })
    );
  }, []);

  const trashToppingsCup = useCallback((cupId: string) => {
    setToppingsCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  const forwardToMix = useCallback((cupId: string) => {
    const cup = toppingsRef.current.find((c) => c.id === cupId);
    if (!cup) return;
    setToppingsCups((prev) => prev.filter((c) => c.id !== cupId));
    setMixCups((prev) =>
      prev.some((c) => c.id === cupId) ? prev : [...prev, cup]
    );
  }, []);

  // ── Mix & Lid ──────────────────────────────────────────────────────────

  const setMix = useCallback((cupId: string, quality: number) => {
    setMixCups((prev) =>
      prev.map((c) => {
        if (c.id !== cupId) return c;
        const cup = cloneCup(c);
        cup.setMix(quality);
        return cup;
      })
    );
  }, []);

  const setLid = useCallback((cupId: string, quality: number) => {
    setMixCups((prev) =>
      prev.map((c) => {
        if (c.id !== cupId) return c;
        const cup = cloneCup(c);
        cup.setLid(quality);
        return cup;
      })
    );
  }, []);

  const trashMixCup = useCallback((cupId: string) => {
    setMixCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  const forwardToCheckout = useCallback((cupId: string) => {
    const cup = mixRef.current.find((c) => c.id === cupId);
    if (!cup) return;
    setMixCups((prev) => prev.filter((c) => c.id !== cupId));
    setCheckoutCups((prev) =>
      prev.some((c) => c.id === cupId) ? prev : [...prev, cup]
    );
  }, []);

  const addOrder = useCallback((ticket: OrderTicket) => {
    setOrders((prev) => [...prev, ticket]);
  }, []);

  const removeOrderAt = useCallback((index: number) => {
    setOrders((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ── Checkout ───────────────────────────────────────────────────────────

  const trashCheckoutCup = useCallback((cupId: string) => {
    setCheckoutCups((prev) => prev.filter((c) => c.id !== cupId));
  }, []);

  return (
    <BobaContext.Provider value={{
      drinkCups, pickUpCup, setBase, setSyrup, trashCup, forwardToToppings,
      toppingsCups, addTopping, removeToppingEntry, trashToppingsCup, forwardToMix,
      mixCups, setMix, setLid, trashMixCup, forwardToCheckout,
      orders, addOrder, removeOrderAt,
      activeRecipeIndex, setActiveRecipeIndex,
      checkoutCups, trashCheckoutCup,
    }}>
      {children}
    </BobaContext.Provider>
  );
}

export function useBoba(): BobaContextValue {
  const ctx = useContext(BobaContext);
  if (!ctx) throw new Error("useBoba must be used inside <BobaProvider>");
  return ctx;
}