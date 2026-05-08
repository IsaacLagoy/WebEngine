"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Character, Clothing, ClothingSlot, GameData, Player } from "./types";
import { DEFAULT_GAME_DATA, DEFAULT_PLAYER } from "./types";

const GAME_DATA_STORAGE_KEY = "date-my-roommate:game-data";

type PlayerContextValue = {
  gameData: GameData;
  player: Player;
  isLoaded: boolean;
  setMoney: (money: number) => void;
  addMoney: (delta: number) => void;
  setClothing: (slot: ClothingSlot, clothing: Clothing | null) => void;
  setCurrentScene: (scene: string) => void;
  upsertCharacter: (character: Character) => void;
  saveProgress: () => void;
  resetProgress: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function safeParseGameData(raw: string | null): GameData | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<GameData>;
    const parsedPlayer: Partial<Player> =
      parsed.player && typeof parsed.player === "object" ? parsed.player : {};
    const money = typeof parsedPlayer.money === "number" ? parsedPlayer.money : DEFAULT_PLAYER.money;
    const clothing =
      parsedPlayer.clothing && typeof parsedPlayer.clothing === "object" ? parsedPlayer.clothing : {};
    const currentScene =
      typeof parsed.currentScene === "string" && parsed.currentScene.length > 0
        ? parsed.currentScene
        : DEFAULT_GAME_DATA.currentScene;
    const characters =
      parsed.characters && typeof parsed.characters === "object" ? parsed.characters : {};
    return {
      player: { money, clothing },
      currentScene,
      characters,
    };
  } catch {
    return null;
  }
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [gameData, setGameData] = useState<GameData>(DEFAULT_GAME_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const player = gameData.player;

  useEffect(() => {
    const saved = safeParseGameData(window.localStorage.getItem(GAME_DATA_STORAGE_KEY));
    if (saved) setGameData(saved);
    setIsLoaded(true);
  }, []);

  const saveProgress = useCallback(() => {
    window.localStorage.setItem(GAME_DATA_STORAGE_KEY, JSON.stringify(gameData));
  }, [gameData]);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(GAME_DATA_STORAGE_KEY, JSON.stringify(gameData));
  }, [gameData, isLoaded]);

  const setMoney = useCallback((money: number) => {
    setGameData((prev) => ({
      ...prev,
      player: { ...prev.player, money },
    }));
  }, []);

  const addMoney = useCallback((delta: number) => {
    setGameData((prev) => ({
      ...prev,
      player: { ...prev.player, money: prev.player.money + delta },
    }));
  }, []);

  const setClothing = useCallback((slot: ClothingSlot, clothing: Clothing | null) => {
    setGameData((prev) => {
      const nextClothing = { ...prev.player.clothing };
      if (clothing) {
        nextClothing[slot] = clothing;
      } else {
        delete nextClothing[slot];
      }
      return {
        ...prev,
        player: {
          ...prev.player,
          clothing: nextClothing,
        },
      };
    });
  }, []);

  const setCurrentScene = useCallback((scene: string) => {
    setGameData((prev) => ({ ...prev, currentScene: scene }));
  }, []);

  const upsertCharacter = useCallback((character: Character) => {
    setGameData((prev) => ({
      ...prev,
      characters: {
        ...prev.characters,
        [character.id]: character,
      },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    setGameData(DEFAULT_GAME_DATA);
    window.localStorage.removeItem(GAME_DATA_STORAGE_KEY);
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      gameData,
      player,
      isLoaded,
      setMoney,
      addMoney,
      setClothing,
      setCurrentScene,
      upsertCharacter,
      saveProgress,
      resetProgress,
    }),
    [
      gameData,
      player,
      isLoaded,
      setMoney,
      addMoney,
      setClothing,
      setCurrentScene,
      upsertCharacter,
      saveProgress,
      resetProgress,
    ]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used inside PlayerProvider");
  }
  return context;
}
