"use client"

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"

import { Boba, Drink, Topping, Syrup } from "../src/types";
import { BobaOrder } from "../components/BobaOrder";
import { DRINK_ITEMS, TOPPING_ITEMS, SYRUP_ITEMS } from "../src/types";
import { useState } from "react";

export function BobaShopPage() {

    const [order, setOrder] = useState<Boba[]>([]);
    const [currentOrder, setCurrentOrder] = useState<number>(-1);

    const addRandomOrder = () => {
        const base = DRINK_ITEMS[Math.floor(Math.random() * DRINK_ITEMS.length)];
        const toppings = TOPPING_ITEMS.slice(0, Math.floor(Math.random() * TOPPING_ITEMS.length));
        const syrup = SYRUP_ITEMS[Math.floor(Math.random() * SYRUP_ITEMS.length)];
        addOrder(base, toppings, syrup);
    }

    const orderLeft = () => {
        let newOrder = currentOrder - 1;
        if (newOrder < 0) {
            newOrder = order.length - 1;
        }
        setCurrentOrder(newOrder);
    }

    const orderRight = () => {
        let newOrder = currentOrder + 1;
        if (newOrder >= order.length) {
            newOrder = 0;
        }
        setCurrentOrder(newOrder);
    }

    const addOrder = (base: Drink, toppings: Topping[], syrup: Syrup) => {
        const newOrder = new Boba(base, toppings, syrup);
        setOrder([...order, newOrder]);
        setCurrentOrder(order.length);

        if (order.length === 1) {
            setCurrentOrder(0);
        }
    }

    const removeOrder = (index: number) => {
        const newOrder = order.filter((_, i) => i !== index);
        setOrder(newOrder);
        setCurrentOrder(newOrder.length - 1);
    }

    return (
        <Tabs
            defaultValue="order"
            className="flex h-screen flex-col"
        >
            <div className="flex-1 overflow-hidden">
                {currentOrder >= 0 && order[currentOrder] && (
                    <div className="fixed top-0 right-0 bg-white">
                        <BobaOrder order={order[currentOrder]} />
                        <div className="flex flex-row gap-2">
                            <button onClick={orderLeft}>L</button>
                            <p>{currentOrder + 1} / {order.length}</p>
                            <button onClick={orderRight}>R</button>
                        </div>
                    </div>
                )}
                <TabsContent
                    value="order"
                    className="h-full m-0 bg-pink-200 flex items-center justify-center flex-col"
                >
                    <div className="w-full bg-pink-300">
                        
                        <h1 className="text-4xl font-bold">Order</h1>
                        <button onClick={addRandomOrder}>Add Random Order</button>
                    </div>

                    {/* counter for order */}
                    <div className="w-full bg-pink-400 h-50 absolute bottom-0">

                    </div>
                </TabsContent>

                <TabsContent
                    value="drink"
                    className="h-full m-0 bg-blue-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Drink</h1>
                </TabsContent>

                <TabsContent
                    value="toppings"
                    className="h-full m-0 bg-green-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Toppings</h1>
                </TabsContent>

                <TabsContent
                    value="mix-and-lid"
                    className="h-full m-0 bg-yellow-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Mix & Lid</h1>
                </TabsContent>

                <TabsContent
                    value="checkout"
                    className="h-full m-0 bg-red-200 flex items-center justify-center"
                >
                    <h1 className="text-4xl font-bold">Checkout</h1>   
                </TabsContent>
            </div>

            {/* Footer Navigation */}
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
    )
}

export default BobaShopPage