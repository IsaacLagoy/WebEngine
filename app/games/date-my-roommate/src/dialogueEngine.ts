import type { Character } from "./types";

// Base fields shared by steps (enter/exit use speaker as documented in each kind)
export interface DialogueStepBase {
  speaker: Character | "yn" | null;
  side: null | "left" | "right";
  color?: string;
  bg?: string;
}

/** Character in `speaker` exits (no-op if yn or null). */
export interface DialogueExit extends DialogueStepBase {
  kind: "exit";
}

/** Adds `character` to the scene from `side` (null side defaults to left in the runner). */
export interface DialogueEnter extends DialogueStepBase {
  kind: "enter";
  character: Character;
  side: null | "left" | "right";
}

/** Lowers the dialogue box. */
export interface DialogueLowerText extends DialogueStepBase {
  kind: "lower";
}

export interface DialogueText extends DialogueStepBase {
  kind: "text";
  text: string;
}

/** Runs immediately when reached; does not wait for a click. */
export interface DialogueFunc extends DialogueStepBase {
  kind: "func";
  func: () => void;
}

export interface DialogueSelect extends DialogueStepBase {
  kind: "select";
  options: {
    text: string;
    func: () => void;
  }[];
}

export type DialogueStep =
  | DialogueEnter
  | DialogueExit
  | DialogueLowerText
  | DialogueText
  | DialogueFunc
  | DialogueSelect;

// TODO later: add dialogue action that changes the character image

export class DialogueEngine {
  private queue: DialogueStep[] = [];

  enqueue(step: DialogueStep) {
    this.queue.push(step);
  }

  enqueueAll(steps: DialogueStep[]) {
    this.queue.push(...steps);
  }

  dequeue() {
    return this.queue.shift();
  }

  peek(): DialogueStep | undefined {
    return this.queue[0];
  }

  clear() {
    this.queue = [];
  }

  isEmpty() {
    return this.queue.length === 0;
  }

  length() {
    return this.queue.length;
  }
}

// TODO need to store customer on boba order interface

// TODO for order scene (activated by clicking next customer button):
// 1 select option for greeting (what can I get you?, order?)
// 2 character get function call to respond based on disposition with variance (function call queues the next dialogue)
// 3 generate random order and add it to orders list
// 4 exit

// TODO for checkout scene (activated by user dragging drink to dropzone and selecting "serve" on order recipe)
// 1 character get function call to respond based on how well the drink was made
// 2 character get function call to add tip to player wallet, change disposition based on how well the drink was made
// 3 character get function call to say exit message based on how well the drink was made and disposition
// exit
