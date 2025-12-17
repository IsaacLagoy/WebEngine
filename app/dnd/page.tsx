"use client";

import { useEffect, useState, useCallback } from "react";
import { MagicElement, MagicElementData, readCollection, addToCollectionBatch } from "@/lib/firebase";

const ELEMENTS: Record<string, MagicElementData> = {
  fire: {
    name: "Fire",
    weaknessIds: ["water", "earth"],
  },
  water: {
    name: "Water",
    weaknessIds: ["lightning"],
  },
  lightning: {
    name: "Lightning",
    weaknessIds: ["earth"],
  },
  earth: {
    name: "Earth",
    weaknessIds: ["fire", "water"],
  },
};

export default function MagicElementsPage() {
  const [elements, setElements] = useState<MagicElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Memoize loadElements to prevent unnecessary re-renders
  const loadElements = useCallback(async () => {
    try {
      const data = await readCollection<MagicElementData>("magicElements");
      setElements(data);
    } catch (err: any) {
      console.error("Error loading elements:", err);
      if (err?.code === "permission-denied") {
        console.error(
          "Firestore permission denied. Please update your Firestore security rules in Firebase Console."
        );
      }
    } finally {
      setInitialLoading(false);
    }
  }, []);

  async function seedElements() {
    setLoading(true);

    try {
      await addToCollectionBatch("magicElements", ELEMENTS);
      await loadElements();
    } catch (err: any) {
      console.error("Error seeding elements:", err);
      if (err?.code === "permission-denied") {
        alert(
          "Permission denied. Please update your Firestore security rules in Firebase Console to allow read/write access to the 'magicElements' collection."
        );
      } else {
        alert("Seeding failed. Check console for details.");
      }
    } finally {
      setLoading(false);
    }
  }
  

  useEffect(() => {
    loadElements();
  }, [loadElements]);

  return (
    <main className="min-h-screen pt-24 px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Magic Elements
        </h1>

        <button
          onClick={seedElements}
          disabled={loading}
          className="mb-8 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-all backdrop-blur-sm border border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Seeding..." : "Seed Magic Elements"}
        </button>

        {initialLoading ? (
          <div className="text-white/70 text-lg">Loading elements...</div>
        ) : elements.length === 0 ? (
          <div className="text-white/70 text-lg">No elements found. Click "Seed Magic Elements" to get started.</div>
        ) : (
          <ul className="space-y-4">
            {elements.map((el) => (
              <li
                key={el.id}
                className="text-white/90 text-lg bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
              >
                <strong className="text-white font-semibold">{el.name}</strong>{" "}
                <span className="text-white/70">
                  (weak to: {el.weaknessIds.join(", ") || "none"})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
