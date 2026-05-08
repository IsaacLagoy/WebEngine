"use client";

import { useEffect, useRef } from "react";
import { useScene } from "./src/useScene";
import { Scene } from "./components/Scene";
import type { Character } from "./src/types";
import "./scene.css";

// ─── Define your characters ───────────────────────────────────────────────────
// imageSrc should point to a portrait image in /public.
// On the right side the image is automatically flipped via CSS scaleX(-1).

const MIRA: Character = {
  id: "mira",
  name: "Mira",
  imageSrc: "/images/isaac/isaac_research.png",
  nameColor: "#c4a8ff",
};

const KAI: Character = {
  id: "kai",
  name: "Kai",
  imageSrc: "/images/isaac/isaac_research.png",
  nameColor: "#90c8ff",
};

// ─── Sample script (replace with your real dialogue engine) ──────────────────
type ScriptStep =
  | { type: "enter";  character: Character; side: "left" | "right" }
  | { type: "exit";   characterId: string }
  | { type: "speak";  characterId: string; text: string }
  | { type: "lower" };

const SAMPLE_SCRIPT: ScriptStep[] = [
  { type: "enter",  character: MIRA, side: "left" },
  { type: "speak",  characterId: "mira", text: "Hey… you actually came. b b b b b b b  bb b b b b b b  b b b b b b b b b b b b b b b bb b b b b b b b b b  b b bb b b b b b b b b b b b b b b b bb b b" },
  { type: "enter",  character: KAI,  side: "right" },
  { type: "speak",  characterId: "kai",  text: "I always keep my promises." },
  { type: "speak",  characterId: "mira", text: "I wasn't sure you would show up." },
  { type: "speak",  characterId: "kai",  text: "…Fine. Maybe I wanted to see you too." },
  { type: "lower" },
  { type: "exit",   characterId: "kai" },
  { type: "speak",  characterId: "mira", text: "He always does that." },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DateSimPage() {
  const { state, enterScene, exitScene, speak, lowerDialogue } = useScene();
  const stepRef = useRef(0);
  const controls = [
    { label: "enterScene(mira, 'left')", onClick: () => enterScene(MIRA, "left") },
    { label: "enterScene(kai, 'right')", onClick: () => enterScene(KAI, "right") },
    {
      label: 'speak(mira, "Hey… you actually came.")',
      onClick: () => speak(MIRA.id, "Hey… you actually came. b b b b b b b  bb b b b b b b  b b b b b b b b b b b b b b b bb b b b b b b b b b  b b bb b b b b b b b b b b b b b b b bb b b"),
    },
    {
      label: `speak(kai, "Don't read too much into this.")`,
      onClick: () => speak(KAI.id, "Don't read too much into this."),
    },
    { label: "exitScene(mira)", onClick: () => exitScene(MIRA.id) },
    { label: "exitScene(kai)", onClick: () => exitScene(KAI.id) },
    { label: "lowerDialogue()", onClick: lowerDialogue },
  ] as const;

  // Run the first step on mount so something is visible immediately
  useEffect(() => {
    runStep(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function runStep(index: number) {
    const step = SAMPLE_SCRIPT[index];
    if (!step) return;

    switch (step.type) {
      case "enter":
        enterScene(step.character, step.side);
        break;
      case "exit":
        exitScene(step.characterId);
        break;
      case "speak":
        speak(step.characterId, step.text);
        break;
      case "lower":
        lowerDialogue();
        break;
    }
  }

  /**
   * Advance — called when the player clicks the dialogue box.
   * Execute the next step in the script.
   */
  function handleAdvance() {
    stepRef.current += 1;
    runStep(stepRef.current);
  }

  return (
    <main
      style={{
        width: "100%",
        height: "100svh",
        background: "#000",
      }}
    >
      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          right: 12,
          zIndex: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "center",
        }}
      >
        {controls.map((control) => (
          <button
            key={control.label}
            type="button"
            onClick={control.onClick}
            style={{
              fontSize: 12,
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.3)",
              background: "rgba(15, 15, 22, 0.8)",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {control.label}
          </button>
        ))}
      </div>
      <div style={{ width: "100%", height: "100%" }}>
        <Scene
          state={state}
          onDialogueAdvance={handleAdvance}
          // Optional: pass a CSS background string or image URL
          background="linear-gradient(180deg, #0d0b1a 0%, #1a1040 55%, #2a1535 100%)"
        />
      </div>
    </main>
  );
}