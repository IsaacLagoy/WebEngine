"use client";

import { useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registerBobaCustomers } from "../src/characters";
import { useGame } from "../src/game-context";
import OrderTab from "../components/boba-shop/OrderTab";
import DrinkTab from "../components/boba-shop/DrinkTab";
import ToppingsTab from "../components/boba-shop/ToppingsTab";
import MixTab from "../components/boba-shop/MixTab";
import CheckoutTab from "../components/boba-shop/CheckoutTab";
import { RecipeHeader } from "../components/boba-shop/RecipeHeader";

export default function BobaShopPage() {
  const { game, boba } = useGame();
  const resetShift = boba.reset;

  useEffect(() => {
    registerBobaCustomers(game);
    game.setCurrentScene("boba-shop");
  }, [game]);

  useEffect(() => {
    return () => resetShift();
  }, [resetShift]);

  return (
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
  );
}
