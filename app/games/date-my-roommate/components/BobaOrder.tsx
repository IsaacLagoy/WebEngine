"use client";

import type { Boba } from "../src/types";

export function BobaOrder({ order }: { order: Boba }) {
  return (
    <div className="flex flex-col gap-2 bg-white p-4">
      <h1>Order</h1>
      <div>
        <h2>{order.base.name}</h2>
      </div>
      {order.syrup && (
        <div>
          <h2>{order.syrup.name}</h2>
        </div>
      )}
      {order.toppings.map((entry) => (
        <div key={entry.topping.name}>
          <h2>
            {entry.quantity > 1 ? `${entry.quantity}×` : ""}
            {entry.topping.name}
          </h2>
        </div>
      ))}
    </div>
  );
}
