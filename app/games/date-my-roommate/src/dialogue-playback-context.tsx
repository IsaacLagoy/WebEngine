"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { DialogueEngine, type DialogueStep } from "./dialogueEngine";
import type { SceneState, Side } from "./types";
import { useScene } from "./useScene";
import { BobaDialogueStage } from "../components/boba-shop/BobaDialogueStage";

function flushLeadingFuncs(engine: DialogueEngine) {
  for (;;) {
    const peek = engine.peek();
    if (peek?.kind !== "func") break;
    const step = engine.dequeue();
    if (step?.kind === "func") step.func();
  }
}

export type DialoguePlaybackApi = {
  engineRef: MutableRefObject<DialogueEngine>;
  state: SceneState;
  selectOptions: { text: string; func: () => void }[] | null;
  queueLength: number;
  /** True while the script queue is non-empty, or dialogue/select is waiting for the player. */
  overlayActive: boolean;
  queueScript: (steps: DialogueStep[]) => void;
  clearScript: () => void;
  advance: () => void;
  pickOption: (index: number) => void;
  resetScene: () => void;
};

const DialoguePlaybackContext = createContext<DialoguePlaybackApi | null>(null);

function useDialoguePlaybackImpl(): DialoguePlaybackApi {
  const engineRef = useRef(new DialogueEngine());
  const scene = useScene();
  const selectBlockRef = useRef(false);
  const [selectOptions, setSelectOptions] = useState<
    { text: string; func: () => void }[] | null
  >(null);
  const [queueLength, setQueueLength] = useState(0);

  const syncQueueLen = useCallback(() => {
    setQueueLength(engineRef.current.length());
  }, []);

  const applyStep = useCallback(
    (step: DialogueStep) => {
      switch (step.kind) {
        case "enter": {
          const side = (step.side ?? "left") as Side;
          scene.enterScene(step.character, side);
          break;
        }
        case "exit": {
          const sp = step.speaker;
          if (sp && sp !== "yn") scene.exitScene(sp.id);
          break;
        }
        case "lower":
          scene.lowerDialogue();
          break;
        case "text":
          scene.speakLine({
            speaker: step.speaker,
            text: step.text,
            color: step.color,
            bg: step.bg,
          });
          break;
        case "func":
          step.func();
          break;
        case "select":
          scene.clearDialogueContent();
          selectBlockRef.current = true;
          setSelectOptions(step.options);
          break;
        default:
          break;
      }
    },
    [scene]
  );

  const drainUntilBlocking = useCallback(() => {
    if (selectBlockRef.current) return;

    const process = () => {
      if (selectBlockRef.current) return;

      const engine = engineRef.current;
      flushLeadingFuncs(engine);
      syncQueueLen();

      const peek = engine.peek();
      if (!peek) {
        syncQueueLen();
        return;
      }

      if (peek.kind === "text" || peek.kind === "select") {
        engine.dequeue();
        applyStep(peek);
        syncQueueLen();
        return;
      }

      const step = engine.dequeue()!;
      syncQueueLen();

      if (step.kind === "func") {
        step.func();
        queueMicrotask(process);
        return;
      }

      applyStep(step);
      queueMicrotask(process);
    };

    queueMicrotask(process);
  }, [applyStep, syncQueueLen]);

  const pickOption = useCallback(
    (index: number) => {
      const opts = selectOptions;
      if (!opts?.[index]) return;

      opts[index].func();
      selectBlockRef.current = false;
      setSelectOptions(null);
      syncQueueLen();

      queueMicrotask(() => drainUntilBlocking());
    },
    [selectOptions, drainUntilBlocking, syncQueueLen]
  );

  const queueScript = useCallback(
    (steps: DialogueStep[]) => {
      engineRef.current.enqueueAll(steps);
      syncQueueLen();
    },
    [syncQueueLen]
  );

  const clearScript = useCallback(() => {
    engineRef.current.clear();
    selectBlockRef.current = false;
    setSelectOptions(null);
    syncQueueLen();
  }, [syncQueueLen]);

  const resetScene = useCallback(() => {
    scene.resetScene();
  }, [scene]);

  const overlayActive =
    queueLength > 0 ||
    scene.state.dialogue.visible ||
    (selectOptions != null && selectOptions.length > 0);

  return {
    engineRef,
    state: scene.state,
    selectOptions,
    queueLength,
    overlayActive,
    queueScript,
    clearScript,
    advance: drainUntilBlocking,
    pickOption,
    resetScene,
  };
}

export function useDialoguePlayback(): DialoguePlaybackApi {
  const ctx = useContext(DialoguePlaybackContext);
  if (!ctx) {
    throw new Error(
      "useDialoguePlayback must be used within a DialoguePlaybackProvider (date-my-roommate layout)"
    );
  }
  return ctx;
}

function GameDialogueOverlay() {
  const api = useDialoguePlayback();
  if (!api.overlayActive) return null;

  const choiceLabels = api.selectOptions?.map((o) => o.text) ?? null;

  return (
    <div
      className="dmr-dialogue-overlay"
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        pointerEvents: "auto",
      }}
    >
      <BobaDialogueStage
        state={api.state}
        onDialogueAdvance={api.advance}
        dialogueChoiceLabels={choiceLabels}
        onDialoguePickChoice={api.pickOption}
      />
    </div>
  );
}

export function DialoguePlaybackProvider({ children }: { children: ReactNode }) {
  const api = useDialoguePlaybackImpl();
  return (
    <DialoguePlaybackContext.Provider value={api}>
      {children}
      <GameDialogueOverlay />
    </DialoguePlaybackContext.Provider>
  );
}
