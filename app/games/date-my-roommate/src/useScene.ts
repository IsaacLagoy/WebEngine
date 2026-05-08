import { useCallback, useState } from "react";
import type { Character, DialogueState, SceneState, Side } from "./types";

const initialDialogue: DialogueState = {
  visible: false,
  speakerName: "",
  speakerColor: "#ffffff",
  text: "",
};

export function useScene() {
  const [state, setState] = useState<SceneState>({
    characters: {},
    dialogue: initialDialogue,
    lastSpeakerId: null,
  });

  /**
   * Slide a character onto the scene from the given side.
   * If they are already in the scene this is a no-op.
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
        dialogue: { ...prev.dialogue, visible: false },
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
        },
      };
    });
  }, []);

  /**
   * Slide the dialogue box down out of view.
   */
  const lowerDialogue = useCallback(() => {
    setState((prev) => ({
      ...prev,
      dialogue: { ...prev.dialogue, visible: false },
    }));
  }, []);

  return {
    state,
    enterScene,
    exitScene,
    speak,
    lowerDialogue,
  } as const;
}