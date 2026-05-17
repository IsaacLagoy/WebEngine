"use client";

import type { DialogueState } from "../src/types";

export type DialogueChoice = {
  label: string;
  disabled?: boolean;
};

interface DialogueBoxProps {
  dialogue: DialogueState;
  onAdvance?: () => void;
  dialogueChoices?: DialogueChoice[] | null;
  onPickChoice?: (index: number) => void;
}

export function DialogueBox({
  dialogue,
  onAdvance,
  dialogueChoices,
  onPickChoice,
}: DialogueBoxProps) {
  const hasChoices = Boolean(dialogueChoices && dialogueChoices.length > 0);

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
        <p className="dialogue-speaker" style={{ color: dialogue.speakerColor }}>
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

      {hasChoices && dialogueChoices && onPickChoice && (
        <div className="dialogue-choices" onClick={(e) => e.stopPropagation()}>
          {dialogueChoices.map((choice, i) =>
            choice.disabled ? (
              <div
                key={`${choice.label}-${i}`}
                className="dialogue-choice-btn dialogue-choice-btn--disabled"
                aria-disabled="true"
              >
                {choice.label}
              </div>
            ) : (
              <button
                key={`${choice.label}-${i}`}
                type="button"
                className="dialogue-choice-btn"
                onClick={() => onPickChoice(i)}
              >
                {choice.label}
              </button>
            )
          )}
        </div>
      )}

      {!hasChoices && (
        <span className="dialogue-advance" aria-hidden="true">
          ▼
        </span>
      )}
    </div>
  );
}
