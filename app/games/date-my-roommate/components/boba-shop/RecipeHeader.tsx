"use client";

import { useGame } from "../../src/game-context";

export function RecipeHeader() {
  const { boba } = useGame();
  const { orders, activeRecipeIndex, setActiveRecipeIndex } = boba;

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
      <div
        style={{
          padding: "6px 12px",
          borderBottom: "1px solid #ccc",
          fontFamily: "monospace",
          fontSize: 12,
          color: "#888",
        }}
      >
        No orders yet.
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "4px 12px",
        borderBottom: "1px solid #ccc",
        fontFamily: "monospace",
        fontSize: 12,
        minHeight: 36,
      }}
    >
      <button
        onClick={prev}
        disabled={orders.length <= 1}
        style={{
          background: "none",
          border: "none",
          fontSize: 16,
          padding: "0 4px",
          cursor: orders.length <= 1 ? "default" : "pointer",
          color: orders.length <= 1 ? "#ccc" : "#333",
        }}
      >
        ‹
      </button>

      <span style={{ color: "#888", whiteSpace: "nowrap" }}>
        {safeIndex + 1} / {orders.length}
      </span>

      {ticket && (
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          <strong style={{ color: ticket.customer.nameColor ?? "#333" }}>
            {ticket.customer.name}
          </strong>
          <span style={{ color: "#888", marginLeft: 6, marginRight: 6 }}>·</span>
          <strong>{ticket.boba.base.name}</strong>
          {ticket.boba.syrup && (
            <span style={{ color: "#806030" }}> + {ticket.boba.syrup.name}</span>
          )}
          {ticket.boba.toppings.length > 0 && (
            <span style={{ color: "#555" }}>
              {" | "}
              {ticket.boba.toppings
                .map((e) => `${e.quantity}×${e.topping.name}`)
                .join(", ")}
            </span>
          )}
          <span style={{ color: "#aaa", marginLeft: 8 }}>
            ${ticket.boba.price.toFixed(2)}
          </span>
        </span>
      )}

      <button
        onClick={next}
        disabled={orders.length <= 1}
        style={{
          background: "none",
          border: "none",
          fontSize: 16,
          padding: "0 4px",
          cursor: orders.length <= 1 ? "default" : "pointer",
          color: orders.length <= 1 ? "#ccc" : "#333",
        }}
      >
        ›
      </button>
    </div>
  );
}
