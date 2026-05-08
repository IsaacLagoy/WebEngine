/**
 * DemoApp.tsx
 *
 * Wires DraggableItem + DropZone together.
 *
 * Architecture note for "stay" variant visibility:
 *   Each DraggableItem registers two callbacks in `returnCallbacks` (keyed by its id):
 *     - returnHome()    → un-place the item (called by DropZone on eviction)
 *     - setPlaced(bool) → hide/show the source element (called by DropZone on drop)
 *   This keeps both components self-contained with no external state library.
 */

"use client"

import { useRef, useState } from "react";
import DraggableItem, { type ItemCallbacks } from "./components/DraggableItem";
import DropZone from "./components/DropZone";

interface ItemDef {
  id: string;
  name: string;
}

const RETURN_ITEMS: ItemDef[] = [
  { id: "r1", name: "🥕 Carrot" },
  { id: "r2", name: "🧄 Garlic" },
  { id: "r3", name: "🍋 Lemon" },
];

const STAY_ITEMS: ItemDef[] = [
  { id: "s1", name: "🎩 Top Hat" },
  { id: "s2", name: "🕶️ Shades" },
  { id: "s3", name: "🧣 Scarf" },
];

export default function DemoApp() {
  // Shared ref map: id → { returnHome, setPlaced }
  // Pass this to every DraggableItem and DropZone instance.
  const returnCallbacks = useRef<Map<string, ItemCallbacks>>(new Map());
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) =>
    setLog((prev) => [
      `[${new Date().toLocaleTimeString()}] ${msg}`,
      ...prev.slice(0, 6),
    ]);

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: "32px",
        maxWidth: "700px",
        margin: "0 auto",
        color: "#1a3a5c",
      }}
    >
      <h2 style={{ marginBottom: "6px", fontSize: "18px" }}>Drag & Drop Demo</h2>
      <p style={{ fontSize: "12px", color: "#7a9dbf", marginBottom: "32px" }}>
        <strong>Return</strong> items snap back after dropping.{" "}
        <strong>Stay</strong> items move into the zone; dropping a new one evicts the old.
      </p>

      {/* ── Return variant ── */}
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
          Cooking Game (return)
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {RETURN_ITEMS.map((item) => (
              <DraggableItem
                key={item.id}
                id={item.id}
                name={item.name}
                variant="return"
                returnCallbacks={returnCallbacks}
              />
            ))}
          </div>
          <span style={{ color: "#aac4e0", fontSize: "20px" }}>→</span>
          <DropZone
            label="Cooking Pot"
            returnCallbacks={returnCallbacks}
            onDrop={(name) => addLog(`Added ${name} to the pot`)}
          />
        </div>
      </section>

      {/* ── Stay variant ── */}
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
          Cosmetic Equip (stay)
        </h3>
        <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {STAY_ITEMS.map((item) => (
              <DraggableItem
                key={item.id}
                id={item.id}
                name={item.name}
                variant="stay"
                returnCallbacks={returnCallbacks}
              />
            ))}
          </div>
          <span style={{ color: "#aac4e0", fontSize: "20px" }}>→</span>
          <DropZone
            label="Equipped"
            returnCallbacks={returnCallbacks}
            onDrop={(name) => addLog(`Equipped ${name}`)}
            onRemove={(name) => addLog(`Unequipped ${name}`)}
          />
        </div>
      </section>

      {/* ── Event log ── */}
      <div style={{ borderTop: "1px solid #d0e8ff", paddingTop: "16px" }}>
        <div
          style={{
            fontSize: "10px",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "#7a9dbf",
            marginBottom: "8px",
          }}
        >
          Event log
        </div>
        {log.length === 0 && (
          <div style={{ fontSize: "12px", color: "#aac4e0" }}>
            Drag something to see events…
          </div>
        )}
        {log.map((entry, i) => (
          <div key={i} style={{ fontSize: "12px", color: "#4a7090", lineHeight: "1.8" }}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
}