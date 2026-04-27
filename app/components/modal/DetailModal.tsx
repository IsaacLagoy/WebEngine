"use client";

import { useState, useEffect } from "react";
import BaseModal from "./BaseModal";
import { FieldConfig } from "./FormModal";

export type DisplayFieldConfig = {
  key: string;
  label: string;
  render?: (value: any) => React.ReactNode;
};

type DetailModalProps<T> = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: T | null;
  fields: DisplayFieldConfig[];
  // Edit mode — provide these to enable editing
  editFields?: FieldConfig[];
  onSave?: (updated: T) => Promise<void>;
};

export default function DetailModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  title,
  data,
  fields,
  editFields,
  onSave,
}: DetailModalProps<T>) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Initialise form data when entering edit mode
  useEffect(() => {
    if (isEditing && data && editFields) {
      const initial: Record<string, any> = {};
      const arrayStates: Record<string, string> = {};
      editFields.forEach((field) => {
        if (field.type === "array") {
          initial[field.key] = data[field.key] ?? [];
          arrayStates[field.key] = "";
        } else if (field.type === "select" && typeof data[field.key] === "boolean") {
          initial[field.key] = String(data[field.key]);
        } else {
          initial[field.key] = data[field.key] ?? "";
        }
      });
      setFormData(initial);
      setArrayInputs(arrayStates);
    }
  }, [isEditing, data, editFields]);

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!isOpen) setIsEditing(false);
  }, [isOpen]);

  if (!data) return null;

  // ----------------------------------------------------------------
  // Edit helpers
  // ----------------------------------------------------------------

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleArrayInputChange = (key: string, value: string) => {
    setArrayInputs((prev) => ({ ...prev, [key]: value }));
  };

  const addArrayItem = (key: string) => {
    const value = arrayInputs[key]?.trim();
    if (!value) return;
    setFormData((prev) => ({ ...prev, [key]: [...(prev[key] || []), value] }));
    setArrayInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const removeArrayItem = (key: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(formData as T);
      setIsEditing(false);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------------
  // Read-only rendering
  // ----------------------------------------------------------------

  const renderValue = (field: DisplayFieldConfig) => {
    const value = data[field.key];
    if (field.render) return field.render(value);

    if (Array.isArray(value)) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.length > 0 ? (
            value.map((item, index) => (
              <span
                key={index}
                className="inline-block px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm"
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-white/50 italic">None</span>
          )}
        </div>
      );
    }
    if (typeof value === "boolean") {
      return <span className="text-white/90">{value ? "Yes" : "No"}</span>;
    }
    if (value === null || value === undefined || value === "") {
      return <span className="text-white/50 italic">Not set</span>;
    }
    return <span className="text-white/90">{String(value)}</span>;
  };

  // ----------------------------------------------------------------
  // Edit field rendering
  // ----------------------------------------------------------------

  const inputClass =
    "w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40";

  const renderEditField = (field: FieldConfig) => {
    if (field.type === "text") {
      return (
        <input
          type="text"
          value={formData[field.key] ?? ""}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          value={formData[field.key] ?? ""}
          onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
          placeholder={field.placeholder}
          className={inputClass}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          value={formData[field.key] ?? ""}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          className={inputClass}
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt} className="bg-gray-800">
              {opt}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "array") {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={arrayInputs[field.key] ?? ""}
              onChange={(e) => handleArrayInputChange(field.key, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); addArrayItem(field.key); }
              }}
              placeholder={field.placeholder ?? `Add ${field.label.toLowerCase()}`}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40"
            />
            <button
              type="button"
              onClick={() => addArrayItem(field.key)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          {formData[field.key]?.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData[field.key].map((item: string, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white/90 text-sm"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeArrayItem(field.key, index)}
                    className="text-white/70 hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (field.type === "conditional") {
      const discriminatorKey = field.discriminatorKey!;
      const currentObj = formData[field.key] || {};
      const selectedType = currentObj[discriminatorKey] ?? "";
      const extraFields = field.subFields?.[selectedType] ?? [];
      const isVisible = !field.triggerKey || formData[field.triggerKey!] === field.triggerValue;
      if (!isVisible) return null;

      return (
        <div className="space-y-4">
          <select
            value={selectedType}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                [field.key]: { [discriminatorKey]: e.target.value },
              }))
            }
            className={inputClass}
          >
            <option value="">Select {field.label}</option>
            {field.discriminatorOptions?.map((opt) => (
              <option key={opt} value={opt} className="bg-gray-800">{opt}</option>
            ))}
          </select>
          {extraFields.map((sub) => (
            <div key={sub.key}>
              <label className="block text-white/70 text-sm font-medium mb-1">{sub.label}</label>
              <input
                type={sub.type === "number" ? "number" : "text"}
                value={currentObj[sub.key] ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    [field.key]: {
                      ...prev[field.key],
                      [sub.key]: sub.type === "number" ? Number(e.target.value) : e.target.value,
                    },
                  }))
                }
                placeholder={sub.placeholder}
                className={inputClass}
              />
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  // ----------------------------------------------------------------
  // Render
  // ----------------------------------------------------------------

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? `Edit ${title}` : title}>
      {isEditing && editFields ? (
        <div className="space-y-4">
          {editFields.map((field) => {
            // Skip conditional fields that aren't visible
            if (field.type === "conditional") {
              const isVisible = !field.triggerKey || formData[field.triggerKey!] === field.triggerValue;
              if (!isVisible) return null;
            }
            return (
              <div key={field.key}>
                <label className="block text-white/70 text-sm font-medium mb-1">
                  {field.label}
                  {field.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {renderEditField(field)}
              </div>
            );
          })}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={saving}
              className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.key}>
                <div className="text-white/70 text-sm font-medium mb-1">{field.label}</div>
                <div className="text-white/90">{renderValue(field)}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-white/10 flex gap-3">
            {onSave && editFields && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-6 py-3 bg-blue-600/60 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </>
      )}
    </BaseModal>
  );
}