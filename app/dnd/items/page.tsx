"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Enchantment, EnchantmentData,
  Material, MaterialData,
  MagicElementData,
  readCollection, addToCollection, removeFromCollection,
} from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import FormModal, { FieldConfig } from "@/app/components/modal/FormModal";
import EnchantmentFormFields, {
  FormFieldsState,
  defaultFormFieldsState,
} from "@/app/dnd/components/EnchantmentFormFields";
import EditEffectModal from "@/app/dnd/components/EditEffectModal";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";
import {
  computePrice,
  fillDescription,
  sanitizeForm,
  computeDiceExpectedValue,
  EffectData,
} from "@/app/dnd/utils/effectUtils";

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type ItemType = "weapon" | "armor";

interface SelectedEnchantment {
  selectionId: string;
  enchantment: Enchantment;
  formState: FormFieldsState;
}

// ------------------------------------------------------------
// Field configs for add modals
// ------------------------------------------------------------

const ENCHANTMENT_FIELDS: FieldConfig[] = [
  { key: "name",        label: "Name",        type: "text",   required: true },
  { key: "description", label: "Description", type: "text",   required: true, placeholder: "Use %c for level/dice, %s for stat, %e for element" },
  { key: "base",        label: "Base Cost",   type: "number", required: true },
  { key: "linear",      label: "Linear",      type: "number", required: true },
  { key: "quadratic",   label: "Quadratic",   type: "number", required: true },
  { key: "exponential", label: "Exponential", type: "number", required: true },
  { key: "type",        label: "Type",        type: "select", required: true, options: ["weapon", "armor"] },
  { key: "form",        label: "Form Fields", type: "array",  placeholder: "level, dice, stat, or element" },
];

const MATERIAL_FIELDS: FieldConfig[] = [
  { key: "name",        label: "Name",        type: "text",   required: true },
  { key: "description", label: "Description", type: "text",   required: true },
  { key: "modifier",    label: "Modifier",    type: "number", required: true },
];

const ENCHANTMENT_EXTRA_FIELDS: FieldConfig[] = [
  { key: "type", label: "Type", type: "select", required: true, options: ["weapon", "armor"] },
];

// ------------------------------------------------------------
// Price helpers
// ------------------------------------------------------------

