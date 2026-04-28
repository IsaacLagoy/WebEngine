"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Potion, PotionData, PotionFormField,
  MagicElementData,
  readCollection, readCollectionPage, readDocumentById, addToCollection, removeFromCollection,
} from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import FormModal, { FieldConfig } from "@/app/components/modal/FormModal";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

const STATS = ["Strength", "Constitution", "Dexterity", "Wisdom", "Intelligence", "Charisma"];
const DICE_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
const PAGE_SIZE = 50;

const POTION_FORM_FIELDS: FieldConfig[] = [
  { key: "name",        label: "Name",        type: "text",   required: true },
  { key: "description", label: "Description", type: "text",   required: true, placeholder: "Use %c for level/dice, %s for stat, %e for element" },
  { key: "base",        label: "Base Cost",   type: "number", required: true },
  { key: "linear",      label: "Linear",      type: "number", required: true },
  { key: "quadratic",   label: "Quadratic",   type: "number", required: true },
  { key: "exponential", label: "Exponential", type: "number", required: true },
  { key: "iterval",     label: "Interval",    type: "select", required: true, options: ["hour", "round"] },
  { key: "form",        label: "Form Fields", type: "array",  placeholder: "level, dice, stat, or element" },
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function computePrice(potion: Potion, scalar: number): number {
  const exp = potion.exponential > 0 ? potion.base * Math.pow(potion.exponential, scalar) : potion.base;
  const quadratic = potion.quadratic ?? 0;
  return Math.round(exp + potion.linear * scalar + quadratic * Math.pow(scalar, 2));
}

function fillDescription(
  description: string,
  costFactorToken: string,
  stat: string,
  element: string
): string {
  return description
    .replace(/%c/g, costFactorToken)
    .replace(/%s/g, stat || "___")
    .replace(/%e/g, element || "___");
}

function sanitizePotionForm(value: unknown): PotionFormField[] {
  if (!Array.isArray(value)) return [];
  const filtered = value.filter(
    (field): field is PotionFormField =>
      field === "level" || field === "stat" || field === "element" || field === "dice"
  );
  const deduped = Array.from(new Set(filtered));
  // Dice takes precedence over level if both are present.
  return deduped.includes("dice") ? deduped.filter((field) => field !== "level") : deduped;
}

function parsePositiveInteger(raw: string): number | null {
  if (!/^\d+$/.test(raw.trim())) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return null;
  return Math.floor(parsed);
}

function computeDiceExpectedValue(count: number, sides: number): number {
  const averageDie = (sides + 1) / 2;
  const highDiceBias = sides / (sides - 1);
  return count * averageDie * highDiceBias;
}

// ------------------------------------------------------------
// Edit Modal
// ------------------------------------------------------------

function EditPotionModal({
  potion,
  onClose,
  onSave,
}: {
  potion: Potion;
  onClose: () => void;
  onSave: (updated: PotionData, oldId: string) => Promise<void>;
}) {
  const [formData, setFormData] = useState<Record<string, any>>({
    name: potion.name,
    description: potion.description,
    base: potion.base,
    linear: potion.linear,
    quadratic: potion.quadratic ?? 0,
    exponential: potion.exponential,
    iterval: potion.iterval,
    form: [...potion.form],
  });
  const [arrayInput, setArrayInput] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass = "w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40";

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(formData as PotionData, potion.id);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Glass className="relative w-full max-w-lg p-6 z-10 max-h-[80vh] overflow-y-auto" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Edit Potion</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          {POTION_FORM_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="block text-white/70 text-sm font-medium mb-1">{field.label}</label>
              {field.type === "text" && (
                <input type="text" value={formData[field.key] ?? ""} onChange={(e) => setFormData(p => ({ ...p, [field.key]: e.target.value }))} className={inputClass} placeholder={field.placeholder} />
              )}
              {field.type === "number" && (
                <input type="number" value={formData[field.key] ?? ""} onChange={(e) => setFormData(p => ({ ...p, [field.key]: Number(e.target.value) }))} className={inputClass} />
              )}
              {field.type === "select" && (
                <select value={formData[field.key] ?? ""} onChange={(e) => setFormData(p => ({ ...p, [field.key]: e.target.value }))} className={inputClass}>
                  {field.options?.map((opt) => <option key={opt} value={opt} className="bg-gray-800">{opt}</option>)}
                </select>
              )}
              {field.type === "array" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text" value={arrayInput}
                      onChange={(e) => setArrayInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const v = arrayInput.trim();
                          if (v) { setFormData(p => ({ ...p, form: [...(p.form || []), v] })); setArrayInput(""); }
                        }
                      }}
                      placeholder={field.placeholder}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    />
                    <button type="button" onClick={() => { const v = arrayInput.trim(); if (v) { setFormData(p => ({ ...p, form: [...(p.form || []), v] })); setArrayInput(""); } }} className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData.form || []).map((item: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm">
                        {item}
                        <button onClick={() => setFormData(p => ({ ...p, form: p.form.filter((_: any, j: number) => j !== i) }))} className="text-white/70 hover:text-white">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="flex-1 px-6 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
          <button onClick={onClose} className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors">Cancel</button>
        </div>
      </Glass>
    </div>
  );
}

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function PotionsPage() {
  const [potions, setPotions]           = useState<Potion[]>([]);
  const [elements, setElements]         = useState<string[]>([]);
  const [loading, setLoading]           = useState(true);
  const [selectedPotion, setSelectedPotion] = useState<Potion | null>(null);
  const [editingPotion, setEditingPotion]   = useState<Potion | null>(null);
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | undefined>>({ 1: undefined });
  const [hasNextPage, setHasNextPage] = useState(false);

  // Builder state
  const [levelInput, setLevelInput] = useState("1");
  const [stableLevel, setStableLevel] = useState(1);
  const [diceCountInput, setDiceCountInput] = useState("1");
  const [stableDiceCount, setStableDiceCount] = useState(1);
  const [diceSides, setDiceSides] = useState<(typeof DICE_SIDES)[number]>(6);
  const [stat, setStat]       = useState(STATS[0]);
  const [element, setElement] = useState("");

  const isAdmin = useIsAdmin();

  const loadData = useCallback(async () => {
    try {
      const [potionPage, elementData] = await Promise.all([
        readCollectionPage<PotionData>("potions", PAGE_SIZE, cursorByPage[currentPage], true),
        readCollection<MagicElementData>("magicElements", { maxItems: 50, preferCache: true }),
      ]);
      setPotions(potionPage.items);
      setHasNextPage(potionPage.nextCursor !== null);
      setCursorByPage((prev) => {
        if (!potionPage.nextCursor) return prev;
        if (prev[currentPage + 1] === potionPage.nextCursor) return prev;
        return { ...prev, [currentPage + 1]: potionPage.nextCursor };
      });
      setElements(elementData.map((e) => e.name));
      if (elementData.length > 0) setElement(elementData[0].name);
    } catch (err) {
      console.error("Error loading potions:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, cursorByPage]);

  useEffect(() => { loadData(); }, [loadData]);

  // Reset builder state when potion changes
  useEffect(() => {
    setLevelInput("1");
    setStableLevel(1);
    setDiceCountInput("1");
    setStableDiceCount(1);
    setDiceSides(6);
  }, [selectedPotion]);

  async function handleAddPotion(data: PotionData) {
    const normalizedForm = sanitizePotionForm(data.form);
    if (Array.isArray(data.form) && data.form.includes("level") && data.form.includes("dice")) {
      alert('Potion form cannot include both "level" and "dice". Keeping "dice" and removing "level".');
    }
    const id = data.name.toLowerCase().replace(/\s+/g, "-");
    await addToCollection(
      "potions",
      { ...data, quadratic: Number(data.quadratic ?? 0), form: normalizedForm },
      id
    );
    setCurrentPage(1);
    setCursorByPage({ 1: undefined });
    await loadData();
  }

  async function handleDeletePotion(id: string) {
    await removeFromCollection("potions", id);
    if (selectedPotion?.id === id) setSelectedPotion(null);
    setPotions((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleSavePotion(updated: PotionData, oldId: string) {
    const normalizedForm = sanitizePotionForm(updated.form);
    if (Array.isArray(updated.form) && updated.form.includes("level") && updated.form.includes("dice")) {
      alert('Potion form cannot include both "level" and "dice". Keeping "dice" and removing "level".');
    }
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("potions", oldId);
    await addToCollection(
      "potions",
      { ...updated, quadratic: Number(updated.quadratic ?? 0), form: normalizedForm },
      newId
    );
    setCurrentPage(1);
    setCursorByPage({ 1: undefined });
    await loadData();
    setSelectedPotion({
      ...updated,
      quadratic: Number(updated.quadratic ?? 0),
      form: normalizedForm,
      id: newId,
    });
  }

  const parsedLevel = parsePositiveInteger(levelInput);
  const levelInvalid = parsedLevel === null;
  const parsedDiceCount = parsePositiveInteger(diceCountInput);
  const diceCountInvalid = parsedDiceCount === null;

  const hasDice = !!selectedPotion?.form.includes("dice");
  const hasLevel = !!selectedPotion?.form.includes("level") && !hasDice;
  const hasStat = !!selectedPotion?.form.includes("stat");
  const hasElement = !!selectedPotion?.form.includes("element");

  const effectiveScalar = hasDice
    ? computeDiceExpectedValue(stableDiceCount, diceSides)
    : hasLevel
      ? stableLevel
      : 1;
  const cToken = hasDice ? `${stableDiceCount}d${diceSides}` : String(stableLevel);

  const price = selectedPotion ? computePrice(selectedPotion, effectiveScalar) : null;
  const description = selectedPotion
    ? fillDescription(selectedPotion.description, cToken, stat, element)
    : null;

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-2xl mx-auto flex flex-col gap-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-bold text-white">Potions</h1>
          {isAdmin && (
            <button onClick={() => setIsAddOpen(true)} className="bg-blue-600/60 hover:bg-blue-600 transition-all">
              <Glass className="px-6 py-3 text-white font-semibold border">Add</Glass>
            </button>
          )}
        </div>

        {/* Description preview */}
        <Glass className="p-6 min-h-[100px] flex flex-col gap-2">
          {selectedPotion ? (
            <>
              <p className="text-white/90 leading-relaxed">
                {description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-white font-bold text-lg">{price?.toLocaleString()} gp</span>
                <span className="text-white/40 text-sm">per {selectedPotion.iterval}</span>
              </div>
            </>
          ) : (
            <p className="text-white/30 italic">Select a potion type below to get started.</p>
          )}
        </Glass>

        {/* Form inputs — only show when potion is selected and has form fields */}
        {selectedPotion && (hasLevel || hasDice || hasStat || hasElement) && (
          <Glass className="p-6 flex flex-col gap-4">
            {hasLevel && (
              <div className="flex items-center gap-4">
                <label className="text-white/60 text-sm w-24 shrink-0">Level</label>
                <div className="flex-1 space-y-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={levelInput}
                  onChange={(e) => {
                    const nextRaw = e.target.value;
                    setLevelInput(nextRaw);
                    const parsed = parsePositiveInteger(nextRaw);
                    if (parsed !== null) {
                      setStableLevel(parsed);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
                {levelInvalid && (
                  <span className="inline-flex w-fit px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-200 border border-red-400/40">
                    Invalid level
                  </span>
                )}
                </div>
              </div>
            )}
            {hasDice && (
              <div className="flex items-center gap-4">
                <label className="text-white/60 text-sm w-24 shrink-0">Dice</label>
                <div className="flex-1 flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={diceCountInput}
                    onChange={(e) => {
                      const nextRaw = e.target.value;
                      setDiceCountInput(nextRaw);
                      const parsed = parsePositiveInteger(nextRaw);
                      if (parsed !== null) {
                        setStableDiceCount(parsed);
                      }
                    }}
                    className="w-24 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                    placeholder="count"
                  />
                  <span className="text-white/60">d</span>
                  <select
                    value={diceSides}
                    onChange={(e) => setDiceSides(Number(e.target.value) as (typeof DICE_SIDES)[number])}
                    className="w-28 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                  >
                    {DICE_SIDES.map((sides) => (
                      <option key={sides} value={sides} className="bg-gray-800">
                        {sides}
                      </option>
                    ))}
                  </select>
                </div>
                {diceCountInvalid && (
                  <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-200 border border-red-400/40">
                    Invalid dice
                  </span>
                )}
              </div>
            )}
            {hasStat && (
              <div className="flex items-center gap-4">
                <label className="text-white/60 text-sm w-24 shrink-0">Stat</label>
                <select
                  value={stat}
                  onChange={(e) => setStat(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  {STATS.map((s) => <option key={s} value={s} className="bg-gray-800">{s}</option>)}
                </select>
              </div>
            )}
            {hasElement && (
              <div className="flex items-center gap-4">
                <label className="text-white/60 text-sm w-24 shrink-0">Element</label>
                <select
                  value={element}
                  onChange={(e) => setElement(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40"
                >
                  {elements.map((el) => <option key={el} value={el} className="bg-gray-800">{el}</option>)}
                </select>
              </div>
            )}
          </Glass>
        )}

        {/* Scrollable potion list */}
        <Glass className="p-4">
          <h2 className="text-white/80 text-sm uppercase tracking-wide mb-3">Potion Type</h2>
          <div className="max-h-72 overflow-y-auto">
          {loading ? (
            <div className="text-white/50 text-sm p-4">Loading potions...</div>
          ) : (
            <ul>
              {potions.map((potion) => {
                const isSelected = selectedPotion?.id === potion.id;
                return (
                  <li key={potion.id}>
                    <div
                      className={`flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? "bg-white/20" : "hover:bg-white/10"
                      }`}
                      onClick={() => setSelectedPotion(isSelected ? null : potion)}
                    >
                      <span className={`font-medium ${isSelected ? "text-white" : "text-white/70"}`}>
                        {potion.name}
                      </span>
                      {isAdmin && (
                        <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              readDocumentById<PotionData>("potions", potion.id, true)
                                .then((fullPotion) => setEditingPotion(fullPotion ?? potion))
                                .catch(() => setEditingPotion(potion));
                            }}
                            className="px-3 py-1 text-xs bg-blue-600/40 hover:bg-blue-600/60 text-white rounded transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePotion(potion.id)}
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
        {(currentPage > 1 || hasNextPage) && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-2xl px-2"
            >
              &lt;
            </button>
            <span className="text-white/60 text-sm">
              Page {currentPage}
            </span>
            <button
              onClick={() => {
                if (hasNextPage) setCurrentPage((p) => p + 1);
              }}
              disabled={!hasNextPage}
              className="text-white/70 hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all text-2xl px-2"
            >
              &gt;
            </button>
          </div>
        )}
      </div>

      {/* Add modal */}
      <FormModal<PotionData>
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddPotion}
        title="Add Potion"
        fields={POTION_FORM_FIELDS}
      />

      {/* Edit modal */}
      {editingPotion && (
        <EditPotionModal
          potion={editingPotion}
          onClose={() => setEditingPotion(null)}
          onSave={handleSavePotion}
        />
      )}
    </main>
  );
}