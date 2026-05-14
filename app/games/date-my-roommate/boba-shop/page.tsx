"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BobaProvider, useBoba } from "../src/boba-context";
import OrderTab    from "../components/boba-shop/OrderTab";
import DrinkTab    from "../components/boba-shop/DrinkTab";
import ToppingsTab from "../components/boba-shop/ToppingsTab";
import MixTab      from "../components/boba-shop/MixTab";
import CheckoutTab from "../components/boba-shop/CheckoutTab";

// ---------------------------------------------------------------------------
// RecipeHeader — sits above all tabs, shows one order at a time
// ---------------------------------------------------------------------------

// TODO move to own file
function RecipeHeader() {
  const { orders, activeRecipeIndex, setActiveRecipeIndex } = useBoba();

  const safeIndex =
    orders.length === 0 ? 0 : Math.min(activeRecipeIndex, orders.length - 1);
  const ticket = orders[safeIndex] ?? null;

  const prev = () =>
    setActiveRecipeIndex((i) => {
      const idx = Math.min(i, orders.length - 1);
      return (idx - 1 + orders.length) % orders.length;
    });
  const next = () =>
    setActiveRecipeIndex((i) => {
      const idx = Math.min(i, orders.length - 1);
      return (idx + 1) % orders.length;
    });

  if (orders.length === 0) {
    return (
      <div style={{
        padding: "6px 12px",
        borderBottom: "1px solid #ccc",
        fontFamily: "monospace",
        fontSize: 12,
        color: "#888",
      }}>
        No orders yet.
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "4px 12px",
      borderBottom: "1px solid #ccc",
      fontFamily: "monospace",
      fontSize: 12,
      minHeight: 36,
    }}>
      <button
        onClick={prev}
        disabled={orders.length <= 1}
        style={{ background: "none", border: "none", fontSize: 16, padding: "0 4px", cursor: orders.length <= 1 ? "default" : "pointer", color: orders.length <= 1 ? "#ccc" : "#333" }}
      >
        ‹
      </button>

      <span style={{ color: "#888", whiteSpace: "nowrap" }}>
        {safeIndex + 1} / {orders.length}
      </span>

      {ticket && (
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <strong style={{ color: ticket.customer.nameColor ?? "#333" }}>{ticket.customer.name}</strong>
          <span style={{ color: "#888", marginLeft: 6, marginRight: 6 }}>·</span>
          <strong>{ticket.boba.base.name}</strong>
          {ticket.boba.syrup && <span style={{ color: "#806030" }}> + {ticket.boba.syrup.name}</span>}
          {ticket.boba.toppings.length > 0 && (
            <span style={{ color: "#555" }}>
              {" | "}
              {ticket.boba.toppings.map((e) => `${e.quantity}×${e.topping.name}`).join(", ")}
            </span>
          )}
          <span style={{ color: "#aaa", marginLeft: 8 }}>${ticket.boba.price.toFixed(2)}</span>
        </span>
      )}

      <button
        onClick={next}
        disabled={orders.length <= 1}
        style={{ background: "none", border: "none", fontSize: 16, padding: "0 4px", cursor: orders.length <= 1 ? "default" : "pointer", color: orders.length <= 1 ? "#ccc" : "#333" }}
      >
        ›
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BobaShopPage() {
  return (
    <BobaProvider>
      <Tabs defaultValue="order" className="flex h-screen flex-col">

        <RecipeHeader />

        <div className="flex-1 overflow-hidden">
          <TabsContent value="order" className="h-full m-0">
            <OrderTab />
          </TabsContent>

          <TabsContent value="drink" className="h-full m-0">
            <DrinkTab />
          </TabsContent>

          <TabsContent value="toppings" className="h-full m-0">
            <ToppingsTab />
          </TabsContent>

          <TabsContent value="mix-and-lid" className="h-full m-0">
            <MixTab />
          </TabsContent>

          <TabsContent value="checkout" className="h-full m-0">
            <CheckoutTab />
          </TabsContent>
        </div>

        <footer className="bg-white p-2 z-10">
          <TabsList className="grid w-full grid-cols-5 h-14">
            <TabsTrigger value="order">Order</TabsTrigger>
            <TabsTrigger value="drink">Drink</TabsTrigger>
            <TabsTrigger value="toppings">Toppings</TabsTrigger>
            <TabsTrigger value="mix-and-lid">Mix & Lid</TabsTrigger>
            <TabsTrigger value="checkout">Checkout</TabsTrigger>
          </TabsList>
        </footer>
      </Tabs>
    </BobaProvider>
  );
}