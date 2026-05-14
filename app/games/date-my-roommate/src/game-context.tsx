"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Scene } from "../components/Scene";
import "../scene.css";
import { DateMyRoommateGame } from "./game/DateMyRoommateGame";
import { useBobaSession, type BobaSession } from "./game/boba/session";
import {
  createDialoguePlayback,
  type SelectOption,
} from "./game/dialogue/playback";
import { GAME_DATA_STORAGE_KEY, safeParseGameData } from "./game/gameDataStorage";
import { DEFAULT_GAME_DATA } from "./types";
import { useScene } from "./useScene";

const DIALOGUE_SCENE_BG = "rgba(36, 36, 38, 0.88)";

export type GameContextValue = {
  game: DateMyRoommateGame;
  boba: BobaSession;
  isLoaded: boolean;
  sceneState: ReturnType<typeof useScene>["state"];
  selectOptions: SelectOption[] | null;
  overlayActive: boolean;
  pickOption: (index: number) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

function GameDialogueOverlay() {
  const { game, sceneState, selectOptions, overlayActive, pickOption } = useGame();
  if (!overlayActive) return null;

  const choiceLabels = selectOptions?.map((o) => o.text) ?? null;

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
      <Scene
        state={sceneState}
        onDialogueAdvance={() => game.advance()}
        background={DIALOGUE_SCENE_BG}
        dialogueChoiceLabels={choiceLabels}
        onDialoguePickChoice={pickOption}
      />
    </div>
  );
}

export function GameProvider({ children }: { children: ReactNode }) {
  const scene = useScene();
  const boba = useBobaSession();
  const [gameData, setGameData] = useState(DEFAULT_GAME_DATA);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectOptions, setSelectOptions] = useState<SelectOption[] | null>(null);
  const [queueLength, setQueueLength] = useState(0);
  const selectBlockRef = useRef(false);

  const gameRef = useRef<DateMyRoommateGame | null>(null);
  if (!gameRef.current) {
    gameRef.current = new DateMyRoommateGame(DEFAULT_GAME_DATA, setGameData);
  }
  const game = gameRef.current;

  game.attachBoba(boba);

  useEffect(() => {
    const saved = safeParseGameData(window.localStorage.getItem(GAME_DATA_STORAGE_KEY));
    if (saved) game.replaceData(saved);
    setIsLoaded(true);
  }, [game]);

  useEffect(() => {
    if (!isLoaded) return;
    window.localStorage.setItem(GAME_DATA_STORAGE_KEY, JSON.stringify(gameData));
  }, [gameData, isLoaded]);

  const syncQueueLength = useCallback(() => {
    setQueueLength(game.engine.length());
  }, [game]);

  const playbackRef = useRef<ReturnType<typeof createDialoguePlayback> | null>(null);
  if (!playbackRef.current) {
    playbackRef.current = createDialoguePlayback(game.engine, {
      scene,
      getSceneState: () => scene.state,
      selectBlockRef,
      setSelectOptions,
      syncQueueLength,
    });
    game.attachPlayback(playbackRef.current);
  }

  const playback = playbackRef.current;

  useEffect(() => {
    game.attachPersistence({
      save: () => {
        window.localStorage.setItem(GAME_DATA_STORAGE_KEY, JSON.stringify(game.gameData));
      },
      reset: () => {
        window.localStorage.removeItem(GAME_DATA_STORAGE_KEY);
      },
    });
  }, [game]);

  const pickOption = useCallback(
    (index: number) => {
      playback.pickOption(index, selectOptions);
    },
    [playback, selectOptions]
  );

  const overlayActive =
    queueLength > 0 ||
    scene.state.dialogue.visible ||
    (selectOptions != null && selectOptions.length > 0);

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      boba,
      isLoaded,
      sceneState: scene.state,
      selectOptions,
      overlayActive,
      pickOption,
    }),
    [game, boba, isLoaded, scene.state, selectOptions, overlayActive, pickOption]
  );

  return (
    <GameContext.Provider value={value}>
      {children}
      <GameDialogueOverlay />
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
}
