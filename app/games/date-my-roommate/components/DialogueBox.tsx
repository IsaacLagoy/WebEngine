"use client";

import type { DialogueState } from "../src/types";

interface DialogueBoxProps {
  dialogue: DialogueState;
  /** Called when the user clicks the box to advance. */
  onAdvance?: () => void;
}

export function DialogueBox({ dialogue, onAdvance }: DialogueBoxProps) {
  return (
    <div
      className={["dialogue-box", !dialogue.visible ? "dialogue-box--hidden" : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={onAdvance}
      role="region"
      aria-label="Dialogue"
      aria-live="polite"
    >
      {dialogue.speakerName && (
        <p
          className="dialogue-speaker"
          style={{ color: dialogue.speakerColor }}
        >
          {dialogue.speakerName}
        </p>
      )}
      <p className="dialogue-text">{dialogue.text}</p>

      {/* Advance indicator */}
      <span className="dialogue-advance" aria-hidden="true">▼</span>
    </div>
  );
}