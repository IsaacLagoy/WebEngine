/**
 * DraggableItem
 *
 * Props:
 *   id               - Stable unique id for internal drag state tracking.
 *   name             - Identifier passed to the DropZone's onDrop handler.
 *   variant          - "return": snaps back after drop (cooking-game style).
 *                      "stay":   moves into the drop zone (cosmetic-equip style).
 *   returnCallbacks  - Shared ref map: id → { returnHome, setPlaced }.
 *                      Populated on mount so DropZone can control visibility.
 */

import { useState, useRef } from "react";

export interface ItemCallbacks {
  returnHome: () => void;
  setPlaced: (placed: boolean) => void;
}

export type DraggableVariant = "return" | "stay";

export interface DraggableItemProps {
  id: string;
  name: string;
  variant?: DraggableVariant;
  returnCallbacks: React.MutableRefObject<Map<string, ItemCallbacks>>;
}

export interface DragPayload {
  id: string;
  name: string;
  variant: DraggableVariant;
}

export default function DraggableItem({
  id,
  name,
  variant = "return",
  returnCallbacks,
}: DraggableItemProps) {
  const [isPlaced, setIsPlaced] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Register callbacks once so DropZone can control this item's visibility
  const registered = useRef(false);
  if (!registered.current) {
    returnCallbacks.current.set(id, {
      returnHome: () => setIsPlaced(false),
      setPlaced: (val: boolean) => setIsPlaced(val),
    });
    registered.current = true;
  }

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    const payload: DragPayload = { id, name, variant };
    e.dataTransfer.setData("application/x-draggable", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const hidden = variant === "stay" && isPlaced;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 18px",
        borderRadius: "6px",
        border: "2px solid #4a90d9",
        backgroundColor: isDragging ? "#c6e0fa" : "#eaf4ff",
        color: "#1a3a5c",
        fontFamily: "monospace",
        fontSize: "14px",
        fontWeight: 600,
        cursor: hidden ? "default" : "grab",
        userSelect: "none",
        opacity: hidden ? 0 : isDragging ? 0.45 : 1,
        pointerEvents: hidden ? "none" : "auto",
        transition: "opacity 0.2s, background-color 0.15s",
        minWidth: "80px",
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      {name}
    </div>
  );
}