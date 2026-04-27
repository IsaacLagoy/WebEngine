"use client";

import { Skill, Spell } from "@/lib/firebase";
import DetailModal, { DisplayFieldConfig } from "@/app/components/modal/DetailModal";
import { computeSpellDamage } from "@/app/dnd/utils/spellDamage";

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
  { key: "damage",      label: "Damage" },
  { key: "targeting",   label: "Targeting" },
];

const SPELL_FIELDS_NO_DAMAGE: DisplayFieldConfig[] = [
  { key: "name",        label: "Spell Name" },
  { key: "description", label: "Description" },
  { key: "cost",        label: "MP Cost" },
  { key: "targeting",   label: "Targeting" },
];

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

type SkillSpellModalProps =
  | { type: "skill"; data: Skill | null; onClose: () => void; level?: never }
  | { type: "spell"; data: Spell | null; onClose: () => void; level?: number };

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function SkillSpellModal(props: SkillSpellModalProps) {
  const { type, data, onClose, level } = props;
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

  // Compute dice string if level is provided
  const diceString = data && level !== undefined
    ? computeSpellDamage(data.damaging, data.targeting, level)
    : null;

  const displayData = data
    ? {
        ...data,
        cost: `${data.cost} MP`,
        targeting: formatTargeting(data),
        ...(diceString ? { damage: diceString } : {}),
      }
    : null;

  return (
    <DetailModal
      isOpen={isOpen}
      onClose={onClose}
      title={data?.name || "Spell Details"}
      data={displayData}
      fields={diceString ? SPELL_FIELDS : SPELL_FIELDS_NO_DAMAGE}
    />
  );
}