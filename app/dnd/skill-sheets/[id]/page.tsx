"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Skill, SkillData,
  Spell, SpellData,
  SkillSheet, SkillSheetData,
  readCollection,
  readDocumentById,
  addToCollection,
} from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import SkillSpellModal from "@/app/dnd/components/SkillSpellModal";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";

function levelLabel(level: string): string {
  return level === "0" ? "Starting Skills" : `Level ${level}`;
}

function activeLevels(sheet: SkillSheet): string[] {
  const allKeys = new Set([
    ...Object.keys(sheet.skills),
    ...Object.keys(sheet.spells),
  ]);
  return Array.from(allKeys).sort((a, b) => Number(a) - Number(b));
}

function normalizeEntryName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export default function SkillSheetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const isAdmin = useIsAdmin();

  const [sheet, setSheet]               = useState<SkillSheet | null>(null);
  const [allSkills, setAllSkills]       = useState<Skill[]>([]);
  const [allSpells, setAllSpells]       = useState<Spell[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(0);
  const [newSkillByLevel, setNewSkillByLevel] = useState<Record<string, string>>({});
  const [newSpellByLevel, setNewSpellByLevel] = useState<Record<string, string>>({});
  const [savingLevel, setSavingLevel] = useState<string | null>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sheetDoc, skills, spells] = await Promise.all([
          readDocumentById<SkillSheetData>("skillSheets", id, true),
          readCollection<SkillData>("skills"),
          readCollection<SpellData>("spells"),
        ]);
        setSheet(sheetDoc);
        setAllSkills(skills);
        setAllSpells(spells);
      } catch (err) {
        console.error("Error loading skill sheet:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleSkillClick(skillName: string) {
    const skillId = normalizeEntryName(skillName);
    const found = allSkills.find((s) => s.id === skillId) ?? null;
    // Fallback: if not found by ID, match by name
    setSelectedSkill(found ?? allSkills.find(
      (s) => s.name.toLowerCase() === skillName.toLowerCase()
    ) ?? null);
  }

  function handleSpellClick(spellName: string, level: number) {
    const spellId = normalizeEntryName(spellName);
    const found = allSpells.find((s) => s.id === spellId) ?? null;
    setSelectedSpell(found ?? allSpells.find(
      (s) => s.name.toLowerCase() === spellName.toLowerCase()
    ) ?? null);
    setSelectedSpellLevel(level);
  }

  function hasSkillData(skillName: string): boolean {
    const skillId = normalizeEntryName(skillName);
    return allSkills.some(
      (skill) =>
        skill.id === skillId ||
        skill.name.trim().toLowerCase() === skillName.trim().toLowerCase()
    );
  }

  function hasSpellData(spellName: string): boolean {
    const spellId = normalizeEntryName(spellName);
    return allSpells.some(
      (spell) =>
        spell.id === spellId ||
        spell.name.trim().toLowerCase() === spellName.trim().toLowerCase()
    );
  }

  async function saveSheetEdits(nextSheetData: SkillSheetData, level: string) {
    if (!sheet) return;
    setSavingLevel(level);
    try {
      await addToCollection("skillSheets", nextSheetData, sheet.id);
      setSheet({
        id: sheet.id,
        ...nextSheetData,
      });
    } catch (err: any) {
      console.error("Error saving skill sheet:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in as admin to edit skill sheets.");
      }
    } finally {
      setSavingLevel(null);
    }
  }

  async function removeEntry(level: string, field: "skills" | "spells", index: number) {
    if (!sheet) return;
    const currentEntries = field === "skills"
      ? (sheet.skills[level] ?? [])
      : (sheet.spells[level] ?? []);
    const nextEntries = currentEntries.filter((_, i) => i !== index);
    const nextSheetData: SkillSheetData = {
      name: sheet.name,
      skills: field === "skills" ? { ...sheet.skills, [level]: nextEntries } : sheet.skills,
      spells: field === "spells" ? { ...sheet.spells, [level]: nextEntries } : sheet.spells,
    };
    await saveSheetEdits(nextSheetData, level);
  }

  async function addEntry(level: string, field: "skills" | "spells") {
    if (!sheet) return;
    const draftValue = (field === "skills" ? newSkillByLevel[level] : newSpellByLevel[level]) ?? "";
    const entry = draftValue.trim();
    if (!entry) return;

    const currentEntries = field === "skills"
      ? (sheet.skills[level] ?? [])
      : (sheet.spells[level] ?? []);

    const nextEntries = [...currentEntries, entry];
    const nextSheetData: SkillSheetData = {
      name: sheet.name,
      skills: field === "skills" ? { ...sheet.skills, [level]: nextEntries } : sheet.skills,
      spells: field === "spells" ? { ...sheet.spells, [level]: nextEntries } : sheet.spells,
    };

    await saveSheetEdits(nextSheetData, level);
    if (field === "skills") {
      setNewSkillByLevel((prev) => ({ ...prev, [level]: "" }));
    } else {
      setNewSpellByLevel((prev) => ({ ...prev, [level]: "" }));
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen px-8 py-12">
        <div className="text-white/70 text-lg">Loading...</div>
      </main>
    );
  }

  if (!sheet) {
    return (
      <main className="min-h-screen px-8 py-12">
        <div className="text-white/70 text-lg">Skill sheet not found.</div>
      </main>
    );
  }

  const levels = activeLevels(sheet);

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          {sheet.name}
        </h1>

        <div className="space-y-6">
          {levels.map((level) => {
            const skills = sheet.skills[level] ?? [];
            const spells = sheet.spells[level] ?? [];

            return (
              <Glass key={level} className="p-6">
                <h2 className="text-white font-bold text-xl mb-4">
                  {levelLabel(level)}
                </h2>
                {isAdmin && (
                  <div className="text-xs text-white/50 mb-3">
                    Edit mode: add/remove skill and spell names directly for this level.
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
                      Skills
                    </div>
                    {skills.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => {
                          const missingSkillData = !hasSkillData(skill);
                          return (
                          <li key={`${skill}-${index}`} className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSkillClick(skill)}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                missingSkillData
                                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/40"
                                  : "bg-white/10 hover:bg-white/20 text-white/90"
                              }`}
                            >
                              {skill}
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => removeEntry(level, "skills", index)}
                                className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/40 transition-colors"
                                disabled={savingLevel === level}
                              >
                                x
                              </button>
                            )}
                          </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-white/40 text-sm italic">None</div>
                    )}
                    {isAdmin && (
                      <div className="mt-3 flex gap-2">
                        <input
                          value={newSkillByLevel[level] ?? ""}
                          onChange={(e) =>
                            setNewSkillByLevel((prev) => ({ ...prev, [level]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addEntry(level, "skills");
                            }
                          }}
                          placeholder="Add skill by name"
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40"
                          disabled={savingLevel === level}
                        />
                        <button
                          type="button"
                          onClick={() => addEntry(level, "skills")}
                          className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-white text-sm transition-colors"
                          disabled={savingLevel === level}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
                      Spells
                    </div>
                    {spells.length > 0 ? (
                      <ul className="flex flex-wrap gap-2">
                        {spells.map((spell, index) => {
                          const missingSpellData = !hasSpellData(spell);
                          return (
                          <li key={`${spell}-${index}`} className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSpellClick(spell, Number(level))}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                missingSpellData
                                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/40"
                                  : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200/90"
                              }`}
                            >
                              {spell}
                            </button>
                            {isAdmin && (
                              <button
                                type="button"
                                onClick={() => removeEntry(level, "spells", index)}
                                className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/40 transition-colors"
                                disabled={savingLevel === level}
                              >
                                x
                              </button>
                            )}
                          </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-white/40 text-sm italic">None</div>
                    )}
                    {isAdmin && (
                      <div className="mt-3 flex gap-2">
                        <input
                          value={newSpellByLevel[level] ?? ""}
                          onChange={(e) =>
                            setNewSpellByLevel((prev) => ({ ...prev, [level]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addEntry(level, "spells");
                            }
                          }}
                          placeholder="Add spell by name"
                          className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40"
                          disabled={savingLevel === level}
                        />
                        <button
                          type="button"
                          onClick={() => addEntry(level, "spells")}
                          className="px-4 py-2 bg-white/15 hover:bg-white/25 rounded-lg text-white text-sm transition-colors"
                          disabled={savingLevel === level}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Glass>
            );
          })}
        </div>
      </div>

      <SkillSpellModal
        type="skill"
        data={selectedSkill}
        onClose={() => setSelectedSkill(null)}
      />
      <SkillSpellModal
        type="spell"
        data={selectedSpell}
        level={selectedSpellLevel}
        onClose={() => setSelectedSpell(null)}
      />
    </main>
  );
}