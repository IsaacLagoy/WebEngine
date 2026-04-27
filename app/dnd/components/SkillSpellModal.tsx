"use client";

import { Skill, SkillData, Spell, SpellData } from "@/lib/firebase";
import DetailModal, { DisplayFieldConfig } from "@/app/components/modal/DetailModal";
import { FieldConfig } from "@/app/components/modal/FormModal";
import { computeSpellDamage } from "@/app/dnd/utils/spellDamage";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function formatTargeting(targeting: SpellData["targeting"]): string {
  if (!targeting) return "—";
  switch (targeting.type) {
    case "aoe":    return `AoE — ${targeting.range}ft radius`;
    case "cone":   return `Cone — ${targeting.radius}ft`;
    case "chain":  return `Chain — ${targeting.count} targets, ${targeting.range}ft range`;
    case "single": return "Single target";
    case "self":   return "Self";
    default:       return "Unknown";
  }
}

// ------------------------------------------------------------
// Display field configs
// ------------------------------------------------------------

const SKILL_DISPLAY_FIELDS: DisplayFieldConfig[] = [
  { key: "name",        label: "Skill Name" },
  { key: "description", label: "Description" },
  { key: "rolls",       label: "Rolls" },
];

function getSpellDisplayFields(diceString: string | null): DisplayFieldConfig[] {
  const fields: DisplayFieldConfig[] = [
    { key: "name", label: "Spell Name" },
    { key: "description", label: "Description" },
    { key: "cost", label: "MP Cost", render: (value) => `${value} MP` },
    { key: "targeting", label: "Targeting", render: (value) => formatTargeting(value) },
  ];

  if (diceString) {
    fields.splice(3, 0, { key: "damage", label: "Damage", render: () => diceString });
  }

  return fields;
}

// ------------------------------------------------------------
// Edit field configs
// ------------------------------------------------------------

const SKILL_EDIT_FIELDS: FieldConfig[] = [
  { key: "name",        label: "Skill Name",   type: "text",   required: true },
  { key: "description", label: "Description",  type: "text" },
  { key: "rolls",       label: "Rolls",        type: "array",  placeholder: "e.g. int, str" },
];

const SPELL_EDIT_FIELDS: FieldConfig[] = [
  { key: "name",        label: "Spell Name",   type: "text",   required: true },
  { key: "description", label: "Description",  type: "text" },
  { key: "cost",        label: "MP Cost",      type: "number", required: true },
  {
    key: "damaging",
    label: "Damaging",
    type: "select",
    required: true,
    options: ["true", "false"],
  },
  {
    key: "targeting",
    label: "Targeting Type",
    type: "conditional",
    triggerKey: "damaging",
    triggerValue: "true",
    discriminatorKey: "type",
    discriminatorOptions: ["single", "aoe", "cone", "chain", "self"],
    subFields: {
      single: [],
      self:   [],
      aoe:    [{ key: "range",  label: "Range (ft)",    type: "number", required: true }],
      cone:   [{ key: "radius", label: "Radius (ft)",   type: "number", required: true }],
      chain:  [
        { key: "count", label: "Target Count", type: "number", required: true },
        { key: "range", label: "Range (ft)",   type: "number", required: true },
      ],
    },
  },
];

// ------------------------------------------------------------
// Props
// ------------------------------------------------------------

type SkillSpellModalProps =
  | {
      type: "skill";
      data: Skill | null;
      onClose: () => void;
      onSave?: (updated: SkillData, oldId: string) => Promise<void>;
      level?: never;
    }
  | {
      type: "spell";
      data: Spell | null;
      onClose: () => void;
      onSave?: (updated: SpellData, oldId: string) => Promise<void>;
      level?: number;
    };

// ------------------------------------------------------------
// Component
// ------------------------------------------------------------

export default function SkillSpellModal(props: SkillSpellModalProps) {
  const { type, data, onClose, onSave, level } = props;
  const isOpen = data !== null;

  if (type === "skill") {
    const handleSave = onSave
      ? async (updated: SkillData) => {
          await (onSave as (u: SkillData, id: string) => Promise<void>)(updated, data!.id);
        }
      : undefined;

    return (
      <DetailModal<Skill>
        isOpen={isOpen}
        onClose={onClose}
        title={data?.name || "Skill Details"}
        data={data}
        fields={SKILL_DISPLAY_FIELDS}
        editFields={onSave ? SKILL_EDIT_FIELDS : undefined}
        onSave={handleSave}
      />
    );
  }

  const diceString = data && level !== undefined
    ? computeSpellDamage(data.damaging, data.targeting, level)
    : null;

  const handleSave = onSave
    ? async (updated: SpellData) => {
        const coerced = {
          ...updated,
          damaging: updated.damaging === ("true" as any),
        };
        await (onSave as (u: SpellData, id: string) => Promise<void>)(coerced, data!.id);
      }
    : undefined;

  return (
    <DetailModal<SpellData>
      isOpen={isOpen}
      onClose={onClose}
      title={data?.name || "Spell Details"}
      data={data}
      fields={getSpellDisplayFields(diceString)}
      editFields={onSave ? SPELL_EDIT_FIELDS : undefined}
      onSave={handleSave}
    />
  );
}