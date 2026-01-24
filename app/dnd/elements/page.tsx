"use client";

import { useEffect, useState, useCallback } from "react";
import { MagicElement, MagicElementData, readCollection, addToCollectionBatch, addToCollection } from "@/lib/firebase";
import Glass from "@/app/components/Glass";
import FormModal, { FieldConfig } from "@/app/components/FormModal";
import DetailModal, { DisplayFieldConfig } from "@/app/components/DetailModal";

// Define form fields based on MagicElementData type
const MAGIC_ELEMENT_FIELDS: FieldConfig[] = [
  {
    key: "name",
    label: "Element Name",
    type: "text",
    required: true,
    placeholder: "e.g., Fire, Water, Lightning",
  },
  {
    key: "weaknessIds",
    label: "Weaknesses",
    type: "array",
    placeholder: "Enter element ID (e.g., water, fire)",
  },
];

// Define display fields for detail modal
const MAGIC_ELEMENT_DISPLAY_FIELDS: DisplayFieldConfig[] = [
  {
    key: "name",
    label: "Element Name",
  },
  {
    key: "weaknessIds",
    label: "Weaknesses",
  },
];

export default function MagicElementsPage() {
  const [elements, setElements] = useState<MagicElement[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState<MagicElement | null>(null);

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

  async function handleAddElement(data: MagicElementData) {
    // Convert name to ID format (lowercase, no spaces)
    const elementId = data.name.toLowerCase().replace(/\s+/g, "-");
    
    try {
      // Using the element ID as document ID will update if exists, create if new
      await addToCollection("magicElements", data, elementId);
      await loadElements();
    } catch (err: any) {
      console.error("Error adding element:", err);
      if (err?.code === "permission-denied") {
        alert("Permission denied. Please sign in to add elements.");
      }
      throw err;
    }
  }

  const handleElementClick = (element: MagicElement) => {
    setSelectedElement(element);
    setIsDetailModalOpen(true);
  };

  useEffect(() => {
    loadElements();
  }, [loadElements]);

  return (
    <main className="min-h-screen pt-24 px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Magic Elements
        </h1>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setIsFormModalOpen(true)}
            className="px-6 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all backdrop-blur-sm border border-blue-500/30"
          >
            Add Element
          </button>
        </div>

        {initialLoading ? (
          <div className="text-white/70 text-lg">Loading elements...</div>
        ) : elements.length === 0 ? (
          <div className="text-white/70 text-lg">No elements found. Click "Add Element" or "Seed Magic Elements" to get started.</div>
        ) : (
          <ul className="space-y-3">
            {elements.map((el) => (
              <li key={el.id}>
                <Glass 
                  className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => handleElementClick(el)}
                >
                  <div className="text-white font-semibold text-lg">
                    {el.name}
                  </div>
                </Glass>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FormModal<MagicElementData>
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleAddElement}
        title="Add Magic Element"
        fields={MAGIC_ELEMENT_FIELDS}
      />

      <DetailModal<MagicElement>
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedElement?.name || "Element Details"}
        data={selectedElement}
        fields={MAGIC_ELEMENT_DISPLAY_FIELDS}
      />
    </main>
  );
}