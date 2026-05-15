/**
 * DropZone
 *
 * Props:
 *   label            - Display label for the zone.
 *   onDrop           - Called with (id, name) on a successful drop.
 *   onRemove         - Called with (id, name) when a placed item is dragged out.
 *   validate         - HOF: receives (id, name), return false to reject the drop.
 *                      Rejected items snap back to their origin automatically.
 *   returnCallbacks  - Shared ref map: id → { returnHome, setPlaced }.
 *   initialPlacedItem - Pre-populate a "stay"-variant placed item (clothing equip).
 *   children         - Optional. Extra content rendered inside the zone.
 *   style            - Optional style overrides for the outer zone div.
 *
 * Behaviour:
 *   - "return" variant: onDrop fires; item stays at origin.
 *   - "stay" variant:   item moves into the zone.
 *                       Dragging out removes it (fires onRemove, returns home).
 *                       Dropping a second item evicts the first.
 *                       validate() is checked before any of the above.
 */

import { useState, useCallback, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { ItemCallbacks, DragPayload } from "./DraggableItem";

interface PlacedItem {
  id: string;
  name: string;
}

export interface DropZoneProps {
  label?: string;
  onDrop: (id: string, name: string) => void;
  onRemove?: (id: string, name: string) => void;
  validate?: (id: string, name: string) => boolean;
  returnCallbacks: React.MutableRefObject<Map<string, ItemCallbacks>>;
  initialPlacedItem?: PlacedItem | null;
  children?: ReactNode;
  style?: CSSProperties;
}

export default function DropZone({
  label = "Drop here",
  onDrop,
  onRemove,
  validate,
  returnCallbacks,
  initialPlacedItem = null,
  children,
  style,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [placedItem, setPlacedItem] = useState<PlacedItem | null>(null);
  const droppedElsewhere = useRef(false);

  useEffect(() => {
    setPlacedItem(initialPlacedItem);
  }, [initialPlacedItem?.id, initialPlacedItem?.name]);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsOver(false);

      let payload: DragPayload;
      try {
        payload = JSON.parse(
          e.dataTransfer.getData("application/x-draggable")
        ) as DragPayload;
      } catch {
        return;
      }

      const { id, name, variant } = payload;

      if (validate && !validate(id, name)) {
        setIsRejecting(true);
        setTimeout(() => setIsRejecting(false), 400);
        return;
      }

      onDrop(id, name);

      if (variant === "stay") {
        droppedElsewhere.current = true;

        if (placedItem && placedItem.id !== id) {
          const prev = returnCallbacks.current.get(placedItem.id);
          prev?.returnHome();
          prev?.setPlaced(false);
        }

        setPlacedItem({ id, name });
        returnCallbacks.current.get(id)?.setPlaced(true);
      }
    },
    [onDrop, validate, placedItem, returnCallbacks]
  );

  const handlePlacedDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    if (!placedItem) return;
    droppedElsewhere.current = false;
    const payload: DragPayload = {
      id: placedItem.id,
      name: placedItem.name,
      variant: "stay",
    };
    e.dataTransfer.setData("application/x-draggable", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "move";
  };

  const handlePlacedDragEnd = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      if (e.dataTransfer.dropEffect === "none" && !droppedElsewhere.current) {
        if (!placedItem) return;
        const cb = returnCallbacks.current.get(placedItem.id);
        cb?.returnHome();
        cb?.setPlaced(false);
        onRemove?.(placedItem.id, placedItem.name);
        setPlacedItem(null);
      }
      droppedElsewhere.current = false;
    },
    [placedItem, returnCallbacks, onRemove]
  );

  // Derive border styles without mixing shorthand + longhand
  const borderWidth = "2px";
  const borderStyle = "dashed";
  const borderColor = isRejecting ? "#e05c5c" : isOver ? "#4a90d9" : "#aac4e0";
  const backgroundColor = isRejecting ? "#fff0f0" : isOver ? "#d0e8ff" : "#f5f9ff";

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        minWidth: "150px",
        minHeight: "90px",
        padding: "16px 20px",
        borderRadius: "8px",
        borderWidth,
        borderStyle,
        borderColor,
        backgroundColor,
        transition: "border-color 0.15s, background-color 0.15s",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {label && (
        <span style={{
          fontSize: "10px",
          fontFamily: "monospace",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: isRejecting ? "#e05c5c" : "#7a9dbf",
          fontWeight: 700,
          transition: "color 0.15s",
        }}>
          {label}
        </span>
      )}

      {/* Placed item chip (stay variant — e.g. apartment equipment slots) */}
      {placedItem && (
        <div
          draggable
          onDragStart={handlePlacedDragStart}
          onDragEnd={handlePlacedDragEnd}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 16px",
            borderRadius: "6px",
            borderWidth: "2px",
            borderStyle: "solid",
            borderColor: "#4a90d9",
            backgroundColor: "#eaf4ff",
            color: "#1a3a5c",
            fontFamily: "monospace",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "grab",
            userSelect: "none",
          }}
        >
          {placedItem.name}
        </div>
      )}

      {children}
    </div>
  );
}