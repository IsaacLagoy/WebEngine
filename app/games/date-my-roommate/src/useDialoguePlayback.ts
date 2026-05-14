"use client";

import { useCallback, useRef, useState } from "react";
import { DialogueEngine, type DialogueStep } from "./dialogueEngine";
import type { Side } from "./types";
import { useScene } from "./useScene";

function flushLeadingFuncs(engine: DialogueEngine) {
  for (;;) {
    const peek = engine.peek();
    if (peek?.kind !== "func") break;
    const step = engine.dequeue();
    if (step?.kind === "func") step.func();
  }
}

/**
 * Bridges {@link DialogueEngine} queues to {@link useScene}.
 * Non-reading steps (enter/exit/lower/func chains) advance automatically via microtasks.
 * Blocking steps: {@link DialogueText} (click dialogue) and {@link DialogueSelect} (pick option).
 */
export function useDialoguePlayback() {
  const engineRef = useRef(new DialogueEngine());
  const scene = useScene();
  const selectBlockRef = useRef(false);
  const [selectOptions, setSelectOptions] = useState<
    { text: string; func: () => void }[] | null
  >(null);

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

      const peek = engine.peek();
      if (!peek) return;

      if (peek.kind === "text" || peek.kind === "select") {
        engine.dequeue();
        applyStep(peek);
        return;
      }

      const step = engine.dequeue()!;
      if (step.kind === "func") {
        step.func();
        queueMicrotask(process);
        return;
      }

      applyStep(step);
      queueMicrotask(process);
    };

    queueMicrotask(process);
  }, [applyStep]);

  const pickOption = useCallback(
    (index: number) => {
      const opts = selectOptions;
      if (!opts?.[index]) return;

      opts[index].func();
      selectBlockRef.current = false;
      setSelectOptions(null);

      queueMicrotask(() => drainUntilBlocking());
    },
    [selectOptions, drainUntilBlocking]
  );

  const queueScript = useCallback((steps: DialogueStep[]) => {
    engineRef.current.enqueueAll(steps);
  }, []);

  const clearScript = useCallback(() => {
    engineRef.current.clear();
    selectBlockRef.current = false;
    setSelectOptions(null);
  }, []);

  const resetScene = useCallback(() => {
    scene.resetScene();
  }, [scene]);

  return {
    engineRef,
    state: scene.state,
    selectOptions,
    queueScript,
    clearScript,
    advance: drainUntilBlocking,
    pickOption,
    resetScene,
  } as const;
}
