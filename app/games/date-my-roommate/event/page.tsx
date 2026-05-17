"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { registerBobaCustomers } from "../src/characters";
import { useGame } from "../src/game-context";
import { isEventScriptId } from "../src/game/eventScripts";
import {
  pathForCurrentScene,
  SCENE_APARTMENT,
  SCENE_STORE,
} from "../src/game/scenePaths";

export default function EventPage() {
  const router = useRouter();
  const { game, isLoaded } = useGame();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || startedRef.current) return;

    const scriptId =
      game.resolveEventScriptIdForResume() ??
      (isEventScriptId(game.gameData.currentScene)
        ? game.gameData.currentScene
        : null);

    if (!scriptId) {
      router.replace(pathForCurrentScene(SCENE_APARTMENT));
      return;
    }

    startedRef.current = true;
    registerBobaCustomers(game);

    game.beginEvent(scriptId, {
      onEventComplete: () => {
        game.setCurrentScene(SCENE_STORE);
        game.saveProgress();
        router.push(pathForCurrentScene(SCENE_STORE));
      },
    });
  }, [game, isLoaded, router]);

  return null;
}
