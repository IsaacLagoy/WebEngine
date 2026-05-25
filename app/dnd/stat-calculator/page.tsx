"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Glass from "@/app/components/Glass";
import BaseModal from "@/app/components/modal/BaseModal";
import {
  ACCESSORY_ITEMS,
  AccessoryItem,
  ARMOR_MITIGATION_DEFINITIONS,
  ARMOR_PIECE_MOD_STAT_DEFINITIONS,
  ArmorMitigationKey,
  ArmorSlotLoadout,
  AccessoryLoadout,
  CharacterItemMod,
  BASE_STAT_DEFINITIONS,
  BaseStatKey,
  CharacterStats,
  ComputedCharacterTotals,
  CORE_STAT_DEFINITIONS,
  MODIFIABLE_STAT_DEFINITIONS,
  ModifiableStatKey,
  TOTAL_DEFENSE_DISPLAY_DEFINITIONS,
  formatModValue,
  formatPercentStat,
  getModStatLabel,
  computeCharacterTotals,
  computeIncomingDamage,
  createEmptyCharacterItems,
  createEmptyStats,
  createEmptyWeapon,
  isValidPositiveDamageInput,
  proficiencyThac0Deduction,
  PROFICIENCY_OPTIONS,
  ProficiencyTier,
  type IncomingDamageResult,
  WeaponData,
} from "@/app/dnd/utils/statCalculator";
import {
  ARMOR_PIECES,
  materialToPieceMitigation,
  type ArmorPiece,
} from "@/app/dnd/utils/armorUtils";
import {
  readCollection,
  type ArmorMaterial,
  type ArmorMaterialData,
  type WeaponMaterial,
  type WeaponMaterialData,
} from "@/lib/firebase";
import {
  CharacterSaveData,
  createCharacter,
  characterNameExists,
  deleteCharacter,
  listCharacterNames,
  loadCharacter,
  saveCharacter,
} from "@/app/dnd/utils/characterStorage";

const INPUT_CLASS =
  "w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40";

const INPUT_INVALID_CLASS =
  "w-full px-4 py-2 rounded-lg text-white placeholder-white/50 focus:outline-none border-2 !border-red-500 !bg-red-600/30 focus:!border-red-400 focus:ring-2 focus:ring-red-500/40";

const BUTTON_CLASS =
  "px-6 py-3 rounded-lg font-semibold text-white bg-blue-600/60 hover:bg-blue-600 transition-colors";

const CANCEL_BUTTON_CLASS =
  "px-6 py-3 rounded-lg font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/20 transition-colors";

const DELETE_BUTTON_CLASS =
  "px-6 py-3 rounded-lg font-semibold text-white transition-colors border-2 border-red-500 !bg-red-600 hover:!bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/50";

function isValidStatInput(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed === "") return false;
  return Number.isFinite(Number(trimmed));
}

function baseStatsToInputStrings(stats: CharacterStats): Record<BaseStatKey, string> {
  const inputs = {} as Record<BaseStatKey, string>;
  for (const { key } of BASE_STAT_DEFINITIONS) {
    inputs[key] = String(stats[key]);
  }
  return inputs;
}

function armorSlotsToInputStrings(
  slots: ArmorSlotLoadout
): Record<ArmorPiece, Record<ArmorMitigationKey, string>> {
  const inputs = {} as Record<ArmorPiece, Record<ArmorMitigationKey, string>>;
  for (const piece of ARMOR_PIECES) {
    const pieceInputs = {} as Record<ArmorMitigationKey, string>;
    for (const { key } of ARMOR_MITIGATION_DEFINITIONS) {
      pieceInputs[key] = String(slots[piece][key]);
    }
    inputs[piece] = pieceInputs;
  }
  return inputs;
}