function computeItemBasePrice(material: Material): number {
  return Math.round(10 * Math.pow(10, material.modifier));
}

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
  material: Material | null,
  selected: SelectedEnchantment[]
): number {
  const base = material ? computeItemBasePrice(material) : 0;
  if (selected.length === 0) return base;
  const enchantSum = selected.reduce(
    (sum, s) => sum + computeEnchantmentPrice(s.enchantment, s.formState),
    0
  );
  const multiplier = 0.5 + 0.5 * selected.length;
  return Math.round(base + enchantSum * multiplier);
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

function getDefaultMaterialId(type: ItemType): string {
  return type === "weapon" ? "wood" : "cloth";
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function ItemsPage() {
  const [enchantments, setEnchantments] = useState<Enchantment[]>([]);
  const [materials, setMaterials]       = useState<Material[]>([]);
  const [elements, setElements]         = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);

  const [itemType, setItemType]                 = useState<ItemType>("weapon");
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [selectedEnchants, setSelectedEnchants] = useState<SelectedEnchantment[]>([]);

  const [editingEnchantment, setEditingEnchantment] = useState<Enchantment | null>(null);
  const [editingMaterial, setEditingMaterial]       = useState<Material | null>(null);
  const [isAddEnchantOpen, setIsAddEnchantOpen]     = useState(false);
  const [isAddMaterialOpen, setIsAddMaterialOpen]   = useState(false);

  const isAdmin = useIsAdmin();

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
        readCollection<MaterialData>("materials"),
        readCollection<MagicElementData>("magicElements"),
      ]);
      setEnchantments(enchantData);
      setMaterials(materialData);
      setElements(elementData.map((e) => e.name));
    } catch (err) {
      console.error("Error loading items data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Reset enchants when item type changes
  useEffect(() => {
    setSelectedEnchants([]);
  }, [itemType]);

  // Ensure selected material is always valid and defaults by item type.
  useEffect(() => {
    if (materials.length === 0) return;

    const selectedStillExists = selectedMaterial
      ? materials.some((m) => m.id === selectedMaterial.id)
      : false;

    if (selectedStillExists) return;

    const defaultMaterial =
      materials.find((m) => m.id === getDefaultMaterialId(itemType)) ?? materials[0];

    if (defaultMaterial) {
      setSelectedMaterial(defaultMaterial);
    }
  }, [itemType, materials, selectedMaterial]);

  // ----------------------------------------------------------------
  // Enchantment selection
  // ----------------------------------------------------------------

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

  // ----------------------------------------------------------------
  // Admin CRUD
  // ----------------------------------------------------------------

  async function handleAddEnchantment(data: EnchantmentData) {
    const id = data.name.toLowerCase().replace(/\s+/g, "-");
    await addToCollection("enchantments", { ...data, form: sanitizeForm(data.form) }, id);
    await loadData();
  }

  async function handleAddMaterial(data: MaterialData) {
    const id = data.name.toLowerCase().replace(/\s+/g, "-");
    await addToCollection("materials", data, id);
    await loadData();
  }

  async function handleSaveEnchantment(updated: EnchantmentData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("enchantments", oldId);
    await addToCollection("enchantments", { ...updated, form: sanitizeForm(updated.form) }, newId);
    await loadData();
  }

  async function handleSaveMaterial(updated: MaterialData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("materials", oldId);
    await addToCollection("materials", updated, newId);
    await loadData();
  }

  async function handleDeleteEnchantment(id: string) {
    await removeFromCollection("enchantments", id);
    setEnchantments((prev) => prev.filter((e) => e.id !== id));
    setSelectedEnchants((prev) => prev.filter((s) => s.enchantment.id !== id));
  }

  async function handleDeleteMaterial(id: string) {
    await removeFromCollection("materials", id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  // ----------------------------------------------------------------
  // Derived values
  // ----------------------------------------------------------------

  const sortedMaterials = [...materials].sort(
    (a, b) => computeItemBasePrice(a) - computeItemBasePrice(b)
  );
  const filteredEnchantments = enchantments.filter((e) => e.type === itemType);
  const totalPrice = computeTotalPrice(selectedMaterial, selectedEnchants);

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Item Builder</h1>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={() => setIsAddEnchantOpen(true)} className="bg-blue-600/60 hover:bg-blue-600 transition-all">
                <Glass className="px-4 py-2 text-white text-sm font-semibold border">+ Enchantment</Glass>
              </button>
              <button onClick={() => setIsAddMaterialOpen(true)} className="bg-blue-600/60 hover:bg-blue-600 transition-all">
                <Glass className="px-4 py-2 text-white text-sm font-semibold border">+ Material</Glass>
              </button>
            </div>
          )}
        </div>

        {/* Item type selector */}
        <Glass className="p-2 flex gap-2">
          {(["weapon", "armor"] as ItemType[]).map((type) => (
            <button
              key={type}
              onClick={() => setItemType(type)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition-colors capitalize ${
                itemType === type ? "bg-white/20 text-white" : "text-white/50 hover:text-white/80"
              }`}
            >
              {type}
            </button>
          ))}
        </Glass>

        {/* Summary card */}
        <Glass className="p-6 min-h-[120px] flex flex-col gap-3">
          {selectedMaterial || selectedEnchants.length > 0 ? (
            <>
              {selectedMaterial && (
                <div className="flex items-center gap-2">
                  <span className="text-white/50 text-sm">Material:</span>
                  <span className="text-white font-semibold">{selectedMaterial.name}</span>
                  <span className="text-white/30 text-xs ml-auto">
                    {computeItemBasePrice(selectedMaterial).toLocaleString()} gp base
                  </span>
                </div>
              )}
              {selectedEnchants.map(({ selectionId, enchantment, formState }) => (
                <div key={selectionId} className="text-white/80 text-sm leading-relaxed border-t border-white/10 pt-3">
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
              <div className="flex items-center gap-3 mt-2 pt-3 border-t border-white/10">
                <span className="text-white font-bold text-xl">{totalPrice.toLocaleString()} gp</span>
                {selectedEnchants.length > 1 && (
                  <span className="text-white/40 text-xs">
                    {(0.5 + 0.5 * selectedEnchants.length).toFixed(1)}× enchantment multiplier
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="text-white/30 italic">Select a material and enchantments below.</p>
          )}
        </Glass>

        {/* Enchantment form fields for each selected enchant */}
        {selectedEnchants.map(({ selectionId, enchantment, formState }) => {
          const hasAnyForm = enchantment.form.length > 0;
          if (!hasAnyForm) return null;
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

        {/* Material list */}
        <Glass className="p-4">
          <h2 className="text-white/80 text-sm uppercase tracking-wide mb-3">Material</h2>
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="text-white/50 text-sm p-2">Loading...</div>
            ) : (
              <ul>
                {sortedMaterials.map((material) => {
                  const isSelected = selectedMaterial?.id === material.id;
                  return (
                    <li key={material.id}>
                      <div
                        className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-white/20" : "hover:bg-white/10"
                        }`}
                        onClick={() => setSelectedMaterial(material)}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${isSelected ? "text-white" : "text-white/70"}`}>
                            {material.name}
                          </span>
                          <span className="text-white/30 text-xs">
                            {computeItemBasePrice(material).toLocaleString()} gp
                          </span>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setEditingMaterial(material)} className="px-3 py-1 text-xs bg-blue-600/40 hover:bg-blue-600/60 text-white rounded transition-colors">Edit</button>
                            <button onClick={() => handleDeleteMaterial(material.id)} className="px-3 py-1 text-xs bg-red-600/40 hover:bg-red-600/60 text-white rounded transition-colors">Delete</button>
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

        {/* Enchantment list */}
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
            ) : filteredEnchantments.length === 0 ? (
              <div className="text-white/50 text-sm p-2">No {itemType} enchantments found.</div>
            ) : (
              <ul>
                {filteredEnchantments.map((enchantment) => {
                  const isSelected = selectedEnchants.some((s) => s.enchantment.id === enchantment.id);
                  return (
                    <li key={enchantment.id}>
                      <div
                        className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-white/20" : "hover:bg-white/10"
                        }`}
                        onClick={() => toggleEnchantment(enchantment)}
                      >
                        <span className={`font-medium ${isSelected ? "text-white" : "text-white/70"}`}>
                          {enchantment.name}
                        </span>
                        {isAdmin && (
                          <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => setEditingEnchantment(enchantment)} className="px-3 py-1 text-xs bg-blue-600/40 hover:bg-blue-600/60 text-white rounded transition-colors">Edit</button>
                            <button onClick={() => handleDeleteEnchantment(enchantment.id)} className="px-3 py-1 text-xs bg-red-600/40 hover:bg-red-600/60 text-white rounded transition-colors">Delete</button>
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

      {/* Add modals */}
      <FormModal<EnchantmentData>
        isOpen={isAddEnchantOpen}
        onClose={() => setIsAddEnchantOpen(false)}
        onSubmit={handleAddEnchantment}
        title="Add Enchantment"
        fields={ENCHANTMENT_FIELDS}
      />
      <FormModal<MaterialData>
        isOpen={isAddMaterialOpen}
        onClose={() => setIsAddMaterialOpen(false)}
        onSubmit={handleAddMaterial}
        title="Add Material"
        fields={MATERIAL_FIELDS}
      />

      {/* Edit modals */}
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
          title="Edit Material"
          item={editingMaterial}
          extraFields={MATERIAL_FIELDS}
          includeBaseFields={false}
          onClose={() => setEditingMaterial(null)}
          onSave={handleSaveMaterial}
        />
      )}
    </main>
  );
}