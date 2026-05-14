"use client";

import { useRef } from "react";
import { useGame } from "../../src/game-context";
import { BOBA_CUSTOMER_ROSTER } from "../../src/characters";
import { makeRandomOrder } from "../../src/game/boba/makeRandomOrder";

export default function OrderTab() {
  const { game, boba } = useGame();
  const { orders, addOrder } = boba;
  const rosterCursor = useRef(0);

  const startCounter = () => {
    const customer =
      BOBA_CUSTOMER_ROSTER[rosterCursor.current % BOBA_CUSTOMER_ROSTER.length];
    rosterCursor.current += 1;

    const boba = makeRandomOrder();
    game.startOrder({
      customer,
      boba,
      onAddOrder: () => addOrder({ boba, customer }),
    });
  };

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 16,
        overflowY: "auto",
        fontFamily: "monospace",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 12,
          borderBottom: "1px solid #eee",
        }}
      >
        <button type="button" onClick={startCounter}>
          Next customer
        </button>
      </div>

      <h2 style={{ marginTop: 0 }}>Orders</h2>
      {orders.length === 0 && <p style={{ color: "#888" }}>No orders yet.</p>}
      {orders.map((ticket, i) => (
        <div
          key={`${ticket.customer.id}-${i}`}
          style={{
            marginBottom: 8,
            padding: "6px 10px",
            border: "1px solid #ccc",
            borderRadius: 6,
          }}
        >
          <strong style={{ color: ticket.customer.nameColor ?? "#333" }}>
            {ticket.customer.name}
          </strong>
          {" — "}#{i + 1} {ticket.boba.base.name}
          {ticket.boba.syrup && <span> + {ticket.boba.syrup.name}</span>}
          {ticket.boba.toppings.length > 0 && (
            <span>
              {" "}
              |{" "}
              {ticket.boba.toppings
                .map((e) => `${e.quantity}×${e.topping.name}`)
                .join(", ")}
            </span>
          )}
          <span style={{ color: "#888", marginLeft: 8 }}>
            ${ticket.boba.price.toFixed(2)}
          </span>
        </div>
      ))}

      <div
        style={{
          paddingTop: 12,
          borderTop: "1px solid #eee",
          marginTop: 8,
        }}
      >
        <button
          type="button"
          onClick={() =>
            addOrder({
              boba: makeRandomOrder(),
              customer:
                BOBA_CUSTOMER_ROSTER[
                  Math.floor(Math.random() * BOBA_CUSTOMER_ROSTER.length)
                ],
            })
          }
        >
          + Add random order (no dialogue)
        </button>
      </div>
    </div>
  );
}
