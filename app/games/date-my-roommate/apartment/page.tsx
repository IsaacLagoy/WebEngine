"use client"

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import DraggableItem, { type ItemCallbacks } from "../components/DraggableItem";
import DropZone from "../components/DropZone";
import { useGame } from "../src/game-context";
import { SCENE_APARTMENT, SCENE_BOBA_SHOP } from "../src/game/scenePaths";
import { getCatalogNameById } from "../src/items/catalog";
import type { ClothingSlot } from "../src/types";
import { CLOTHING_SLOTS } from "../src/types";

type SlotPrefix = typeof CLOTHING_SLOTS[number];

function makeValidator(prefix: SlotPrefix) {
    return (id: string, _name: string) => id.startsWith(`${prefix}_`);
}

export default function ApartmentPage() {
  const router = useRouter();
  const returnCallbacks = useRef<Map<string, ItemCallbacks>>(new Map());
  const { game, gameData } = useGame();
  const { player, inventory } = gameData;
  const isReady = Boolean(player.clothing.top && player.clothing.bottom && player.clothing.shoes);

  useEffect(() => {
    game.setCurrentScene(SCENE_APARTMENT);
  }, [game]);
  const getSlotFromId = (id: string): ClothingSlot | null => {
    const [prefix] = id.split("_");
    return CLOTHING_SLOTS.some((slot) => slot === prefix) ? (prefix as ClothingSlot) : null;
  };

  useEffect(() => {
    for (const item of inventory.ownedClothes) {
      const isEquipped = Object.values(player.clothing).some((equipped) => equipped?.id === item.id);
      returnCallbacks.current.get(item.id)?.setPlaced(isEquipped);
    }
  }, [player.clothing, inventory.ownedClothes]);

  const handleBeginDay = () => {
    const clothing = game.player.clothing;
    const ready = Boolean(clothing.top && clothing.bottom && clothing.shoes);
    if (ready) {
      game.setCurrentScene(SCENE_BOBA_SHOP);
      game.saveProgress();
      router.push("/games/date-my-roommate/boba-shop");
      return;
    }

    const missing: string[] = [];
    if (!clothing.top) missing.push("a top");
    if (!clothing.bottom) missing.push("a bottom");
    if (!clothing.shoes) missing.push("shoes");

    // TODO: Add a modal to the UI to show the missing items
    // window.alert(`Oh no! It looks like you forgot ${missing.join(", ")}.`);
  };

  return (
    <div style={{ fontFamily: "monospace", padding: "32px", maxWidth: "700px", margin: "0 auto", color: "#1a3a5c" }}>

      <h2 style={{ marginBottom: "6px", fontSize: "18px" }}>Apartment</h2>
      <button
        type="button"
        onClick={handleBeginDay}
        style={{
          padding: "8px 12px",
          borderRadius: "6px",
          border: "1px solid #aac4e0",
          background: isReady ? "#eaf4ff" : "#fff5f5",
          color: "#1a3a5c",
          cursor: "pointer",
        }}
      >
        Begin Day
      </button>
      <div style={{ marginTop: "6px", fontSize: "12px", color: "#4a7090" }}>
        Money: ${player.money.toFixed(2)}
      </div>

      <hr />

      <section style={{ marginBottom: "36px" }}>
        <h3 style={{ fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#4a90d9", marginBottom: "16px" }}>
          Get Dressed
        </h3>

        {/* Clothing items */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "24px" }}>
          {inventory.ownedClothes.map((item) => (
            <DraggableItem
              key={item.id}
              id={item.id}
              name={item.name}
              variant="stay"
              returnCallbacks={returnCallbacks}
            />
          ))}
        </div>

        {/* Equipment slots */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {CLOTHING_SLOTS.map((prefix) => (
            <DropZone
              key={prefix}
              label={prefix}
              returnCallbacks={returnCallbacks}
              initialPlacedItem={player.clothing[prefix] ?? null}
              validate={makeValidator(prefix)}
              onDrop={(id, name) => {
                const slot = getSlotFromId(id);
                if (slot) { game.setClothing(slot, { id, name }); }
              }}
              onRemove={(id, name) => {
                const slot = getSlotFromId(id);
                if (slot) { game.setClothing(slot, null); }
              }}
            />
          ))}
        </div>
      </section>

      <section style={{ marginBottom: "36px" }}>
        <h3
          style={{
            fontSize: "13px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#4a90d9",
            marginBottom: "16px",
          }}
        >
          Gifts
        </h3>
        {Object.entries(inventory.ownedGifts).filter(([, qty]) => qty > 0).length === 0 ? (
          <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>No gifts in your inventory yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px", color: "#1a3a5c" }}>
            {Object.entries(inventory.ownedGifts)
              .filter(([, qty]) => qty > 0)
              .map(([id, qty]) => (
                <li key={id}>
                  {getCatalogNameById(id)}
                  {qty > 1 ? ` × ${qty}` : ""}
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}