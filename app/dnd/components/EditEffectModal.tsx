"use client";

import { MouseEvent, useState } from "react";
import Glass from "@/app/components/Glass";
import { FieldConfig } from "@/app/components/modal/FormModal";

export const BASE_EFFECT_FIELDS: FieldConfig[] = [
  { key: "name",        label: "Name",        type: "text",   required: true },
  { key: "description", label: "Description", type: "text",   required: true, placeholder: "Use %c for level/dice, %s for stat, %e for element" },
  { key: "base",        label: "Base Cost",   type: "number", required: true },
  { key: "linear",      label: "Linear",      type: "number", required: true },
  { key: "quadratic",   label: "Quadratic",   type: "number", required: true },
  { key: "exponential", label: "Exponential", type: "number", required: true },
  { key: "form",        label: "Form Fields", type: "array",  placeholder: "level, dice, stat, or element" },
];

type EditableItem = { id?: string };

interface Props<T extends EditableItem> {
  title: string;
  item: T;
  extraFields?: FieldConfig[]; // e.g. interval for potions, type for enchantments
  includeBaseFields?: boolean;
  onClose: () => void;
  onSave: (updated: T, oldId: string) => Promise<void>;
}

export default function EditEffectModal<T extends EditableItem>({
  title,
  item,
  extraFields = [],
  includeBaseFields = true,
  onClose,
  onSave,
}: Props<T>) {
  const allFields = includeBaseFields ? [...BASE_EFFECT_FIELDS, ...extraFields] : extraFields;

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    allFields.forEach((f) => {
      if (f.type === "array") {
        init[f.key] = Array.isArray((item as any)[f.key]) ? [...(item as any)[f.key]] : [];
      } else {
        init[f.key] = (item as any)[f.key] ?? (f.type === "number" ? 0 : "");
      }
    });
    return init;
  });
  const [arrayInput, setArrayInput] = useState("");
  const [saving, setSaving] = useState(false);

  const inputClass =
    "w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40";

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(formData as T, item.id ?? "");
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <Glass
        className="relative w-full max-w-lg p-6 z-10 max-h-[80vh] overflow-y-auto"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">×</button>
        </div>

        <div className="space-y-4">
          {allFields.map((field) => (
            <div key={field.key}>
              <label className="block text-white/70 text-sm font-medium mb-1">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  value={formData[field.key] ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              )}
              {field.type === "number" && (
                <input
                  type="number"
                  value={formData[field.key] ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: Number(e.target.value) }))}
                  className={inputClass}
                />
              )}
              {field.type === "select" && (
                <select
                  value={formData[field.key] ?? ""}
                  onChange={(e) => setFormData((p) => ({ ...p, [field.key]: e.target.value }))}
                  className={inputClass}
                >
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt} className="bg-gray-800">{opt}</option>
                  ))}
                </select>
              )}
              {field.type === "array" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={arrayInput}
                      onChange={(e) => setArrayInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const v = arrayInput.trim();
                          if (v) {
                            setFormData((p) => ({ ...p, [field.key]: [...(p[field.key] || []), v] }));
                            setArrayInput("");
                          }
                        }
                      }}
                      placeholder={field.placeholder}
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const v = arrayInput.trim();
                        if (v) {
                          setFormData((p) => ({ ...p, [field.key]: [...(p[field.key] || []), v] }));
                          setArrayInput("");
                        }
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(formData[field.key] || []).map((item: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm"
                      >
                        {item}
                        <button
                          onClick={() =>
                            setFormData((p) => ({
                              ...p,
                              [field.key]: p[field.key].filter((_: any, j: number) => j !== i),
                            }))
                          }
                          className="text-white/70 hover:text-white"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </Glass>
    </div>
  );
}