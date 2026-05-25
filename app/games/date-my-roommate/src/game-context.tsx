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
import { usePathname } from "next/navigation";
import { Scene } from "../components/Scene";
import "../scene.css";
import { DateMyRoommateGame } from "./game/DateMyRoommateGame";
import { useBobaSession, type BobaSession } from "./game/boba/session";
import {
  createDialoguePlayback,
  type DialogueForm,
  type SelectOption,
} from "./game/dialogue/playback";
import { DialogueFormModal } from "../components/DialogueFormModal";
import { safeParseGameData } from "./game/gameDataStorage";
import {
  clearDateMyRoommatePersistedStorage,
  loadDateMyRoommateGameDataJson,
  persistDateMyRoommateGameData,
} from "./storage/dateMyRoommateLocalStorage";
import { createInitialGameData } from "./items/catalog";
import type { GameData } from "./types";
import { useScene } from "./useScene";

const DIALOGUE_SCENE_BG = "rgba(36, 36, 38, 0.88)";

export type GameContextValue = {
  game: DateMyRoommateGame;
  gameData: GameData;
  boba: BobaSession;
  isLoaded: boolean;
  sceneState: ReturnType<typeof useScene>["state"];
  selectOptions: SelectOption[] | null;
  dialogueForm: DialogueForm | null;
  overlayActive: boolean;
  pickOption: (index: number) => void;
  submitDialogueForm: (values: Record<string, string>) => void;
};

const GameContext = createContext<GameContextValue | null>(null);

function GameDialogueOverlay() {
  const {
    game,
    sceneState,
    selectOptions,
    dialogueForm,
    overlayActive,
    pickOption,
    submitDialogueForm,
  } = useGame();
  if (!overlayActive) return null;

  const dialogueChoices =
    selectOptions?.map((o) => ({
      label: o.text,
      disabled: o.disabled,
    })) ?? null;

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
        dialogueChoices={dialogueChoices}
        onDialoguePickChoice={pickOption}
      />
      {dialogueForm && (
        <DialogueFormModal form={dialogueForm} onSubmit={submitDialogueForm} />
      )}
    </div>
  );
}

export function GameProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const scene = useScene();
  const boba = useBobaSession();
  const [gameData, setGameData] = useState(createInitialGameData);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectOptions, setSelectOptions] = useState<SelectOption[] | null>(null);
  const [dialogueForm, setDialogueForm] = useState<DialogueForm | null>(null);
  const [queueLength, setQueueLength] = useState(0);
  const selectBlockRef = useRef(false);
  const formBlockRef = useRef(false);

  const gameRef = useRef<DateMyRoommateGame | null>(null);
  if (!gameRef.current) {
    gameRef.current = new DateMyRoommateGame(createInitialGameData(), setGameData);
  }
  const game = gameRef.current;

  game.attachBoba(boba);

  useEffect(() => {
    const saved = safeParseGameData(loadDateMyRoommateGameDataJson());
    if (saved) game.replaceData(saved);
    setIsLoaded(true);
  }, [game]);

  const isStoreRoute = pathname === "/games/date-my-roommate/store";

  useEffect(() => {
    if (!isLoaded) return;
    if (isStoreRoute) return;
    persistDateMyRoommateGameData(gameData);
  }, [gameData, isLoaded, isStoreRoute]);

  const syncQueueLength = useCallback(() => {
    setQueueLength(game.engine.length());
  }, [game]);

  const playbackRef = useRef<ReturnType<typeof createDialoguePlayback> | null>(null);
  if (!playbackRef.current) {
    playbackRef.current = createDialoguePlayback(game.engine, {
      scene,
      getSceneState: () => scene.state,
      selectBlockRef,
      formBlockRef,
      setSelectOptions,
      setFormState: setDialogueForm,
      syncQueueLength,
    });
    game.attachPlayback(playbackRef.current);
  }

  const playback = playbackRef.current;

  useEffect(() => {
    game.attachPersistence({
      save: () => {
        persistDateMyRoommateGameData(game.gameData);
      },
      reset: () => {
        clearDateMyRoommatePersistedStorage();
      },
    });
  }, [game]);

  const pickOption = useCallback(
    (index: number) => {
      playback.pickOption(index, selectOptions);
    },
    [playback, selectOptions]
  );

  const submitDialogueForm = useCallback(
    (values: Record<string, string>) => {
      playback.submitForm(values, dialogueForm);
    },
    [playback, dialogueForm]
  );

  const overlayActive =
    queueLength > 0 ||
    scene.state.dialogue.visible ||
    (selectOptions != null && selectOptions.length > 0) ||
    dialogueForm != null;

  const value = useMemo<GameContextValue>(
    () => ({
      game,
      gameData,
      boba,
      isLoaded,
      sceneState: scene.state,
      selectOptions,
      dialogueForm,
      overlayActive,
      pickOption,
      submitDialogueForm,
    }),
    [
      game,
      gameData,
      boba,
      isLoaded,
      scene.state,
      selectOptions,
      dialogueForm,
      overlayActive,
      pickOption,
      submitDialogueForm,
    ]
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
