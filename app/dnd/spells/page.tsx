"use client";

import { useEffect, useState, useCallback } from "react";
import { useIsAdmin } from "@/app/dnd/hooks/useIsAdmin";
import { Spell, SpellData, readCollectionPage, readDocumentById, addToCollection, removeFromCollection } from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import FormModal, { FieldConfig } from "@/app/components/modal/FormModal";
import DetailModal, { DisplayFieldConfig } from "@/app/components/modal/DetailModal";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

const PAGE_SIZE = 50;

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
// Field configs
// ------------------------------------------------------------

const SPELL_FIELDS: FieldConfig[] = [
  {
    key: "name",
    label: "Spell Name",
    type: "text",
    required: true,
    placeholder: "e.g., Fireball, Cure Wounds",
  },
  {
    key: "description",
    label: "Description",
    type: "text",
    placeholder: "What does this spell do?",
  },
  {
    key: "cost",
    label: "MP Cost",
    type: "number",
    required: true,
    placeholder: "e.g., 10",
  },
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
      self: [],
      aoe:   [{ key: "range",  label: "Range (ft)",    type: "number", required: true }],
      cone:  [{ key: "radius", label: "Radius (ft)",   type: "number", required: true }],
      chain: [
        { key: "count", label: "Target Count", type: "number", required: true },
        { key: "range", label: "Range (ft)",   type: "number", required: true },
      ],
    },
  },
];

const SPELL_DISPLAY_FIELDS: DisplayFieldConfig[] = [
  { key: "name",        label: "Spell Name" },
  { key: "description", label: "Description" },
  { key: "cost",        label: "MP Cost", render: (value) => `${value} MP` },
  { key: "damaging",    label: "Damaging", render: (value) => (value ? "Yes" : "No") },
  { key: "targeting",   label: "Targeting", render: (value) => formatTargeting(value as SpellData["targeting"]) },
];

// ------------------------------------------------------------
// Page
// ------------------------------------------------------------

export default function SpellsPage() {
  const [spells, setSpells] = useState<Spell[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const isAdmin = useIsAdmin();
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<Spell | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorByPage, setCursorByPage] = useState<Record<number, string | undefined>>({ 1: undefined });
  const [hasNextPage, setHasNextPage] = useState(false);

  const loadSpells = useCallback(async () => {
    try {
      const afterId = cursorByPage[currentPage];
      const result = await readCollectionPage<SpellData>("spells", PAGE_SIZE, afterId, true);
      setSpells(result.items);
      setHasNextPage(result.nextCursor !== null);
      setCursorByPage((prev) => {
        if (!result.nextCursor) return prev;
        if (prev[currentPage + 1] === result.nextCursor) return prev;
        return { ...prev, [currentPage + 1]: result.nextCursor };
      });
    } catch (err: any) {
      console.error("Error loading spells:", err);
      if (err?.code === "permission-denied") {
        console.error("Firestore permission denied. Please update your Firestore security rules.");
      }
    } finally {
      setInitialLoading(false);
    }
  }, [currentPage, cursorByPage]);

  async function handleAddSpell(data: SpellData) {
    const coerced = {
      ...data,
      damaging: data.damaging === ("true" as any),
    };
    const spellId = coerced.name.toLowerCase().replace(/\s+/g, "-");
    try {
      await addToCollection("spells", coerced, spellId);
      setCurrentPage(1);
      setCursorByPage({ 1: undefined });
      await loadSpells();
    } catch (err: any) {
      console.error("Error adding spell:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to add spells.");
      }
      throw err;
    }
  }

  async function handleDeleteSpell(spellId: string) {
    try {
      await removeFromCollection("spells", spellId);
      await loadSpells();
    } catch (err: any) {
      console.error("Error deleting spell:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to delete spells.");
      }
      throw err;
    }
  }

  async function handleSaveSpell(updated: SpellData, oldId: string) {
    const newId = updated.name.toLowerCase().replace(/\s+/g, "-");
    if (newId !== oldId) await removeFromCollection("spells", oldId);
    await addToCollection("spells", updated, newId);
    await loadSpells();
    setSelectedSpell({ ...updated, id: newId });
  }

  function normalizeUpdatedSpell(updated: SpellData): SpellData {
    return {
      ...updated,
      cost: Number(updated.cost),
      damaging: updated.damaging === true || String(updated.damaging) === "true",
    };
  }

  const handleSpellClick = (spell: Spell) => {
    readDocumentById<SpellData>("spells", spell.id, true)
      .then((fullSpell) => {
        setSelectedSpell(fullSpell ?? spell);
        setIsDetailModalOpen(true);
      })
      .catch(() => {
        setSelectedSpell(spell);
        setIsDetailModalOpen(true);
      });
  };

  useEffect(() => {
    loadSpells();
  }, [loadSpells]);

  return (
    <main className="min-h-screen pt-24 px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Spells
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
          <div className="text-white/70 text-lg">Loading spells...</div>
        ) : spells.length === 0 ? (
          <div className="text-white/70 text-lg">
            No spells found. Click "Add" to create one, or seed from your JSON file.
          </div>
        ) : (
          <>
            <ul className="space-y-3">
              {spells.map((spell) => (
                <li key={spell.id}>
                  <Glass
                    className="p-4 cursor-pointer hover:bg-white/10 transition-colors flex items-center justify-between relative"
                    onClick={() => handleSpellClick(spell)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-white font-semibold text-lg">
                        {spell.name}
                      </div>
                      <div className="text-white/50 text-sm">
                        {spell.cost} MP
                      </div>
                      {spell.damaging && (
                        <div className="text-red-400/80 text-xs font-medium uppercase tracking-wide">
                          Damaging
                        </div>
                      )}
                      {spell.targeting && (
                        <div className="text-white/40 text-xs">
                          {formatTargeting(spell.targeting)}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSpell(spell.id);
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

            {(currentPage > 1 || hasNextPage) && (
              <div className="flex items-center justify-center gap-4 mt-8">
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
          </>
        )}
      </div>

      <FormModal<SpellData>
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleAddSpell}
        title="Add Spell"
        fields={SPELL_FIELDS}
      />

      <DetailModal<SpellData>
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedSpell?.name || "Spell Details"}
        data={selectedSpell}
        fields={SPELL_DISPLAY_FIELDS}
        editFields={isAdmin ? SPELL_FIELDS : undefined}
        onSave={
          isAdmin && selectedSpell
            ? async (updated) => handleSaveSpell(normalizeUpdatedSpell(updated), selectedSpell.id)
            : undefined
        }
      />
    </main>
  );
}