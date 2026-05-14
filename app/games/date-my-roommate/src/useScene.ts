import { useCallback, useState } from "react";
import type { Character, DialogueState, SceneState, Side } from "./types";

const initialDialogue: DialogueState = {
  visible: false,
  speakerName: "",
  speakerColor: "#ffffff",
  text: "",
  textColor: undefined,
  panelBg: undefined,
};

export function useScene() {
  const [state, setState] = useState<SceneState>({
    characters: {},
    dialogue: initialDialogue,
    lastSpeakerId: null,
  });

  /**
   * Slide a character onto the scene from the given side.
   * If they are already in the scene, updates their slot (side / in) and focus.
   */
  const enterScene = useCallback((character: Character, side: Side) => {
    setState((prev) => {
      const updatedCharacters = Object.fromEntries(
        Object.entries(prev.characters).map(([id, sc]) => [
          id,
          { ...sc, isSpeaking: id === character.id },
        ])
      );

      return {
        ...prev,
        characters: {
          ...updatedCharacters,
          [character.id]: {
            character,
            side,
            isIn: true,
            isSpeaking: true,
          },
        },
        lastSpeakerId: character.id,
        dialogue: {
          ...prev.dialogue,
          visible: false,
          textColor: undefined,
          panelBg: undefined,
        },
      };
    });
  }, []);

  /**
   * Slide a character off the scene.
   * Preserves their side so the exit animation goes the right direction.
   */
  const exitScene = useCallback((characterId: string) => {
    setState((prev) => {
      const existing = prev.characters[characterId];
      if (!existing) return prev;
      return {
        ...prev,
        lastSpeakerId:
          prev.lastSpeakerId === characterId ? null : prev.lastSpeakerId,
        characters: {
          ...prev.characters,
          [characterId]: { ...existing, isIn: false, isSpeaking: false },
        },
      };
    });
  }, []);

  /**
   * Make a character say something.
   * Shows the dialogue box and dims all other characters.
   */
  const speak = useCallback((characterId: string, text: string) => {
    setState((prev) => {
      const speaker = prev.characters[characterId];
      if (!speaker) return prev;

      // Mark every character as speaking/not-speaking
      const updatedCharacters = Object.fromEntries(
        Object.entries(prev.characters).map(([id, sc]) => [
          id,
          { ...sc, isSpeaking: id === characterId },
        ])
      );

      return {
        ...prev,
        characters: updatedCharacters,
        lastSpeakerId: characterId,
        dialogue: {
          visible: true,
          speakerName: speaker.character.name,
          speakerColor: speaker.character.nameColor ?? "#ffffff",
          text,
          textColor: undefined,
          panelBg: undefined,
        },
      };
    });
  }, []);

  /**
   * Dialogue line with full speaker resolution (in-scene character, "You", or narrator).
   * Optional `color` / `bg` override name tag and panel (per DialogueStep).
   */
  const speakLine = useCallback(
    (args: {
      speaker: Character | "yn" | null;
      text: string;
      color?: string;
      bg?: string;
    }) => {
      const { speaker, text, color, bg } = args;
      setState((prev) => {
        if (speaker && speaker !== "yn") {
          const sid = speaker.id;
          const sc = prev.characters[sid];
          if (!sc) return prev;
          const updatedCharacters = Object.fromEntries(
            Object.entries(prev.characters).map(([id, s]) => [
              id,
              { ...s, isSpeaking: id === sid },
            ])
          );
          return {
            ...prev,
            characters: updatedCharacters,
            lastSpeakerId: sid,
            dialogue: {
              visible: true,
              speakerName: sc.character.name,
              speakerColor: color ?? sc.character.nameColor ?? "#ffffff",
              text,
              textColor: undefined,
              panelBg: bg,
            },
          };
        }

        if (speaker === "yn") {
          const updatedCharacters = Object.fromEntries(
            Object.entries(prev.characters).map(([id, s]) => [
              id,
              { ...s, isSpeaking: false },
            ])
          );
          return {
            ...prev,
            characters: updatedCharacters,
            lastSpeakerId: null,
            dialogue: {
              visible: true,
              speakerName: "You",
              speakerColor: color ?? "#a8d4ff",
              text,
              textColor: undefined,
              panelBg: bg,
            },
          };
        }

        const updatedCharacters = Object.fromEntries(
          Object.entries(prev.characters).map(([id, s]) => [
            id,
            { ...s, isSpeaking: false },
          ])
        );
        return {
          ...prev,
          characters: updatedCharacters,
          lastSpeakerId: null,
          dialogue: {
            visible: true,
            speakerName: "",
            speakerColor: "#888888",
            text,
            textColor: undefined,
            panelBg: bg,
          },
        };
      });
    },
    []
  );

  /**
   * Clear line content while keeping the box visible (e.g. before choice buttons).
   */
  const clearDialogueContent = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dialogue: {
        ...prev.dialogue,
        visible: true,
        speakerName: "",
        text: "",
        textColor: undefined,
      },
    }));
  }, []);

  /**
   * Slide the dialogue box down out of view.
   */
  const lowerDialogue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dialogue: {
        ...prev.dialogue,
        visible: false,
        textColor: undefined,
        panelBg: undefined,
      },
    }));
  }, []);

  const resetScene = useCallback(() => {
    setState({
      characters: {},
      dialogue: initialDialogue,
      lastSpeakerId: null,
    });
  }, []);

  return {
    state,
    enterScene,
    exitScene,
    speak,
    speakLine,
    clearDialogueContent,
    lowerDialogue,
    resetScene,
  } as const;
}