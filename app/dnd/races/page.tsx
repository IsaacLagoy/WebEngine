"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Race, RaceData,
  Skill, SkillData,
  readCollection, readCollectionPage, removeFromCollection,
} from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import SkillSpellModal from "@/app/dnd/components/SkillSpellModal";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const STAT_KEYS: { key: keyof RaceData; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "con", label: "CON" },
  { key: "dex", label: "DEX" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];
const PAGE_SIZE = 50;

function formatMod(value: number): string {
  return value >= 0 ? `+${value}` : `${value}`;
}

// ------------------------------------------------------------
// Detail Modal
// ------------------------------------------------------------

function RaceDetailModal({
  race,
  allSkills,
  onClose,
  onSkillClick,
}: {
  race: Race | null;
  allSkills: Skill[];
  onClose: () => void;
  onSkillClick: (skill: Skill) => void;
}) {
  if (!race) return null;

  const activeStats = STAT_KEYS.filter(
    ({ key }) => race[key] !== null && race[key] !== undefined
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Glass
        className="relative w-full max-w-lg p-6 space-y-5 z-10"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <h2 className="text-2xl font-bold text-white">{race.name}</h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-xl leading-none ml-4"
          >
            ×
          </button>
        </div>

        {/* Description */}
        {race.description && (
          <p className="text-white/70 leading-relaxed">{race.description}</p>
        )}

        {/* Stat modifiers */}
        {activeStats.length > 0 && (
          <div>
            <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">
              Stat Modifiers
            </div>
            <div className="flex flex-wrap gap-3">
              {activeStats.map(({ key, label }) => {
                const val = race[key] as number;
                return (
                  <div key={key} className="flex flex-col items-center">
                    <span className="text-white/40 text-xs uppercase">{label}</span>
                    <span
                      className={`font-bold text-lg ${
                        val > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {formatMod(val)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Skills */}
        {race.skills.length > 0 && (
          <div>
            <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">
              Racial Skills
            </div>
            <ul className="flex flex-wrap gap-2">
              {race.skills.map((skillName) => {
                const skillId = skillName.toLowerCase().replace(/\s+/g, "-");
                const found =
                  allSkills.find((s) => s.id === skillId) ??
                  allSkills.find(
                    (s) => s.name.toLowerCase() === skillName.toLowerCase()
                  ) ??
                  null;
                return (
                  <li key={skillName}>
                    <button
                      onClick={() => found && onSkillClick(found)}
                      className={`px-3 py-1 bg-white/10 rounded-full text-white/90 text-sm transition-colors ${
                        found ? "hover:bg-white/20 cursor-pointer" : "opacity-50 cursor-default"
                      }`}
                    >
                      {skillName}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Rules */}
        {race.rules && (
          <div>
            <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-2">
              Rules
            </div>
            <p className="text-white/70 leading-relaxed">{race.rules}</p>
          </div>
        )}
      </Glass>
    </div>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function RacesPage() {
  const [races, setRaces]             = useState<Race[]>([]);
  const [allSkills, setAllSkills]     = useState<Skill[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedRace, setSelectedRace]     = useState<Race | null>(null);
  const [selectedSkill, setSelectedSkill]   = useState<Skill | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | undefined>>({ 1: undefined });
  const [hasNextPage, setHasNextPage] = useState(false);
  const isAdmin = useIsAdmin();

  const loadData = useCallback(async () => {
    try {
      const [races, skills] = await Promise.all([
        readCollectionPage<RaceData>("races", PAGE_SIZE, cursorByPage[currentPage], true),
        readCollection<SkillData>("skills", { maxItems: 50, preferCache: true }),
      ]);
      setRaces(races.items);
      setHasNextPage(races.nextCursor !== null);
      setCursorByPage((prev) => {
        if (!races.nextCursor) return prev;
        if (prev[currentPage + 1] === races.nextCursor) return prev;
        return { ...prev, [currentPage + 1]: races.nextCursor };
      });
      setAllSkills(skills);
    } catch (err: any) {
      console.error("Error loading races:", err);
    } finally {
      setInitialLoading(false);
    }
  }, [currentPage, cursorByPage]);

  async function handleDeleteRace(raceId: string) {
    try {
      await removeFromCollection("races", raceId);
      setRaces((prev) => prev.filter((r) => r.id !== raceId));
    } catch (err: any) {
      console.error("Error deleting race:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to delete races.");
      }
    }
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Races
          </h1>
          {isAdmin && (
            <div className="flex gap-4 mb-8">
              {/* Add form omitted — seed via script */}
            </div>
          )}
        </div>

        {initialLoading ? (
          <div className="text-white/70 text-lg">Loading races...</div>
        ) : races.length === 0 ? (
          <div className="text-white/70 text-lg">No races found.</div>
        ) : (
          <>
          <ul className="space-y-3">
            {races.map((race) => (
              <li key={race.id}>
                <Glass
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between"
                  onClick={() => setSelectedRace(race)}
                >
                  <div className="text-white font-semibold text-lg">
                    {race.name}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRace(race.id);
                      }}
                      className="bg-red-600/40 hover:bg-red-600/60 text-white transition-all -m-1.5"
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
          {(currentPage > 1 || hasNextPage) && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-2xl px-2"
              >
                &lt;
              </button>
              <span className="text-white/60 text-sm">
                Page {currentPage}
              </span>
              <button
                onClick={() => {
                  if (hasNextPage) setCurrentPage((p) => p + 1);
                }}
                disabled={!hasNextPage}
                className="text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-2xl px-2"
              >
                &gt;
              </button>
            </div>
          )}
          </>
        )}
      </div>

      {/* Race detail modal */}
      {selectedRace && (
        <RaceDetailModal
          race={selectedRace}
          allSkills={allSkills}
          onClose={() => setSelectedRace(null)}
          onSkillClick={(skill) => {
            setSelectedRace(null);
            setSelectedSkill(skill);
          }}
        />
      )}

      {/* Skill detail modal */}
      <SkillSpellModal
        type="skill"
        data={selectedSkill}
        onClose={() => {
          setSelectedSkill(null);
        }}
      />
    </main>
  );
}