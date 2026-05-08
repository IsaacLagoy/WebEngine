"use client";

import type { SceneCharacter } from "../src/types";

interface CharacterSlotProps {
  sceneChar: SceneCharacter;
  /** On mobile, this slot is visible only when its character was the last to speak. */
  isMobileActive: boolean;
}

export function CharacterSlot({ sceneChar, isMobileActive }: CharacterSlotProps) {
  const { character, side, isIn, isSpeaking } = sceneChar;

  return (
    <div
      data-side={side}
      data-in={isIn}
      data-mobile-active={isMobileActive}
      className={[
        "char-slot",
        side === "left" ? "char-slot--left" : "char-slot--right",
        isIn ? "char-slot--in" : "",
        !isSpeaking ? "char-slot--dimmed" : "",
        isMobileActive ? "char-slot--mobile-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <img
        src={character.imageSrc}
        alt={character.name}
        className={[
          "char-image",
          side === "right" ? "char-image--flipped" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          objectPosition: "bottom",
        }}
      />
    </div>
  );
}