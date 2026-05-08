"use client"

import type { Boba } from "../src/types";

export function BobaOrder({ order }: { order: Boba }) {
    return (
        <div className="flex flex-col gap-2 bg-white p-4">
            <h1>Order</h1>
            <div key={order.base.name}>
                <h2>{order.base.name}</h2>
            </div>
            {order.syrup && (
                <div key={order.syrup.name}>
                    <h2>{order.syrup.name}</h2>
                </div>
            )}
            {order.toppings.map((topping) => (
                <div key={topping.name}>
                    <h2>{topping.name}</h2>
                </div>
            ))}
        </div>
    )
}