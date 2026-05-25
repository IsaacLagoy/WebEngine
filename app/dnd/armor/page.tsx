"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Enchantment,
  EnchantmentData,
  ArmorMaterial,
  ArmorMaterialData,
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
  ARMOR_PIECES,
  ARMOR_NUMERIC_PROPS,
  ARMOR_PROP_LABELS,
  ArmorPiece,
  ArmorNumericProp,
  computeArmorPieceBasePrice,
  getPieceFraction,
  scaleArmorMaterial,
  type ScaledArmorStats,
} from "@/app/dnd/utils/armorUtils";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

interface SelectedEnchantment {
  selectionId: string;
  enchantment: Enchantment;
  formState: FormFieldsState;
}

// ------------------------------------------------------------
// Enchantment admin fields
// ------------------------------------------------------------

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

const ARMOR_MATERIAL_FIELDS: FieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "class",
    label: "Class",
    type: "select",
    required: true,
    options: ["light", "heavy"],
  },
  { key: "damage_reduction", label: "Damage Reduction", type: "number", required: true },
  { key: "magic_reduction", label: "Magic Reduction", type: "number", required: true },
  { key: "rogue_reduction", label: "Rogue Reduction", type: "number", required: true },
  { key: "magic_resistance", label: "Magic Resistance", type: "number", required: true },
  { key: "full_price", label: "Price", type: "number", required: true },
];

// ------------------------------------------------------------
// Price helpers
// ------------------------------------------------------------

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

function formatStatValue(prop: ArmorNumericProp, value: number): string {
  if (prop === "full_price") return `${value.toLocaleString()} gp`;
  return String(value) + "%";
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}

function MaterialStatsPanel({ stats }: { stats: ScaledArmorStats }) {
  const visibleProps = ARMOR_NUMERIC_PROPS.filter((prop) => stats[prop] !== 0);

  return (
    <div className="flex flex-col gap-2">
      <StatRow label={ARMOR_PROP_LABELS.class} value={stats.class} />
      {visibleProps.map((prop) => (
        <StatRow
          key={prop}
          label={ARMOR_PROP_LABELS[prop]}
          value={formatStatValue(prop, stats[prop])}
        />
      ))}
    </div>
  );
}

type MaterialClassFilter = "all" | "light" | "heavy";

