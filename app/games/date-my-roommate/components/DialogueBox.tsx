"use client";

import type { DialogueState } from "../src/types";

interface DialogueBoxProps {
  dialogue: DialogueState;
  /** Called when the user clicks the box to advance. */
  onAdvance?: () => void;
  /** When set, clicking the box does not advance — use choice buttons instead. */
  choiceLabels?: string[] | null;
  onPickChoice?: (index: number) => void;
}

export function DialogueBox({
  dialogue,
  onAdvance,
  choiceLabels,
  onPickChoice,
}: DialogueBoxProps) {
  const hasChoices = Boolean(choiceLabels && choiceLabels.length > 0);

  return (
    <div
      className={["dialogue-box", !dialogue.visible ? "dialogue-box--hidden" : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={hasChoices ? undefined : onAdvance}
      role="region"
      aria-label="Dialogue"
      aria-live="polite"
      style={
        dialogue.panelBg
          ? { background: dialogue.panelBg, borderTopColor: "rgba(255,255,255,0.12)" }
          : undefined
      }
    >
      {dialogue.speakerName && !hasChoices && (
        <p
          className="dialogue-speaker"
          style={{ color: dialogue.speakerColor }}
        >
          {dialogue.speakerName}
        </p>
      )}
      {!hasChoices && (
        <p
          className="dialogue-text"
          style={dialogue.textColor ? { color: dialogue.textColor } : undefined}
        >
          {dialogue.text}
        </p>
      )}

      {hasChoices && choiceLabels && onPickChoice && (
        <div className="dialogue-choices" onClick={(e) => e.stopPropagation()}>
          {choiceLabels.map((label, i) => (
            <button
              key={`${label}-${i}`}
              type="button"
              className="dialogue-choice-btn"
              onClick={() => onPickChoice(i)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Advance indicator */}
      {!hasChoices && (
        <span className="dialogue-advance" aria-hidden="true">
          ▼
        </span>
      )}
    </div>
  );
}