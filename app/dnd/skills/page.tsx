"use client";

import { useEffect, useState, useCallback } from "react";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";
import { Skill, SkillData, readCollection, addToCollection, removeFromCollection } from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import FormModal, { FieldConfig } from "@/app/components/modal/FormModal";
import DetailModal, { DisplayFieldConfig } from "@/app/components/modal/DetailModal";

// ------------------------------------------------------------
// Field configs
// ------------------------------------------------------------

const SKILL_FIELDS: FieldConfig[] = [
  {
    key: "name",
    label: "Skill Name",
    type: "text",
    required: true,
    placeholder: "e.g., Infrared Vision",
  },
  {
    key: "description",
    label: "Description",
    type: "text",
    placeholder: "What does this skill do?",
  },
  {
    key: "rolls",
    label: "Rolls",
    type: "array",
    placeholder: "Enter stat abbreviation (e.g., int, str)",
  },
];

const SKILL_DISPLAY_FIELDS: DisplayFieldConfig[] = [
  { key: "name",        label: "Skill Name" },
  { key: "description", label: "Description" },
  { key: "rolls",       label: "Rolls" },
];

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const isAdmin = useIsAdmin();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  const loadSkills = useCallback(async () => {
    try {
      const data = await readCollection<SkillData>("skills");
      setSkills(data);
    } catch (err: any) {
      console.error("Error loading skills:", err);
      if (err?.code === "permission-denied") {
        console.error("Firestore permission denied. Please update your Firestore security rules.");
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  async function handleAddSkill(data: SkillData) {
    const skillId = data.name.toLowerCase().replace(/\s+/g, "-");
    try {
      await addToCollection("skills", data, skillId);
      await loadSkills();
    } catch (err: any) {
      console.error("Error adding skill:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to add skills.");
      }
      throw err;
    }
  }

  async function handleDeleteSkill(skillId: string) {
    try {
      await removeFromCollection("skills", skillId);
      await loadSkills();
    } catch (err: any) {
      console.error("Error deleting skill:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to delete skills.");
      }
      throw err;
    }
  }

  async function handleSaveSkill(updated: SkillData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("skills", oldId);
    await addToCollection("skills", updated, newId);
    await loadSkills();
    setSelectedSkill({ ...updated, id: newId });
  }

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  return (
    <main className="min-h-screen pt-24 px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Skills
          </h1>
          {isAdmin ? (
            <div className="flex gap-4 mb-8">
              <button
                onClick={() => setIsFormModalOpen(true)}
                className="bg-blue-600/60 hover:bg-blue-600 transition-all"
              >
                <Glass className="px-6 py-3 text-white font-semibold border">
                  Add
                </Glass>
              </button>
            </div>
          ) : (
            <div />
          )}
        </div>

        {initialLoading ? (
          <div className="text-white/70 text-lg">Loading skills...</div>
        ) : skills.length === 0 ? (
          <div className="text-white/70 text-lg">
            No skills found. Click "Add" to create one.
          </div>
        ) : (
          <ul className="space-y-3">
            {skills.map((skill) => (
              <li key={skill.id}>
                <Glass
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between relative"
                  onClick={() => handleSkillClick(skill)}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-white font-semibold text-lg">
                      {skill.name}
                    </div>
                    {skill.rolls.length > 0 && (
                      <div className="flex gap-1">
                        {skill.rolls.map((roll) => (
                          <span
                            key={roll}
                            className="text-white/50 text-xs font-mono uppercase bg-white/10 px-2 py-0.5 rounded"
                          >
                            {roll}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSkill(skill.id);
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

      <FormModal<SkillData>
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleAddSkill}
        title="Add Skill"
        fields={SKILL_FIELDS}
      />

      <DetailModal<Skill>
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedSkill?.name || "Skill Details"}
        data={selectedSkill}
        fields={SKILL_DISPLAY_FIELDS}
        editFields={isAdmin ? SKILL_FIELDS : undefined}
        onSave={isAdmin ? (updated) => handleSaveSkill(updated, selectedSkill!.id) : undefined}
      />
    </main>
  );
}