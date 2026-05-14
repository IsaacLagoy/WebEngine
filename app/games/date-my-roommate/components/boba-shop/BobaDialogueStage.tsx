"use client";

import type { SceneState } from "../../src/types";
import { Scene } from "../Scene";
import "../../scene.css";

/** Default behind characters: dark grey, slightly transparent (not the blue–purple gradient). */
const DEFAULT_SCENE_BG = "rgba(36, 36, 38, 0.88)";

interface BobaDialogueStageProps {
  state: SceneState;
  onDialogueAdvance?: () => void;
  background?: string;
  dialogueChoiceLabels?: string[] | null;
  onDialoguePickChoice?: (index: number) => void;
}

/**
 * Visual-novel strip for the boba shop: same layout as the demo in {@link ../../paged.tsx},
 * packaged for embedding under station UI (character columns + dialogue box).
 */
export function BobaDialogueStage({
  state,
  onDialogueAdvance,
  background = DEFAULT_SCENE_BG,
  dialogueChoiceLabels,
  onDialoguePickChoice,
}: BobaDialogueStageProps) {
  return (
    <div
      className="boba-dialogue-stage"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 200,
      }}
    >
      <Scene
        state={state}
        onDialogueAdvance={onDialogueAdvance}
        background={background}
        dialogueChoiceLabels={dialogueChoiceLabels}
        onDialoguePickChoice={onDialoguePickChoice}
      />
    </div>
  );
}
