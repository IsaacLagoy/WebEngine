"use client";

import { Skill, Spell } from "@/lib/firebase";
import DetailModal, { DisplayFieldConfig } from "@/app/components/modal/DetailModal";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function formatTargeting(spell: Spell): string {
  if (!spell.targeting) return "—";
  switch (spell.targeting.type) {
    case "aoe":    return `AoE — ${spell.targeting.range}ft radius`;
    case "cone":   return `Cone — ${spell.targeting.radius}ft`;
    case "chain":  return `Chain — ${spell.targeting.count} targets, ${spell.targeting.range}ft range`;
    case "single": return "Single target";
    case "self":   return "Self";
    default:       return "Unknown";
  }
}

// ------------------------------------------------------------
// Field configs
// ------------------------------------------------------------

const SKILL_FIELDS: DisplayFieldConfig[] = [
  { key: "name",        label: "Skill Name" },
  { key: "description", label: "Description" },
  { key: "rolls",       label: "Rolls" },
];

const SPELL_FIELDS: DisplayFieldConfig[] = [
  { key: "name",        label: "Spell Name" },
  { key: "description", label: "Description" },
  { key: "cost",        label: "MP Cost" },
  { key: "damaging",    label: "Damaging" },
  { key: "targeting",   label: "Targeting" },
];

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

type SkillSpellModalProps =
  | { type: "skill"; data: Skill | null; onClose: () => void }
  | { type: "spell"; data: Spell | null; onClose: () => void };

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function SkillSpellModal(props: SkillSpellModalProps) {
  const { type, data, onClose } = props;
  const isOpen = data !== null;

  if (type === "skill") {
    return (
      <DetailModal<Skill>
        isOpen={isOpen}
        onClose={onClose}
        title={data?.name || "Skill Details"}
        data={data}
        fields={SKILL_FIELDS}
      />
    );
  }

  // Spell — flatten nested fields before passing to DetailModal
  const displayData = data
    ? {
        ...data,
        cost: `${data.cost} MP`,
        damaging: data.damaging ? "Yes" : "No",
        targeting: formatTargeting(data),
      }
    : null;

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={data?.name || "Spell Details"}
      data={displayData}
      fields={SPELL_FIELDS}
    />
  );
}