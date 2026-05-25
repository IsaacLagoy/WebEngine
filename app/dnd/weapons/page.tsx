"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Enchantment,
  EnchantmentData,
  WeaponMaterial,
  WeaponMaterialData,
  MagicElementData,
  readCollection,
  addToCollection,
  removeFromCollection,
} from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import FormModal, { FieldConfig } from "@/app/components/modal/FormModal";
import EnchantmentFormFields, {
  FormFieldsState,
  defaultFormFieldsState,
} from "@/app/dnd/components/EnchantmentFormFields";
import EditEffectModal from "@/app/dnd/components/EditEffectModal";
import { useAuth } from "@/app/components/auth/AuthContext";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";
import {
  computePrice,
  fillDescription,
  sanitizeForm,
  computeDiceExpectedValue,
  EffectData,
} from "@/app/dnd/utils/effectUtils";
import {
  WEAPON_HANDEDNESS_OPTIONS,
  WEAPON_NUMERIC_PROPS,
  WEAPON_PROP_LABELS,
  WeaponHandedness,
  WeaponNumericProp,
  computeWeaponPrice,
  formatHandednessLabel,
  scaleWeaponMaterial,
  type ScaledWeaponStats,
} from "@/app/dnd/utils/weaponUtils";

interface SelectedEnchantment {
  selectionId: string;
  enchantment: Enchantment;
  formState: FormFieldsState;
}

const ENCHANTMENT_FIELDS: FieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "description",
    label: "Description",
    type: "text",
    required: true,
    placeholder: "Use %c for level/dice, %s for stat, %e for element",
  },
  { key: "base", label: "Base Cost", type: "number", required: true },
  { key: "linear", label: "Linear", type: "number", required: true },
  { key: "quadratic", label: "Quadratic", type: "number", required: true },
  { key: "exponential", label: "Exponential", type: "number", required: true },
  {
    key: "type",
    label: "Type",
    type: "select",
    required: true,
    options: ["weapon", "armor"],
  },
  {
    key: "form",
    label: "Form Fields",
    type: "array",
    placeholder: "level, dice, stat, or element",
  },
];

const ENCHANTMENT_EXTRA_FIELDS: FieldConfig[] = [
  { key: "type", label: "Type", type: "select", required: true, options: ["weapon", "armor"] },
];

const WEAPON_MATERIAL_FIELDS: FieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "thac0", label: "THAC0", type: "number", required: true },
  { key: "price", label: "Price", type: "number", required: true },
];

function computeEnchantmentPrice(
  enchantment: Enchantment,
  formState: FormFieldsState
): number {
  const hasDice = enchantment.form.includes("dice");
  const scalar = hasDice
    ? computeDiceExpectedValue(formState.stableDiceCount, formState.diceSides)
    : formState.stableLevel;
  return computePrice(enchantment as unknown as EffectData, scalar);
}

function computeTotalPrice(
  basePrice: number,
  selected: SelectedEnchantment[]
): number {
  if (selected.length === 0) return basePrice;
  const enchantSum = selected.reduce(
    (sum, s) => sum + computeEnchantmentPrice(s.enchantment, s.formState),
    0
  );
  const multiplier = 0.5 + 0.5 * selected.length;
  return Math.round(basePrice + enchantSum * multiplier);
}

function buildDescription(
  enchantment: Enchantment,
  formState: FormFieldsState
): string {
  const hasDice = enchantment.form.includes("dice");
  const cToken = hasDice
    ? `${formState.stableDiceCount}d${formState.diceSides}`
    : String(formState.stableLevel);
  return fillDescription(
    enchantment.description,
    cToken,
    formState.stat,
    formState.element
  );
}

