"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "./src/game-context";
import { pathForCurrentScene } from "./src/game/scenePaths";
import { loadDateMyRoommateGameDataJson } from "./src/storage/dateMyRoommateLocalStorage";

export default function DateMyRoommatePage() {
  const router = useRouter();
  const { game, isLoaded } = useGame();
  const [hasSave, setHasSave] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setHasSave(Boolean(loadDateMyRoommateGameDataJson()));
    setChecked(true);
  }, []);

  const resumeGame = useCallback(() => {
    if (!isLoaded) return;
    router.push(pathForCurrentScene(game.gameData.currentScene));
  }, [game, isLoaded, router]);

  const handleClearData = useCallback(() => {
    game.resetProgress();
    setHasSave(false);
  }, [game]);

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: "48px 24px",
        maxWidth: "420px",
        margin: "0 auto",
        color: "#1a3a5c",
        textAlign: "center",
      }}
    >
      <h1 style={{ margin: "0 0 12px", fontSize: "26px", letterSpacing: "-0.02em" }}>
        Date My Roommate
      </h1>

      {!checked ? (
        <p style={{ margin: 0, fontSize: "13px", color: "#888" }}>Loading…</p>
      ) : (
        <>
          <button
            type="button"
            onClick={resumeGame}
            disabled={!isLoaded}
            style={{
              display: "inline-block",
              width: "100%",
              maxWidth: "280px",
              padding: "14px 20px",
              fontSize: "15px",
              fontFamily: "monospace",
              fontWeight: 600,
              borderRadius: "8px",
              border: "1px solid #aac4e0",
              background: "#eaf4ff",
              color: "#1a3a5c",
              cursor: isLoaded ? "pointer" : "wait",
              opacity: isLoaded ? 1 : 0.65,
            }}
          >
            {hasSave ? "Continue" : "New game"}
          </button>

          {hasSave && (
            <button
              type="button"
              onClick={handleClearData}
              style={{
                display: "block",
                margin: "12px auto 0",
                padding: "4px 8px",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "#888",
                background: "transparent",
                border: "none",
                textDecoration: "underline",
                cursor: "pointer",
              }}
            >
              Clear saved data
            </button>
          )}
        </>
      )}
    </div>
  );
}
