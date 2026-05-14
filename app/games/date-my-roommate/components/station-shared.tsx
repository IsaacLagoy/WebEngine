/**
 * station-shared.tsx
 *
 * Shared primitives used by every boba shop station tab.
 * No decorative styling — cups are plain text via CupDisplay.
 */

import type { ReactNode, CSSProperties } from "react";
import DraggableItem from "./DraggableItem";
import DropZone from "./DropZone";
import CupDisplay from "./CupDisplay";
import type { ItemCallbacks } from "./DraggableItem";
import type { Cup } from "../src/types";

export const STACK_ID = "cup_stack";

// ---------------------------------------------------------------------------
// CupItem — draggable cup showing plain text contents
// ---------------------------------------------------------------------------

export function CupItem({
  cup,
  returnCallbacks,
}: {
  cup: Cup;
  returnCallbacks: React.MutableRefObject<Map<string, ItemCallbacks>>;
}) {
  return (
    <DraggableItem
      id={cup.id}
      name={cup.id}
      variant="return"
      returnCallbacks={returnCallbacks}
    >
      <CupDisplay cup={cup} />
    </DraggableItem>
  );
}

// ---------------------------------------------------------------------------
// MachineSlot — DropZone holding exactly one cup
// ---------------------------------------------------------------------------

export function MachineSlot({
  slotCup,
  returnCallbacks,
  onDrop,
  onRemove,
  label = "drag cup here",
}: {
  slotCup: Cup | null;
  returnCallbacks: React.MutableRefObject<Map<string, ItemCallbacks>>;
  onDrop: (id: string) => void;
  onRemove: (id: string) => void;
  label?: string;
}) {
  return (
    <DropZone
      label={slotCup ? "" : label}
      returnCallbacks={returnCallbacks}
      validate={(id) => id !== slotCup?.id}
      onDrop={onDrop}
      onRemove={onRemove}
      style={{ minWidth: 120, minHeight: 60 }}
    >
      {slotCup && (
        <CupItem cup={slotCup} returnCallbacks={returnCallbacks} />
      )}
    </DropZone>
  );
}

// ---------------------------------------------------------------------------
// StationLayout — top area + bottom bar
// ---------------------------------------------------------------------------

export function StationLayout({
  machinesArea,
  bottomBar,
}: {
  machinesArea: ReactNode;
  bottomBar: ReactNode;
}) {
  return (
    <div style={{ height: "100%", display: "grid", gridTemplateRows: "1fr auto", overflow: "hidden" }}>
      <div style={{ padding: 24, overflowY: "auto", display: "flex", gap: 20, flexWrap: "wrap", height: "100%", boxSizing: "border-box" }}>
        {machinesArea}
      </div>
      {bottomBar}
    </div>
  );
}

// ---------------------------------------------------------------------------
// BottomBar — three-column strip
// ---------------------------------------------------------------------------

export function BottomBar({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "80px 1fr 100px",
      gap: 8,
      padding: "8px 12px",
      borderTop: "1px solid #ccc",
      alignItems: "stretch",
      minHeight: 120,
    }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
        {left}
      </div>
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        {center}
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {right}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TrashZone
// ---------------------------------------------------------------------------

export function TrashZone({
  returnCallbacks,
  onDrop,
  validate,
}: {
  returnCallbacks: React.MutableRefObject<Map<string, ItemCallbacks>>;
  onDrop: (id: string) => void;
  validate?: (id: string) => boolean;
}) {
  return (
    <DropZone
      label="trash"
      returnCallbacks={returnCallbacks}
      validate={validate}
      onDrop={onDrop}
      style={{ minWidth: 60, minHeight: 50, padding: 4 }}
    />
  );
}

// ---------------------------------------------------------------------------
// SendZone
// ---------------------------------------------------------------------------

export function SendZone({
  label,
  returnCallbacks,
  onDrop,
  validate,
}: {
  label: string;
  returnCallbacks: React.MutableRefObject<Map<string, ItemCallbacks>>;
  onDrop: (id: string) => void;
  validate?: (id: string) => boolean;
}) {
  return (
    <DropZone
      label={label}
      returnCallbacks={returnCallbacks}
      validate={validate}
      onDrop={onDrop}
      style={{ flex: 1 }}
    />
  );
}

// ---------------------------------------------------------------------------
// StorageBay
// ---------------------------------------------------------------------------

export function StorageBay({
  cups,
  returnCallbacks,
  onDrop,
  label = "counter",
}: {
  cups: Cup[];
  returnCallbacks: React.MutableRefObject<Map<string, ItemCallbacks>>;
  onDrop: (id: string) => void;
  label?: string;
}) {
  return (
    <>
      <div style={{ fontSize: 10, fontFamily: "monospace", marginBottom: 2 }}>{label}</div>
      <DropZone
        label={cups.length === 0 ? "drag cups here" : ""}
        returnCallbacks={returnCallbacks}
        onDrop={onDrop}
        style={{
          flex: 1,
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          gap: 8,
          padding: "6px 8px",
          minHeight: 60,
        }}
      >
        {cups.map((cup) => (
          <CupItem key={cup.id} cup={cup} returnCallbacks={returnCallbacks} />
        ))}
      </DropZone>
    </>
  );
}