function formatStatValue(prop: WeaponNumericProp, value: number): string {
  if (prop === "price") return `${value.toLocaleString()} gp`;
  return String(value);
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function WeaponStatsPanel({ stats }: { stats: ScaledWeaponStats }) {
  const visibleProps = WEAPON_NUMERIC_PROPS.filter((prop) => stats[prop] !== 0);

  return (
    <div className="flex flex-col gap-2">
      {visibleProps.map((prop) => (
        <StatRow
          key={prop}
          label={WEAPON_PROP_LABELS[prop]}
          value={formatStatValue(prop, stats[prop])}
        />
      ))}
    </div>
  );
}

export default function WeaponBuilderPage() {
  const [enchantments, setEnchantments] = useState<Enchantment[]>([]);
  const [materials, setMaterials] = useState<WeaponMaterial[]>([]);
  const [elements, setElements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedHandedness, setSelectedHandedness] = useState<WeaponHandedness>(
    WEAPON_HANDEDNESS_OPTIONS[0].id
  );
  const [selectedMaterial, setSelectedMaterial] = useState<WeaponMaterial | null>(null);
  const [selectedEnchants, setSelectedEnchants] = useState<SelectedEnchantment[]>([]);

  const [editingEnchantment, setEditingEnchantment] = useState<Enchantment | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<WeaponMaterial | null>(null);
  const [isAddEnchantOpen, setIsAddEnchantOpen] = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);

  const { user } = useAuth();
  const isAdmin = useIsAdmin();
  const isAuthenticated = !!user;

  function makeSelectionId(enchantmentId: string): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return `${enchantmentId}-${crypto.randomUUID()}`;
    }
    return `${enchantmentId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const loadData = useCallback(async () => {
    try {
      const [enchantData, materialData, elementData] = await Promise.all([
        readCollection<EnchantmentData>("enchantments"),
        readCollection<WeaponMaterialData>("weapon_materials"),
        readCollection<MagicElementData>("magicElements"),
      ]);
      setEnchantments(enchantData);
      setMaterials(materialData);
      setElements(elementData.map((e) => e.name));
    } catch (err) {
      console.error("Error loading weapon builder data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sortedMaterials = useMemo(
    () => [...materials].sort((a, b) => a.price - b.price),
    [materials]
  );

  useEffect(() => {
    if (sortedMaterials.length === 0) {
      setSelectedMaterial(null);
      return;
    }
    const stillValid = selectedMaterial
      ? sortedMaterials.some((m) => m.id === selectedMaterial.id)
      : false;
    if (stillValid) return;
    const defaultMaterial =
      sortedMaterials.find((m) => m.id === "wooden") ?? sortedMaterials[0];
    setSelectedMaterial(defaultMaterial);
  }, [sortedMaterials, selectedMaterial]);

  const scaledStats = useMemo(() => {
    if (!selectedMaterial) return null;
    return scaleWeaponMaterial(selectedMaterial, selectedHandedness);
  }, [selectedMaterial, selectedHandedness]);

  const basePrice = selectedMaterial
    ? computeWeaponPrice(selectedMaterial, selectedHandedness)
    : 0;
  const totalPrice = computeTotalPrice(basePrice, selectedEnchants);

  const weaponEnchantments = enchantments.filter((e) => e.type === "weapon");

  function toggleEnchantment(enchantment: Enchantment) {
    setSelectedEnchants((prev) => {
      const supportsMultipleSelections = enchantment.form.length > 0;
      if (supportsMultipleSelections) {
        return [
          ...prev,
          {
            selectionId: makeSelectionId(enchantment.id),
            enchantment,
            formState: defaultFormFieldsState(),
          },
        ];
      }
      const exists = prev.some((s) => s.enchantment.id === enchantment.id);
      if (exists) return prev.filter((s) => s.enchantment.id !== enchantment.id);
      return [
        ...prev,
        {
          selectionId: makeSelectionId(enchantment.id),
          enchantment,
          formState: defaultFormFieldsState(),
        },
      ];
    });
  }

  function removeEnchantmentSelection(selectionId: string) {
    setSelectedEnchants((prev) => prev.filter((s) => s.selectionId !== selectionId));
  }

  function updateEnchantFormState(selectionId: string, next: Partial<FormFieldsState>) {
    setSelectedEnchants((prev) =>
      prev.map((s) =>
        s.selectionId === selectionId
          ? { ...s, formState: { ...s.formState, ...next } }
          : s
      )
    );
  }

  async function handleAddEnchantment(data: EnchantmentData) {
    const id = data.name.toLowerCase().replace(/\s+/g, "-");
    await addToCollection(
      "enchantments",
      { ...data, form: sanitizeForm(data.form), type: "weapon" },
      id
    );
    await loadData();
  }

  async function handleSaveEnchantment(updated: EnchantmentData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("enchantments", oldId);
    await addToCollection(
      "enchantments",
      { ...updated, form: sanitizeForm(updated.form) },
      newId
    );
    await loadData();
  }

  async function handleDeleteEnchantment(id: string) {
    await removeFromCollection("enchantments", id);
    setEnchantments((prev) => prev.filter((e) => e.id !== id));
    setSelectedEnchants((prev) => prev.filter((s) => s.enchantment.id !== id));
  }

  async function handleAddWeaponMaterial(data: WeaponMaterialData) {
    const id = data.name.toLowerCase().replace(/\s+/g, "-");
    await addToCollection("weapon_materials", data, id);
    await loadData();
  }

  async function handleSaveWeaponMaterial(updated: WeaponMaterialData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("weapon_materials", oldId);
    await addToCollection("weapon_materials", updated, newId);
    await loadData();
  }

  async function handleDeleteWeaponMaterial(id: string) {
    await removeFromCollection("weapon_materials", id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (selectedMaterial?.id === id) setSelectedMaterial(null);
  }

  const itemLabel =
    selectedMaterial
      ? `${selectedMaterial.name} ${formatHandednessLabel(selectedHandedness)}`
      : null;

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href="/dnd/items"
              className="text-white/40 hover:text-white/70 text-sm transition-colors"
            >
              ← Items
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-1">
              Weapon Builder
            </h1>
          </div>
          {(isAuthenticated || isAdmin) && (
            <div className="flex gap-2 shrink-0">
              {isAuthenticated && (
                <button
                  onClick={() => setIsAddMaterialOpen(true)}
                  className="bg-blue-600/60 hover:bg-blue-600 transition-all"
                >
                  <Glass className="px-4 py-2 text-white text-sm font-semibold border">
                    + Weapon Material
                  </Glass>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => setIsAddEnchantOpen(true)}
                  className="bg-blue-600/60 hover:bg-blue-600 transition-all"
                >
                  <Glass className="px-4 py-2 text-white text-sm font-semibold border">
                    + Enchantment
                  </Glass>
                </button>
              )}
            </div>
          )}
        </div>

        <Glass className="p-2 flex gap-2">
          {WEAPON_HANDEDNESS_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSelectedHandedness(id)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors ${
                selectedHandedness === id
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {label}
            </button>
          ))}
        </Glass>

        <Glass className="p-6 min-h-[120px] flex flex-col gap-4">
          {itemLabel ? (
            <div className="text-white font-bold text-xl">{itemLabel}</div>
          ) : (
            <p className="text-white/30 italic">
              Select a material and enchantments below.
            </p>
          )}

          {scaledStats && <WeaponStatsPanel stats={scaledStats} />}

          {selectedEnchants.length > 0 && (
            <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
              <h3 className="text-white/50 text-xs font-medium uppercase tracking-wider">
                Enchantments
              </h3>
              {selectedEnchants.map(({ selectionId, enchantment, formState }) => (
                <div
                  key={selectionId}
                  className="text-white/80 text-sm leading-relaxed"
                >
                  <span className="font-semibold text-white">{enchantment.name}: </span>
                  {buildDescription(enchantment, formState)}
                  <span className="text-white/30 ml-2 text-xs">
                    ({computeEnchantmentPrice(enchantment, formState).toLocaleString()} gp)
                  </span>
                  <button
                    onClick={() => removeEnchantmentSelection(selectionId)}
                    className="ml-3 text-white/40 hover:text-white/80 text-xs transition-colors"
                  >
                    remove
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedMaterial && (
            <div className="flex items-center gap-3 pt-3 border-t border-white/10">
              <span className="text-white font-bold text-xl">
                {totalPrice.toLocaleString()} gp
              </span>
              {selectedEnchants.length > 1 && (
                <span className="text-white/40 text-xs">
                  {(0.5 + 0.5 * selectedEnchants.length).toFixed(1)}× enchant multiplier
                </span>
              )}
            </div>
          )}
        </Glass>

        {selectedEnchants.map(({ selectionId, enchantment, formState }) => {
          if (enchantment.form.length === 0) return null;
          return (
            <Glass key={selectionId} className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-white/50 text-xs font-medium uppercase tracking-wider">
                  {enchantment.name}
                </div>
                <button
                  onClick={() => removeEnchantmentSelection(selectionId)}
                  className="text-white/40 hover:text-white/80 text-xs transition-colors"
                >
                  Remove
                </button>
              </div>
              <EnchantmentFormFields
                form={enchantment.form}
                state={formState}
                elements={elements}
                onChange={(next) => updateEnchantFormState(selectionId, next)}
              />
            </Glass>
          );
        })}

        <Glass className="p-4">
          <h2 className="text-white/80 text-sm uppercase tracking-wide mb-3">
            Material
          </h2>
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="text-white/50 text-sm p-2">Loading...</div>
            ) : sortedMaterials.length === 0 ? (
              <div className="text-white/50 text-sm p-2">No weapon materials found.</div>
            ) : (
              <ul>
                {sortedMaterials.map((material) => {
                  const isSelected = selectedMaterial?.id === material.id;
                  const weaponPrice = computeWeaponPrice(material, selectedHandedness);
                  return (
                    <li key={material.id}>
                      <div
                        className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-white/20" : "hover:bg-white/10"
                        }`}
                        onClick={() => setSelectedMaterial(material)}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-medium capitalize ${
                              isSelected ? "text-white" : "text-white/70"
                            }`}
                          >
                            {material.name}
                          </span>
                          <span className="text-white/30 text-xs">
                            {material.thac0 !== 0 && `THAC0 ${material.thac0} · `}
                            {weaponPrice.toLocaleString()} gp
                          </span>
                        </div>
                        {isAuthenticated && (
                          <div
                            className="flex gap-2 ml-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setEditingMaterial(material)}
                              className="px-3 py-1 text-xs bg-blue-600/40 hover:bg-blue-600/60 text-white rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteWeaponMaterial(material.id)}
                              className="px-3 py-1 text-xs bg-red-600/40 hover:bg-red-600/60 text-white rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Glass>

        <Glass className="p-4">
          <h2 className="text-white/80 text-sm uppercase tracking-wide mb-3">
            Enchantments
            {selectedEnchants.length > 0 && (
              <span className="ml-2 text-white/40 text-xs normal-case">
                {selectedEnchants.length} selected
              </span>
            )}
          </h2>
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="text-white/50 text-sm p-2">Loading...</div>
            ) : weaponEnchantments.length === 0 ? (
              <div className="text-white/50 text-sm p-2">No weapon enchantments found.</div>
            ) : (
              <ul>
                {weaponEnchantments.map((enchantment) => {
                  const isSelected = selectedEnchants.some(
                    (s) => s.enchantment.id === enchantment.id
                  );
                  return (
                    <li key={enchantment.id}>
                      <div
                        className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-white/20" : "hover:bg-white/10"
                        }`}
                        onClick={() => toggleEnchantment(enchantment)}
                      >
                        <span
                          className={`font-medium ${
                            isSelected ? "text-white" : "text-white/70"
                          }`}
                        >
                          {enchantment.name}
                        </span>
                        {isAdmin && (
                          <div
                            className="flex gap-2 ml-4"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => setEditingEnchantment(enchantment)}
                              className="px-3 py-1 text-xs bg-blue-600/40 hover:bg-blue-600/60 text-white rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEnchantment(enchantment.id)}
                              className="px-3 py-1 text-xs bg-red-600/40 hover:bg-red-600/60 text-white rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Glass>
      </div>

      <FormModal<EnchantmentData>
        isOpen={isAddEnchantOpen}
        onClose={() => setIsAddEnchantOpen(false)}
        onSubmit={handleAddEnchantment}
        title="Add Weapon Enchantment"
        fields={ENCHANTMENT_FIELDS}
      />
      <FormModal<WeaponMaterialData>
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSubmit={handleAddWeaponMaterial}
        title="Add Weapon Material"
        fields={WEAPON_MATERIAL_FIELDS}
      />

      {editingEnchantment && (
        <EditEffectModal
          title="Edit Enchantment"
          item={editingEnchantment}
          extraFields={ENCHANTMENT_EXTRA_FIELDS}
          onClose={() => setEditingEnchantment(null)}
          onSave={handleSaveEnchantment}
        />
      )}
      {editingMaterial && (
        <EditEffectModal
          title="Edit Weapon Material"
          item={editingMaterial}
          extraFields={WEAPON_MATERIAL_FIELDS}
          includeBaseFields={false}
          onClose={() => setEditingMaterial(null)}
          onSave={handleSaveWeaponMaterial}
        />
      )}
    </main>
  );
}
