"use client";

import type { SceneState } from "../src/types";
import { CharacterSlot } from "./CharacterSlot";
import { DialogueBox } from "./DialogueBox";

interface SceneProps {
  state: SceneState;
  onDialogueAdvance?: () => void;
  /** Optional background image URL or CSS gradient string. */
  background?: string;
  /** Branching choices (dialogue engine {@link DialogueSelect}) */
  dialogueChoices?: import("./DialogueBox").DialogueChoice[] | null;
  onDialoguePickChoice?: (index: number) => void;
}

export function Scene({
  state,
  onDialogueAdvance,
  background,
  dialogueChoices,
  onDialoguePickChoice,
}: SceneProps) {
  const { characters, dialogue, lastSpeakerId } = state;

  // Split characters into left / right slots for layout
  const leftChars = Object.values(characters).filter((sc) => sc.side === "left");
  const rightChars = Object.values(characters).filter((sc) => sc.side === "right");

  return (
    <div
      className="scene"
      data-dialogue-visible={dialogue.visible ? "true" : "false"}
      style={
        background
          ? { background }
          : undefined
      }
    >
      {/* Background layer */}
      <div className="scene__bg" aria-hidden="true" />

      {/* Left character column */}
      <div className="scene__col scene__col--left">
        {leftChars.map((sc) => (
          <CharacterSlot
            key={sc.character.id}
            sceneChar={sc}
            isMobileActive={lastSpeakerId === sc.character.id}
          />
        ))}
      </div>

      {/* Right character column */}
      <div className="scene__col scene__col--right">
        {rightChars.map((sc) => (
          <CharacterSlot
            key={sc.character.id}
            sceneChar={sc}
            isMobileActive={lastSpeakerId === sc.character.id}
          />
        ))}
      </div>

      {/* Dialogue box sits in front of everything */}
      <DialogueBox
        dialogue={dialogue}
        onAdvance={onDialogueAdvance}
        dialogueChoices={dialogueChoices}
        onPickChoice={onDialoguePickChoice}
      />
    </div>
  );
}