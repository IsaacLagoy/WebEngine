"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "../src/game-context";
import { pathForCurrentScene, SCENE_APARTMENT, SCENE_STORE } from "../src/game/scenePaths";
import { pickRandomStoreStock, type ShopListingRow } from "../src/items/catalog";

const APARTMENT_PATH = pathForCurrentScene(SCENE_APARTMENT);

export default function StorePage() {
  const router = useRouter();
  const { game, gameData, isLoaded } = useGame();
  const [stock, setStock] = useState<ShopListingRow[]>([]);
  const pickedRef = useRef(false);

  useEffect(() => {
    game.setCurrentScene(SCENE_STORE);
  }, [game]);

  useEffect(() => {
    if (!isLoaded || pickedRef.current) return;
    pickedRef.current = true;
    setStock(pickRandomStoreStock(game.gameData));
  }, [isLoaded, game]);

  const goApartment = useCallback(() => {
    game.setCurrentScene(SCENE_APARTMENT);
    game.saveProgress();
    router.push(APARTMENT_PATH);
  }, [game, router]);

  const buy = useCallback(
    (row: ShopListingRow) => {
      const ok = game.tryPurchaseStoreListing(row);
      if (!ok) return;
      setStock((prev) => prev.filter((r) => r.id !== row.id));
    },
    [game]
  );

  const money = gameData.player.money;

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: "24px",
        maxWidth: "640px",
        margin: "0 auto",
        color: "#1a3a5c",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid #cce0f0",
        }}
      >
        <button
          type="button"
          onClick={goApartment}
          style={{
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid #aac4e0",
            background: "#eaf4ff",
            color: "#1a3a5c",
            cursor: "pointer",
            fontFamily: "monospace",
          }}
        >
          ← Apartment
        </button>
        <div style={{ fontSize: "15px", fontWeight: 600 }}>
          Wallet: <span style={{ color: "#2a7a4a" }}>${money.toFixed(2)}</span>
        </div>
      </header>

      <h1 style={{ margin: "0 0 8px", fontSize: "22px" }}>Store</h1>

      {stock.length === 0 ? (
        <p style={{ color: "#888", fontSize: "14px" }}>Nothing for sale right now.</p>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
          {stock.map((row) => {
            const canAfford = money >= row.price;
            const kind = row.type === "gift" ? "Gift" : "Clothing";
            return (
              <li
                key={row.id}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  padding: "14px 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {kind} · ${row.price.toFixed(2)}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => buy(row)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "1px solid #aac4e0",
                    background: canAfford ? "#fff" : "#f5f5f5",
                    color: canAfford ? "#1a3a5c" : "#aaa",
                    cursor: canAfford ? "pointer" : "not-allowed",
                    fontFamily: "monospace",
                  }}
                >
                  Buy
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
