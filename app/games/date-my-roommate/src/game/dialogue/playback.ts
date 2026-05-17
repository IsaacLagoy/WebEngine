import type { SceneState, Side } from "../../types";
import { DialogueEngine, type DialogueStep } from "./engine";
import type { SceneApi } from "../../useScene";

export type SelectOption = {
  text: string;
  func: () => void;
  disabled?: boolean;
};

export type DialoguePlaybackBridge = {
  scene: SceneApi;
  getSceneState: () => SceneState;
  selectBlockRef: { current: boolean };
  setSelectOptions: (options: SelectOption[] | null) => void;
  syncQueueLength: () => void;
};

function flushLeadingFuncs(engine: DialogueEngine) {
  for (;;) {
    const peek = engine.peek();
    if (peek?.kind !== "func") break;
    const step = engine.dequeue();
    if (step?.kind === "func") step.func();
  }
}

export function createDialoguePlayback(engine: DialogueEngine, bridge: DialoguePlaybackBridge) {
  const applyStep = (step: DialogueStep) => {
    switch (step.kind) {
      case "enter": {
        const side = (step.side ?? "left") as Side;
        bridge.scene.enterScene(step.character, side);
        break;
      }
      case "exit": {
        const sp = step.speaker;
        if (sp && sp !== "yn") bridge.scene.exitScene(sp.id);
        break;
      }
      case "lower":
        bridge.scene.lowerDialogue();
        break;
      case "text":
        bridge.scene.speakLine({
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
        bridge.scene.clearDialogueContent();
        bridge.selectBlockRef.current = true;
        bridge.setSelectOptions(step.options);
        break;
      default:
        break;
    }
  };

  const drainUntilBlocking = () => {
    if (bridge.selectBlockRef.current) return;

    const process = () => {
      if (bridge.selectBlockRef.current) return;

      flushLeadingFuncs(engine);
      bridge.syncQueueLength();

      const peek = engine.peek();
      if (!peek) {
        bridge.syncQueueLength();
        return;
      }

      if (peek.kind === "text" || peek.kind === "select") {
        engine.dequeue();
        applyStep(peek);
        bridge.syncQueueLength();
        return;
      }

      const step = engine.dequeue()!;
      bridge.syncQueueLength();

      if (step.kind === "func") {
        step.func();
        queueMicrotask(process);
        return;
      }

      applyStep(step);
      queueMicrotask(process);
    };

    queueMicrotask(process);
  };

  const queueScript = (steps: DialogueStep[]) => {
    engine.enqueueAll(steps);
    bridge.syncQueueLength();
  };

  const clearScript = () => {
    engine.clear();
    bridge.selectBlockRef.current = false;
    bridge.setSelectOptions(null);
    bridge.syncQueueLength();
  };

  const resetScene = () => {
    bridge.scene.resetScene();
  };

  const pickOption = (index: number, currentOptions: SelectOption[] | null) => {
    const option = currentOptions?.[index];
    if (!option || option.disabled) return;
    option.func();
    bridge.selectBlockRef.current = false;
    bridge.setSelectOptions(null);
    bridge.syncQueueLength();
    queueMicrotask(drainUntilBlocking);
  };

  return {
    queueScript,
    clearScript,
    resetScene,
    advance: drainUntilBlocking,
    pickOption,
  };
}
