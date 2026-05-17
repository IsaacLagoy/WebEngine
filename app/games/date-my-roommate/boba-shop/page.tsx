"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BOBA_CUSTOMER_ROSTER, registerBobaCustomers } from "../src/characters";
import { createDailyCustomerRoster } from "../src/game/boba/createDailyCustomerRoster";
import { useGame } from "../src/game-context";
import { isEventScriptId } from "../src/game/eventScripts";
import {
  pathForCurrentScene,
  SCENE_BOBA_SHOP,
  SCENE_STORE,
} from "../src/game/scenePaths";
import OrderTab from "./components/OrderTab";
import DrinkTab from "./components/DrinkTab";
import ToppingsTab from "./components/ToppingsTab";
import MixTab from "./components/MixTab";
import CheckoutTab from "./components/CheckoutTab";
import { RecipeHeader } from "./components/RecipeHeader";

export default function BobaShopPage() {
  const router = useRouter();
  const { game, boba } = useGame();
  const { reset, initCustomerRoster, isDayComplete } = boba;

  const goAfterWork = useCallback(() => {
    const scheduled = game.gameData.scheduledEvent?.eventId;
    if (scheduled && isEventScriptId(scheduled)) {
      game.clearScheduledEvent();
      game.setCurrentScene(scheduled);
      game.saveProgress();
      router.push(pathForCurrentScene(scheduled));
      return;
    }

    game.setCurrentScene(SCENE_STORE);
    game.saveProgress();
    router.push(pathForCurrentScene(SCENE_STORE));
  }, [game, router]);

  useEffect(() => {
    registerBobaCustomers(game);
    game.setCurrentScene(SCENE_BOBA_SHOP);
    initCustomerRoster(createDailyCustomerRoster(BOBA_CUSTOMER_ROSTER));
  }, [game, initCustomerRoster]);

  useEffect(() => {
    return () => reset();
  }, [reset]);

  return (
    <>
      <Tabs defaultValue="order" className="flex h-screen flex-col">
        <RecipeHeader />

        <div className="flex-1 overflow-hidden">
          <TabsContent value="order" forceMount className="h-full m-0 data-[state=inactive]:hidden">
            <OrderTab />
          </TabsContent>

          <TabsContent value="drink" forceMount className="h-full m-0 data-[state=inactive]:hidden">
            <DrinkTab />
          </TabsContent>

          <TabsContent value="toppings" forceMount className="h-full m-0 data-[state=inactive]:hidden">
            <ToppingsTab />
          </TabsContent>

          <TabsContent value="mix-and-lid" forceMount className="h-full m-0 data-[state=inactive]:hidden">
            <MixTab />
          </TabsContent>

          <TabsContent value="checkout" forceMount className="h-full m-0 data-[state=inactive]:hidden">
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

      {isDayComplete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-complete-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.45)",
            fontFamily: "monospace",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "32px 48px",
              textAlign: "center",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h2 id="day-complete-title" style={{ margin: "0 0 8px", fontSize: 24 }}>
              Day complete!
            </h2>
            <p style={{ margin: "0 0 20px", color: "#666" }}>
              Every customer was served and all drinks are out the door.
            </p>
            <button
              type="button"
              onClick={goAfterWork}
              style={{
                padding: "10px 24px",
                fontSize: 14,
                fontFamily: "monospace",
                cursor: "pointer",
                borderRadius: 8,
                border: "1px solid #ccc",
                background: "#f5f5f5",
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </>
  );
}
