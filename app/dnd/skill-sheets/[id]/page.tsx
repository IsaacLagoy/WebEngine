"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Skill, SkillData,
  Spell, SpellData,
  SkillSheet, SkillSheetData,
  readCollection,
} from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import SkillSpellModal from "@/app/dnd/components/SkillSpellModal";

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

  const [sheet, setSheet]               = useState<SkillSheet | null>(null);
  const [allSkills, setAllSkills]       = useState<Skill[]>([]);
  const [allSpells, setAllSpells]       = useState<Spell[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [selectedSpellLevel, setSelectedSpellLevel] = useState<number>(0);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [sheets, skills, spells] = await Promise.all([
          readCollection<SkillSheetData>("skillSheets"),
          readCollection<SkillData>("skills"),
          readCollection<SpellData>("spells"),
        ]);
        setSheet(sheets.find((s) => s.id === id) ?? null);
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

                <div className="space-y-4">
                  {skills.length > 0 && (
                    <div>
                      <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
                        Skills
                      </div>
                      <ul className="flex flex-wrap gap-2">
                        {skills.map((skill) => {
                          const missingSkillData = !hasSkillData(skill);
                          return (
                          <li key={skill}>
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
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  {spells.length > 0 && (
                    <div>
                      <div className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">
                        Spells
                      </div>
                      <ul className="flex flex-wrap gap-2">
                        {spells.map((spell) => {
                          const missingSpellData = !hasSpellData(spell);
                          return (
                          <li key={spell}>
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
                          </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
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