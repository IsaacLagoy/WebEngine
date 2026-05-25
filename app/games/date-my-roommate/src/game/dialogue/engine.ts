import type { Character } from "../../types";

export interface DialogueStepBase {
  speaker: Character | "yn" | null;
  side: null | "left" | "right";
  color?: string;
  bg?: string;
}

export interface DialogueExit extends DialogueStepBase {
  kind: "exit";
}

export interface DialogueEnter extends DialogueStepBase {
  kind: "enter";
  character: Character;
  side: null | "left" | "right";
}

export interface DialogueLowerText extends DialogueStepBase {
  kind: "lower";
}

export interface DialogueText extends DialogueStepBase {
  kind: "text";
  text: string;
}

export interface DialogueFunc extends DialogueStepBase {
  kind: "func";
  func: () => void;
}

export interface DialogueSelect extends DialogueStepBase {
  kind: "select";
  options: {
    text: string;
    func: () => void;
    disabled?: boolean;
  }[];
}

export type DialogueFormField =
  | {
      type: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      required?: boolean;
    }
  | {
      type: "checkboxes";
      name: string;
      label: string;
      options: { value: string; label: string }[];
    };

export interface DialogueForm extends DialogueStepBase {
  kind: "form";
  title: string;
  fields: DialogueFormField[];
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => void;
}

export type DialogueStep =
  | DialogueEnter
  | DialogueExit
  | DialogueLowerText
  | DialogueText
  | DialogueFunc
  | DialogueSelect
  | DialogueForm;

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
