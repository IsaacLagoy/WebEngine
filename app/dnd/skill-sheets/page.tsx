"use client";

import { useEffect, useState, useCallback } from "react";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";
import { useRouter } from "next/navigation";
import { SkillSheet, SkillSheetData, readCollection, addToCollection, removeFromCollection } from "@/lib/firebase";
import Glass from "@/app/components/Glass";

export default function SkillSheetsPage() {
  const router = useRouter();
  const [sheets, setSheets] = useState<SkillSheet[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const isAdmin = useIsAdmin();

  const loadSheets = useCallback(async () => {
    try {
      const data = await readCollection<SkillSheetData>("skillSheets");
      setSheets(data);
    } catch (err: any) {
      console.error("Error loading skill sheets:", err);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  async function handleDeleteSheet(sheetId: string) {
    try {
      await removeFromCollection("skillSheets", sheetId);
      await loadSheets();
    } catch (err: any) {
      console.error("Error deleting skill sheet:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to delete skill sheets.");
      }
    }
  }

  useEffect(() => {
    loadSheets();
  }, [loadSheets]);

  return (
    <main className="min-h-screen pt-24 px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Skill Sheets
        </h1>

        {initialLoading ? (
          <div className="text-white/70 text-lg">Loading skill sheets...</div>
        ) : sheets.length === 0 ? (
          <div className="text-white/70 text-lg">No skill sheets found.</div>
        ) : (
          <ul className="space-y-3">
            {sheets.map((sheet) => (
              <li key={sheet.id}>
                <Glass
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between relative"
                  onClick={() => router.push(`/dnd/skill-sheets/${sheet.id}`)}
                >
                  <div className="text-white font-semibold text-lg">
                    {sheet.name}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSheet(sheet.id);
                      }}
                      className="bg-red-600/40 hover:bg-red-600/60 text-white hover:text-red-800 transition-all -m-1.5"
                    >
                      <Glass className="w-10 h-10 flex items-center justify-center border-none">
                        x
                      </Glass>
                    </button>
                  )}
                </Glass>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}