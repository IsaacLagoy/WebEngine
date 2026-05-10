"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BobaProvider } from "../src/boba-context";
import DrinkTab    from "../components/boba-shop/DrinkTab";
import ToppingsTab from "../components/boba-shop/ToppingsTab";
import MixTab      from "../components/boba-shop/MixTab";
import CheckoutTab from "../components/boba-shop/CheckoutTab";

export default function BobaShopPage() {
  return (
    <BobaProvider>
      <Tabs defaultValue="drink" className="flex h-screen flex-col">
        <div className="flex-1 overflow-hidden">

          <TabsContent value="order" className="h-full m-0 bg-pink-200 flex items-center justify-center">
            <h1 className="text-4xl font-bold">Order</h1>
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