const CLASS_FILTERS: { id: MaterialClassFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "light", label: "Light" },
  { id: "heavy", label: "Heavy" },
];

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function ArmorBuilderPage() {
  const [enchantments, setEnchantments] = useState<Enchantment[]>([]);
  const [materials, setMaterials] = useState<ArmorMaterial[]>([]);
  const [elements, setElements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPiece, setSelectedPiece] = useState<ArmorPiece>(ARMOR_PIECES[0]);
  const [classFilter, setClassFilter] = useState<MaterialClassFilter>("all");
  const [selectedMaterial, setSelectedMaterial] = useState<ArmorMaterial | null>(null);
  const [selectedEnchants, setSelectedEnchants] = useState<SelectedEnchantment[]>([]);

  const [editingEnchantment, setEditingEnchantment] = useState<Enchantment | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<ArmorMaterial | null>(null);
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
        readCollection<ArmorMaterialData>("armor_materials"),
        readCollection<MagicElementData>("magicElements"),
      ]);
      setEnchantments(enchantData);
      setMaterials(materialData);
      setElements(elementData.map((e) => e.name));
    } catch (err) {
      console.error("Error loading armor builder data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredMaterials = useMemo(() => {
    const list =
      classFilter === "all"
        ? materials
        : materials.filter((m) => m.class === classFilter);
    return [...list].sort((a, b) => a.full_price - b.full_price);
  }, [materials, classFilter]);

  useEffect(() => {
    if (filteredMaterials.length === 0) {
      setSelectedMaterial(null);
      return;
    }
    const stillValid = selectedMaterial
      ? filteredMaterials.some((m) => m.id === selectedMaterial.id)
      : false;
    if (stillValid) return;
    const defaultMaterial =
      filteredMaterials.find((m) => m.id === "leather") ?? filteredMaterials[0];
    setSelectedMaterial(defaultMaterial);
  }, [filteredMaterials, selectedMaterial]);

  const scaledStats = useMemo(() => {
    if (!selectedMaterial || !selectedPiece) return null;
    return scaleArmorMaterial(selectedMaterial, getPieceFraction(selectedPiece));
  }, [selectedMaterial, selectedPiece]);

  const basePrice = selectedMaterial
    ? computeArmorPieceBasePrice(selectedMaterial, selectedPiece)
    : 0;
  const totalPrice = computeTotalPrice(basePrice, selectedEnchants);

  const armorEnchantments = enchantments.filter((e) => e.type === "armor");

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
      { ...data, form: sanitizeForm(data.form), type: "armor" },
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

  async function handleAddArmorMaterial(data: ArmorMaterialData) {
    const id = data.name.toLowerCase().replace(/\s+/g, "-");
    await addToCollection("armor_materials", data, id);
    await loadData();
  }

  async function handleSaveArmorMaterial(updated: ArmorMaterialData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("armor_materials", oldId);
    await addToCollection("armor_materials", updated, newId);
    await loadData();
  }

  async function handleDeleteArmorMaterial(id: string) {
    await removeFromCollection("armor_materials", id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
    if (selectedMaterial?.id === id) setSelectedMaterial(null);
  }

  const itemLabel =
    selectedMaterial && selectedPiece
      ? `${selectedMaterial.name} ${selectedPiece}`
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
              Armor Builder
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
                    + Armor Material
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

        {/* Armor piece */}
        <Glass className="p-2 flex flex-wrap gap-2">
          {ARMOR_PIECES.map((piece) => (
            <button
              key={piece}
              onClick={() => setSelectedPiece(piece)}
              className={`flex-1 min-w-[5.5rem] py-2 rounded-lg font-semibold text-sm transition-colors ${
                selectedPiece === piece
                  ? "bg-white/20 text-white"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {piece}
            </button>
          ))}
        </Glass>

        {/* Summary */}
        <Glass className="p-6 min-h-[120px] flex flex-col gap-4">
          {itemLabel ? (
            <div className="text-white font-bold text-xl">{itemLabel}</div>
          ) : (
            <p className="text-white/30 italic">
              Select a material, piece, and enchantments below.
            </p>
          )}

          {scaledStats && <MaterialStatsPanel stats={scaledStats} />}

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

        {/* Enchantment form fields */}
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

        {/* Material */}
        <Glass className="p-4">
          <h2 className="text-white/80 text-sm uppercase tracking-wide mb-3">
            Material
          </h2>
          <Glass className="p-2 flex gap-2 mb-3">
            {CLASS_FILTERS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setClassFilter(id)}
                className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors capitalize ${
                  classFilter === id
                    ? "bg-white/20 text-white"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </Glass>
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="text-white/50 text-sm p-2">Loading...</div>
            ) : filteredMaterials.length === 0 ? (
              <div className="text-white/50 text-sm p-2">
                No {classFilter === "all" ? "" : `${classFilter} `}armor materials found.
              </div>
            ) : (
              <ul>
                {filteredMaterials.map((material) => {
                  const isSelected = selectedMaterial?.id === material.id;
                  const piecePrice = computeArmorPieceBasePrice(material, selectedPiece);
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
                            {material.class} · {piecePrice.toLocaleString()} gp
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
                              onClick={() => handleDeleteArmorMaterial(material.id)}
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

        {/* Enchantments */}
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
            ) : armorEnchantments.length === 0 ? (
              <div className="text-white/50 text-sm p-2">No armor enchantments found.</div>
            ) : (
              <ul>
                {armorEnchantments.map((enchantment) => {
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
        title="Add Armor Enchantment"
        fields={ENCHANTMENT_FIELDS}
      />
      <FormModal<ArmorMaterialData>
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSubmit={handleAddArmorMaterial}
        title="Add Armor Material"
        fields={ARMOR_MATERIAL_FIELDS}
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
          title="Edit Armor Material"
          item={editingMaterial}
          extraFields={ARMOR_MATERIAL_FIELDS}
          includeBaseFields={false}
          onClose={() => setEditingMaterial(null)}
          onSave={handleSaveArmorMaterial}
        />
      )}
    </main>
  );
}