function StatInput({
  label,
  value,
  invalid,
  onChange,
}: {
  label: string;
  value: string;
  invalid: boolean;
  onChange: (raw: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-white/50 text-xs uppercase tracking-wide">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        aria-invalid={invalid}
        className={invalid ? INPUT_INVALID_CLASS : INPUT_CLASS}
        style={
          invalid
            ? { borderColor: "#ef4444", backgroundColor: "rgba(185, 28, 28, 0.35)" }
            : undefined
        }
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TotalStatsHeader({ totals }: { totals: ComputedCharacterTotals }) {
  const alwaysVisibleDefense = TOTAL_DEFENSE_DISPLAY_DEFINITIONS.filter(
    ({ key }) => key === "damage_reduction" || key === "armor_damage_reduction"
  );
  const optionalDefense = TOTAL_DEFENSE_DISPLAY_DEFINITIONS.filter(
    ({ key }) =>
      key !== "damage_reduction" &&
      key !== "armor_damage_reduction" &&
      totals[key] !== 0
  );
  const visibleDefense = [...alwaysVisibleDefense, ...optionalDefense];

  return (
    <Glass className="p-6">
      <h2 className="text-white/80 text-sm uppercase tracking-wide mb-4">
        Total Stats
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {CORE_STAT_DEFINITIONS.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-white/50 text-xs uppercase tracking-wide">
              {label}
            </span>
            <span className="text-white font-bold text-xl tabular-nums">
              {totals[key]}
            </span>
          </div>
        ))}
        {visibleDefense.map(({ key, label }) => (
          <div key={key} className="flex flex-col gap-1">
            <span className="text-white/50 text-xs uppercase tracking-wide">
              {label}
            </span>
            <span
              className={`font-bold text-xl tabular-nums ${
                key === "damage_reduction" ? "text-red-400" : "text-white"
              }`}
            >
              {formatPercentStat(totals[key])}
            </span>
          </div>
        ))}
      </div>
    </Glass>
  );
}

function formatDamageAmount(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function IncomingDamageModal({
  isOpen,
  onClose,
  damageReductionPercent,
  armorDamageReductionPercent,
}: {
  isOpen: boolean;
  onClose: () => void;
  damageReductionPercent: number;
  armorDamageReductionPercent: number;
}) {
  const [damageInput, setDamageInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IncomingDamageResult | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setDamageInput("");
    setError(null);
    setResult(null);
  }, [isOpen]);

  function handleCompute() {
    if (!isValidPositiveDamageInput(damageInput)) {
      setError("Enter a positive number.");
      return;
    }
    const incoming = Number(damageInput.trim());
    setResult(
      computeIncomingDamage(
        incoming,
        damageReductionPercent,
        armorDamageReductionPercent
      )
    );
    setError(null);
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Compute Incoming Damage"
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        <StatInput
          label="Incoming damage"
          value={damageInput}
          invalid={
            damageInput !== "" && !isValidPositiveDamageInput(damageInput)
          }
          onChange={(raw) => {
            setDamageInput(raw);
            setError(null);
            setResult(null);
          }}
        />
        {error && <p className="text-red-300 text-sm">{error}</p>}

        {result && (
          <div className="flex flex-col gap-4 pt-2 border-t border-white/10">
            <p className="text-white/50 text-xs uppercase tracking-wide">
              Resistance rolls (d100)
            </p>
            {result.steps.map((step) => (
              <div
                key={step.label}
                className="rounded-lg bg-white/5 border border-white/10 p-4 flex flex-col gap-2 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="text-white font-medium">{step.label}</span>
                  <span className="text-white/50">
                    {formatPercentStat(step.resistancePercent)} resistance
                  </span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Roll</span>
                  <span className="font-bold tabular-nums text-white">{step.roll}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>Result</span>
                  <span
                    className={
                      step.applied ? "text-green-400 font-medium" : "text-white/50"
                    }
                  >
                    {step.applied
                      ? `Applied — ${formatDamageAmount(step.damageBefore)} − ${step.roll} → ${formatDamageAmount(step.damageAfter)}`
                      : "Not applied"}
                  </span>
                </div>
              </div>
            ))}
            <div className="rounded-lg bg-blue-600/20 border border-blue-500/30 p-4 flex justify-between items-center">
              <span className="text-white font-semibold">Final damage</span>
              <span className="text-white font-bold text-2xl tabular-nums">
                {formatDamageAmount(result.finalDamage)}
              </span>
            </div>
            <p className="text-white/40 text-xs">
              Started at {formatDamageAmount(result.incomingDamage)}. When a d100 roll
              is at or under that resistance percentage, damage is reduced by the roll
              amount (not the %), applied in order.
            </p>
          </div>
        )}

        <button type="button" onClick={handleCompute} className={BUTTON_CLASS}>
          Compute
        </button>
      </div>
    </BaseModal>
  );
}

function BaseStatsForm({
  inputs,
  onChange,
}: {
  inputs: Record<BaseStatKey, string>;
  onChange: (key: BaseStatKey, raw: string) => void;
}) {
  return (
    <Glass className="p-6">
      <h2 className="text-white/80 text-sm uppercase tracking-wide mb-4">
        Base Stats
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {BASE_STAT_DEFINITIONS.map(({ key, label }) => (
          <StatInput
            key={key}
            label={label}
            value={inputs[key]}
            invalid={!isValidStatInput(inputs[key])}
            onChange={(raw) => onChange(key, raw)}
          />
        ))}
      </div>
    </Glass>
  );
}

type ModModalTarget =
  | { kind: "armor"; piece: ArmorPiece }
  | { kind: "weapon" }
  | { kind: "accessory"; item: AccessoryItem };

function AddModModal({
  isOpen,
  target,
  existingMods,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  target: ModModalTarget | null;
  existingMods: CharacterItemMod[];
  onClose: () => void;
  onAdd: (stat: ModifiableStatKey, value: number) => void;
}) {
  const allowAnyStat = target?.kind === "accessory";
  const availableStats = allowAnyStat
    ? MODIFIABLE_STAT_DEFINITIONS
    : ARMOR_PIECE_MOD_STAT_DEFINITIONS.filter(
        (d) => !existingMods.some((m) => m.stat === d.key)
      );
  const [selectedStat, setSelectedStat] = useState<ModifiableStatKey | "">("");
  const [valueInput, setValueInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const modalTitle =
    target?.kind === "armor"
      ? `${target.piece} — Add Mod`
      : target?.kind === "weapon"
        ? "Weapon — Add Mod"
        : target?.kind === "accessory"
          ? `${target.item} — Add Mod`
          : "Add Mod";

  useEffect(() => {
    if (!isOpen) return;
    setSelectedStat(availableStats[0]?.key ?? "");
    setValueInput("");
    setError(null);
  }, [isOpen, target, allowAnyStat, existingMods]);

  function handleAdd() {
    if (!selectedStat) {
      setError("Select a stat.");
      return;
    }
    if (!isValidStatInput(valueInput)) {
      setError("Enter a valid number.");
      return;
    }
    onAdd(selectedStat, Number(valueInput.trim()));
    onClose();
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="md"
    >
      {availableStats.length === 0 ? (
        <p className="text-white/50 text-sm">All stat mods are already on this item.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-white/50 text-xs uppercase tracking-wide">Stat</span>
            <select
              className={INPUT_CLASS}
              value={selectedStat}
              onChange={(e) => {
                setSelectedStat(e.target.value as ModifiableStatKey);
                setError(null);
              }}
            >
              {availableStats.map(({ key, label }) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <StatInput
            label="Value"
            value={valueInput}
            invalid={valueInput !== "" && !isValidStatInput(valueInput)}
            onChange={(raw) => {
              setValueInput(raw);
              setError(null);
            }}
          />
          {error && <p className="text-red-300 text-sm">{error}</p>}
          <button type="button" onClick={handleAdd} className={BUTTON_CLASS}>
            Add Mod
          </button>
        </div>
      )}
    </BaseModal>
  );
}

type MaterialClassFilter = "all" | "light" | "heavy";

const CLASS_FILTERS: { id: MaterialClassFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "light", label: "Light" },
  { id: "heavy", label: "Heavy" },
];

function WeaponMaterialModal({
  isOpen,
  materials,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  materials: WeaponMaterial[];
  onClose: () => void;
  onSelect: (material: WeaponMaterial) => void;
}) {
  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => a.price - b.price),
    [materials]
  );

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Weapon — Select Material"
      maxWidth="md"
    >
      {sortedMaterials.length === 0 ? (
        <p className="text-white/50 text-sm">No materials found.</p>
      ) : (
        <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {sortedMaterials.map((material) => (
            <li key={material.id}>
              <button
                type="button"
                onClick={() => onSelect(material)}
                className="w-full text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <span className="font-medium capitalize">{material.id}</span>
                {material.thac0 !== 0 && (
                  <span className="text-white/50 text-sm ml-2">
                    THAC0 {material.thac0}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </BaseModal>
  );
}

function WeaponForm({
  weapon,
  selectedMaterialName,
  onOpenMaterialModal,
  onClearMaterial,
  onAddMod,
  onRemoveMod,
}: {
  weapon: WeaponData;
  selectedMaterialName: string | null;
  onOpenMaterialModal: () => void;
  onClearMaterial: () => void;
  onAddMod: () => void;
  onRemoveMod: (modId: string) => void;
}) {
  return (
    <Glass className="p-6 flex flex-col gap-4">
      <h2 className="text-white/80 text-sm uppercase tracking-wide">Weapon</h2>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-white/50 text-xs uppercase tracking-wide">
            Material
          </span>
          <span className="text-white font-medium">
            {selectedMaterialName ?? "None selected"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenMaterialModal}
            className={`${BUTTON_CLASS} text-sm`}
          >
            Select material
          </button>
          {weapon.materialId && (
            <button
              type="button"
              onClick={onClearMaterial}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white/70 bg-white/10 hover:bg-white/20 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onAddMod}
            className={`${BUTTON_CLASS} text-sm`}
          >
            Add mod
          </button>
        </div>
      </div>
      {weapon.mods.length === 0 ? (
        <p className="text-white/30 text-sm italic">No mods yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {weapon.mods.map((mod) => (
            <li
              key={mod.id}
              className="flex items-center justify-between text-sm text-white/80"
            >
              <span>
                <span className="text-white font-medium">
                  {getModStatLabel(mod.stat)}
                </span>
                : {formatModValue(mod.stat, mod.value)}
              </span>
              <button
                type="button"
                onClick={() => onRemoveMod(mod.id)}
                className="text-white/40 hover:text-white/80 text-xs transition-colors"
              >
                remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </Glass>
  );
}

function ProficiencyForm({
  proficiency,
  onChange,
}: {
  proficiency: ProficiencyTier;
  onChange: (tier: ProficiencyTier) => void;
}) {
  return (
    <Glass className="p-6 flex flex-col gap-4">
      <h2 className="text-white/80 text-sm uppercase tracking-wide">
        Proficiency
      </h2>
      <p className="text-white/40 text-xs">
        Each tier above None subtracts 1 from total THAC0.
      </p>
      <div className="flex flex-wrap gap-2">
        {PROFICIENCY_OPTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              proficiency === id
                ? "bg-blue-600/80 text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {label}
            {id !== "none" && (
              <span className="text-white/50 ml-1.5">−{proficiencyThac0Deduction(id)}</span>
            )}
          </button>
        ))}
      </div>
    </Glass>
  );
}

function ArmorMaterialPresetModal({
  isOpen,
  piece,
  materials,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  piece: ArmorPiece | null;
  materials: ArmorMaterial[];
  onClose: () => void;
  onSelect: (material: ArmorMaterial) => void;
}) {
  const [classFilter, setClassFilter] = useState<MaterialClassFilter>("all");

  useEffect(() => {
    if (isOpen) setClassFilter("all");
  }, [isOpen, piece]);

  const filteredMaterials = useMemo(() => {
    const list =
      classFilter === "all"
        ? materials
        : materials.filter((m) => m.class === classFilter);
    return [...list].sort((a, b) => a.full_price - b.full_price);
  }, [materials, classFilter]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={piece ? `${piece} — Material Preset` : "Material Preset"}
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          {CLASS_FILTERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setClassFilter(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                classFilter === id
                  ? "bg-blue-600/80 text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {filteredMaterials.length === 0 ? (
          <p className="text-white/50 text-sm">No materials found.</p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {filteredMaterials.map((material) => (
              <li key={material.id}>
                <button
                  type="button"
                  onClick={() => onSelect(material)}
                  className="w-full text-left px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                >
                  <span className="font-medium capitalize">{material.id}</span>
                  <span className="text-white/50 text-sm ml-2">
                    ({material.class})
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </BaseModal>
  );
}

function ArmorPiecesForm({
  armorSlots,
  mitigationInputs,
  onMitigationChange,
  onOpenPreset,
  onAddMod,
  onRemoveMod,
}: {
  armorSlots: ArmorSlotLoadout;
  mitigationInputs: Record<ArmorPiece, Record<ArmorMitigationKey, string>>;
  onMitigationChange: (
    piece: ArmorPiece,
    key: ArmorMitigationKey,
    raw: string
  ) => void;
  onOpenPreset: (piece: ArmorPiece) => void;
  onAddMod: (piece: ArmorPiece) => void;
  onRemoveMod: (piece: ArmorPiece, modId: string) => void;
}) {
  return (
    <Glass className="p-6 flex flex-col gap-6">
      <h2 className="text-white/80 text-sm uppercase tracking-wide">Armor</h2>
      {ARMOR_PIECES.map((piece) => (
        <div key={piece} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-white font-semibold">{piece}</h3>
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onOpenPreset(piece)}
                className={`${BUTTON_CLASS} text-sm`}
              >
                Select from preset
              </button>
              <button
                type="button"
                onClick={() => onAddMod(piece)}
                className={`${BUTTON_CLASS} text-sm`}
              >
                Add mod
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ARMOR_MITIGATION_DEFINITIONS.map(({ key, label }) => (
              <StatInput
                key={key}
                label={label}
                value={mitigationInputs[piece][key]}
                invalid={!isValidStatInput(mitigationInputs[piece][key])}
                onChange={(raw) => onMitigationChange(piece, key, raw)}
              />
            ))}
          </div>
          {armorSlots[piece].mods.length === 0 ? (
            <p className="text-white/30 text-sm italic">No mods yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {armorSlots[piece].mods.map((mod) => (
                <li
                  key={mod.id}
                  className="flex items-center justify-between text-sm text-white/80"
                >
                  <span>
                    <span className="text-white font-medium">
                      {getModStatLabel(mod.stat)}
                    </span>
                    : {formatModValue(mod.stat, mod.value)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveMod(piece, mod.id)}
                    className="text-white/40 hover:text-white/80 text-xs transition-colors"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </Glass>
  );
}

function AccessoriesForm({
  accessories,
  onAddMod,
  onRemoveMod,
}: {
  accessories: AccessoryLoadout;
  onAddMod: (item: AccessoryItem) => void;
  onRemoveMod: (item: AccessoryItem, modId: string) => void;
}) {
  return (
    <Glass className="p-6 flex flex-col gap-6">
      <h2 className="text-white/80 text-sm uppercase tracking-wide">
        Ring &amp; Amulet
      </h2>
      {ACCESSORY_ITEMS.map((item) => (
        <div key={item} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-white font-semibold">{item}</h3>
            <button
              type="button"
              onClick={() => onAddMod(item)}
              className={`${BUTTON_CLASS} text-sm shrink-0`}
            >
              Add mod
            </button>
          </div>
          {accessories[item].mods.length === 0 ? (
            <p className="text-white/30 text-sm italic">No mods yet.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {accessories[item].mods.map((mod) => (
                <li
                  key={mod.id}
                  className="flex items-center justify-between text-sm text-white/80"
                >
                  <span>
                    <span className="text-white font-medium">
                      {getModStatLabel(mod.stat)}
                    </span>
                    : {formatModValue(mod.stat, mod.value)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveMod(item, mod.id)}
                    className="text-white/40 hover:text-white/80 text-xs transition-colors"
                  >
                    remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </Glass>
  );
}

function CharacterActionButtons({
  onNewCharacter,
  onLoadCharacter,
  className = "",
}: {
  onNewCharacter: () => void;
  onLoadCharacter: () => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-col sm:flex-row gap-2 shrink-0 ${className}`}>
      <button type="button" onClick={onNewCharacter} className={BUTTON_CLASS}>
        New Character
      </button>
      <button type="button" onClick={onLoadCharacter} className={BUTTON_CLASS}>
        Load Character
      </button>
    </div>
  );
}

function CharacterLanding({
  onNewCharacter,
  onLoadCharacter,
}: {
  onNewCharacter: () => void;
  onLoadCharacter: () => void;
}) {
  return (
    <CharacterActionButtons
      onNewCharacter={onNewCharacter}
      onLoadCharacter={onLoadCharacter}
      className="justify-center py-16"
    />
  );
}

function NewCharacterModal({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName("");
      setError(null);
    }
  }, [isOpen]);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a character name.");
      return;
    }
    if (characterNameExists(trimmed)) {
      setError("A character with this name already exists.");
      return;
    }
    try {
      createCharacter(trimmed);
      onCreated(trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create character.");
    }
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="New Character" maxWidth="md">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-white/50 text-xs uppercase tracking-wide">
            Name
          </span>
          <input
            type="text"
            className={INPUT_CLASS}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            placeholder="Character name"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
        </label>
        {error && <p className="text-red-300 text-sm">{error}</p>}
        <button type="button" onClick={handleCreate} className={BUTTON_CLASS}>
          Create Character
        </button>
      </div>
    </BaseModal>
  );
}

function LoadCharacterModal({
  isOpen,
  onClose,
  onLoaded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onLoaded: (name: string) => void;
}) {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setNames(listCharacterNames());
  }, [isOpen]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Load Character" maxWidth="md">
      {names.length === 0 ? (
        <p className="text-white/50 text-sm">No saved characters yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {names.map((name) => (
            <li key={name}>
              <button
                type="button"
                onClick={() => {
                  onLoaded(name);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors font-medium"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </BaseModal>
  );
}

function DeleteButton({
  children,
  onClick,
  className = "",
}: {
  children: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${DELETE_BUTTON_CLASS} ${className}`}
      style={{ backgroundColor: "#dc2626" }}
    >
      {children}
    </button>
  );
}

function DeleteCharacterModal({
  isOpen,
  characterName,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  characterName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Character"
      titleClassName="text-red-400"
      maxWidth="md"
    >
      <p className="text-white/80 text-sm leading-relaxed">
        Delete <span className="font-semibold text-red-300">{characterName}</span>?
        This cannot be undone.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mt-6">
        <button type="button" onClick={onClose} className={CANCEL_BUTTON_CLASS}>
          Cancel
        </button>
        <DeleteButton onClick={onConfirm}>Delete Character</DeleteButton>
      </div>
    </BaseModal>
  );
}

function createEmptyCharacterData(): CharacterSaveData {
  const emptyItems = createEmptyCharacterItems();
  return {
    baseStats: createEmptyStats(),
    weapon: createEmptyWeapon(),
    proficiency: "none",
    armorSlots: emptyItems.armorSlots,
    accessories: emptyItems.accessories,
  };
}

export default function StatCalculatorPage() {
  const [activeCharacterName, setActiveCharacterName] = useState<string | null>(
    null
  );
  const [baseStats, setBaseStats] = useState<CharacterStats>(createEmptyStats);
  const emptyItems = createEmptyCharacterItems();
  const [armorSlots, setArmorSlots] = useState(() => emptyItems.armorSlots);
  const [armorMitigationInputs, setArmorMitigationInputs] = useState(() =>
    armorSlotsToInputStrings(emptyItems.armorSlots)
  );
  const [accessories, setAccessories] = useState(() => emptyItems.accessories);
  const [weapon, setWeapon] = useState(() => createEmptyWeapon());
  const [proficiency, setProficiency] = useState<ProficiencyTier>("none");
  const [statInputs, setStatInputs] = useState<Record<BaseStatKey, string>>(() =>
    baseStatsToInputStrings(createEmptyStats())
  );
  const [addModModalTarget, setAddModModalTarget] = useState<ModModalTarget | null>(
    null
  );
  const [presetModalPiece, setPresetModalPiece] = useState<ArmorPiece | null>(
    null
  );
  const [isWeaponMaterialModalOpen, setIsWeaponMaterialModalOpen] = useState(false);
  const [armorMaterials, setArmorMaterials] = useState<ArmorMaterial[]>([]);
  const [weaponMaterials, setWeaponMaterials] = useState<WeaponMaterial[]>([]);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isIncomingDamageModalOpen, setIsIncomingDamageModalOpen] = useState(false);

  const selectedWeaponMaterial = useMemo(
    () =>
      weapon.materialId
        ? weaponMaterials.find((m) => m.id === weapon.materialId) ?? null
        : null,
    [weapon.materialId, weaponMaterials]
  );

  const weaponMaterialThac0 = selectedWeaponMaterial?.thac0 ?? 0;

  const totals = useMemo(
    () =>
      computeCharacterTotals(
        baseStats,
        armorSlots,
        accessories,
        weapon,
        proficiency,
        weaponMaterialThac0
      ),
    [baseStats, armorSlots, accessories, weapon, proficiency, weaponMaterialThac0]
  );
  const hasCharacter = activeCharacterName !== null;

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      readCollection<ArmorMaterialData>("armor_materials"),
      readCollection<WeaponMaterialData>("weapon_materials"),
    ])
      .then(([armorData, weaponData]) => {
        if (cancelled) return;
        setArmorMaterials(armorData);
        setWeaponMaterials(weaponData);
      })
      .catch((err) => console.error("Error loading materials:", err));
    return () => {
      cancelled = true;
    };
  }, []);

  const persistCharacter = useCallback(
    (data: CharacterSaveData) => {
      if (!activeCharacterName) return;
      saveCharacter(activeCharacterName, data);
    },
    [activeCharacterName]
  );

  useEffect(() => {
    if (!activeCharacterName) return;
    persistCharacter({ baseStats, weapon, proficiency, armorSlots, accessories });
  }, [
    activeCharacterName,
    baseStats,
    weapon,
    proficiency,
    armorSlots,
    accessories,
    persistCharacter,
  ]);

  function applyCharacterData(data: CharacterSaveData) {
    setBaseStats(data.baseStats);
    setWeapon(data.weapon);
    setProficiency(data.proficiency);
    setArmorSlots(data.armorSlots);
    setArmorMitigationInputs(armorSlotsToInputStrings(data.armorSlots));
    setAccessories(data.accessories);
    setStatInputs(baseStatsToInputStrings(data.baseStats));
  }

  function makeModId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `mod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function handleAddMod(stat: ModifiableStatKey, value: number) {
    if (!addModModalTarget) return;
    const mod: CharacterItemMod = { id: makeModId(), stat, value };
    if (addModModalTarget.kind === "armor") {
      const piece = addModModalTarget.piece;
      setArmorSlots((prev) => ({
        ...prev,
        [piece]: { ...prev[piece], mods: [...prev[piece].mods, mod] },
      }));
    } else if (addModModalTarget.kind === "weapon") {
      setWeapon((prev) => ({
        ...prev,
        mods: [...prev.mods, mod],
      }));
    } else {
      const item = addModModalTarget.item;
      setAccessories((prev) => ({
        ...prev,
        [item]: { mods: [...prev[item].mods, mod] },
      }));
    }
    setAddModModalTarget(null);
  }

  function handleRemoveWeaponMod(modId: string) {
    setWeapon((prev) => ({
      ...prev,
      mods: prev.mods.filter((m) => m.id !== modId),
    }));
  }

  function handleRemoveArmorMod(piece: ArmorPiece, modId: string) {
    setArmorSlots((prev) => ({
      ...prev,
      [piece]: { ...prev[piece], mods: prev[piece].mods.filter((m) => m.id !== modId) },
    }));
  }

  function handleRemoveAccessoryMod(item: AccessoryItem, modId: string) {
    setAccessories((prev) => ({
      ...prev,
      [item]: { mods: prev[item].mods.filter((m) => m.id !== modId) },
    }));
  }

  function handleArmorMitigationChange(
    piece: ArmorPiece,
    key: ArmorMitigationKey,
    raw: string
  ) {
    setArmorMitigationInputs((prev) => ({
      ...prev,
      [piece]: { ...prev[piece], [key]: raw },
    }));
    if (!isValidStatInput(raw)) return;
    const value = Number(raw.trim());
    setArmorSlots((prev) => ({
      ...prev,
      [piece]: { ...prev[piece], [key]: value },
    }));
  }

  function handleApplyMaterialPreset(material: ArmorMaterial) {
    if (!presetModalPiece) return;
    const piece = presetModalPiece;
    const mitigation = materialToPieceMitigation(material, piece);
    setArmorSlots((prev) => ({
      ...prev,
      [piece]: { ...mitigation, mods: prev[piece].mods },
    }));
    const pieceInputs = {} as Record<ArmorMitigationKey, string>;
    for (const { key } of ARMOR_MITIGATION_DEFINITIONS) {
      pieceInputs[key] = String(mitigation[key]);
    }
    setArmorMitigationInputs((prev) => ({
      ...prev,
      [piece]: pieceInputs,
    }));
    setPresetModalPiece(null);
  }

  function handleBaseStatInputChange(key: BaseStatKey, raw: string) {
    setStatInputs((prev) => ({ ...prev, [key]: raw }));
    if (!isValidStatInput(raw)) return;

    const value = Number(raw.trim());
    setBaseStats((prev) => ({ ...prev, [key]: value }));
  }

  function handleCharacterCreated(name: string) {
    const saved = loadCharacter(name);
    setActiveCharacterName(name);
    applyCharacterData(
      saved
        ? {
            baseStats: saved.baseStats,
            weapon: saved.weapon,
            proficiency: saved.proficiency,
            armorSlots: saved.armorSlots,
            accessories: saved.accessories,
          }
        : createEmptyCharacterData()
    );
  }

  function handleCharacterLoaded(name: string) {
    const saved = loadCharacter(name);
    if (!saved) return;
    setActiveCharacterName(saved.name);
    applyCharacterData({
      baseStats: saved.baseStats,
      weapon: saved.weapon,
      proficiency: saved.proficiency,
      armorSlots: saved.armorSlots,
      accessories: saved.accessories,
    });
  }

  function handleDeleteCharacter() {
    if (!activeCharacterName) return;
    deleteCharacter(activeCharacterName);
    setIsDeleteModalOpen(false);
    setActiveCharacterName(null);
    applyCharacterData(createEmptyCharacterData());
  }

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        {hasCharacter && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                Stat Calculator
              </h1>
              {activeCharacterName && (
                <p className="text-white/50 text-sm mt-1">{activeCharacterName}</p>
              )}
            </div>
            <CharacterActionButtons
              onNewCharacter={() => setIsNewModalOpen(true)}
              onLoadCharacter={() => setIsLoadModalOpen(true)}
            />
          </div>
        )}

        {!hasCharacter ? (
          <CharacterLanding
            onNewCharacter={() => setIsNewModalOpen(true)}
            onLoadCharacter={() => setIsLoadModalOpen(true)}
          />
        ) : (
          <>
            <TotalStatsHeader totals={totals} />
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setIsIncomingDamageModalOpen(true)}
                className={BUTTON_CLASS}
              >
                Compute incoming damage
              </button>
            </div>
            <BaseStatsForm inputs={statInputs} onChange={handleBaseStatInputChange} />
            <WeaponForm
              weapon={weapon}
              selectedMaterialName={
                selectedWeaponMaterial?.name ?? selectedWeaponMaterial?.id ?? null
              }
              onOpenMaterialModal={() => setIsWeaponMaterialModalOpen(true)}
              onClearMaterial={() =>
                setWeapon((prev) => ({ ...prev, materialId: null }))
              }
              onAddMod={() => setAddModModalTarget({ kind: "weapon" })}
              onRemoveMod={handleRemoveWeaponMod}
            />
            <ProficiencyForm
              proficiency={proficiency}
              onChange={setProficiency}
            />
            <ArmorPiecesForm
              armorSlots={armorSlots}
              mitigationInputs={armorMitigationInputs}
              onMitigationChange={handleArmorMitigationChange}
              onOpenPreset={setPresetModalPiece}
              onAddMod={(piece) =>
                setAddModModalTarget({ kind: "armor", piece })
              }
              onRemoveMod={handleRemoveArmorMod}
            />
            <AccessoriesForm
              accessories={accessories}
              onAddMod={(item) =>
                setAddModModalTarget({ kind: "accessory", item })
              }
              onRemoveMod={handleRemoveAccessoryMod}
            />
            <div className="flex justify-center pt-4">
              <DeleteButton onClick={() => setIsDeleteModalOpen(true)}>
                Delete Character
              </DeleteButton>
            </div>
          </>
        )}
      </div>

      <NewCharacterModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreated={handleCharacterCreated}
      />
      <LoadCharacterModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoaded={handleCharacterLoaded}
      />
      {activeCharacterName && (
        <DeleteCharacterModal
          isOpen={isDeleteModalOpen}
          characterName={activeCharacterName}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteCharacter}
        />
      )}
      <AddModModal
        isOpen={addModModalTarget !== null}
        target={addModModalTarget}
        existingMods={
          addModModalTarget?.kind === "armor"
            ? armorSlots[addModModalTarget.piece].mods
            : addModModalTarget?.kind === "weapon"
              ? weapon.mods
              : addModModalTarget?.kind === "accessory"
                ? accessories[addModModalTarget.item].mods
                : []
        }
        onClose={() => setAddModModalTarget(null)}
        onAdd={handleAddMod}
      />
      <WeaponMaterialModal
        isOpen={isWeaponMaterialModalOpen}
        materials={weaponMaterials}
        onClose={() => setIsWeaponMaterialModalOpen(false)}
        onSelect={(material) => {
          setWeapon((prev) => ({ ...prev, materialId: material.id }));
          setIsWeaponMaterialModalOpen(false);
        }}
      />
      <ArmorMaterialPresetModal
        isOpen={presetModalPiece !== null}
        piece={presetModalPiece}
        materials={armorMaterials}
        onClose={() => setPresetModalPiece(null)}
        onSelect={handleApplyMaterialPreset}
      />
      <IncomingDamageModal
        isOpen={isIncomingDamageModalOpen}
        onClose={() => setIsIncomingDamageModalOpen(false)}
        damageReductionPercent={totals.damage_reduction}
        armorDamageReductionPercent={totals.armor_damage_reduction}
      />
    </main>
  );
}
