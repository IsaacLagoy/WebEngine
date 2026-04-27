"use client";

import { useState, useEffect } from "react";
import BaseModal from "./BaseModal";

export type SubFieldConfig = {
  key: string;
  label: string;
  type: "text" | "number";
  required?: boolean;
  placeholder?: string;
};

export type FieldConfig = {
  key: string;
  label: string;
  type: "text" | "number" | "array" | "select" | "conditional";
  required?: boolean;
  options?: string[];           // For select type
  placeholder?: string;
  // For conditional type:
  triggerKey?: string;          // Which field controls visibility
  triggerValue?: string;        // Show when triggerKey equals this value
  discriminatorKey?: string;    // The sub-select key (e.g. "type")
  discriminatorOptions?: string[];
  subFields?: Record<string, SubFieldConfig[]>; // Extra fields per discriminator value
};

type FormModalProps<T> = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: T) => Promise<void>;
  title: string;
  fields: FieldConfig[];
  initialData?: Partial<T>;
};

export default function FormModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
}: FormModalProps<T>) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [arrayInputs, setArrayInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      const initial: Record<string, any> = {};
      const arrayInputStates: Record<string, string> = {};

      fields.forEach((field) => {
        if (field.type === "array") {
          initial[field.key] = initialData?.[field.key] || [];
          arrayInputStates[field.key] = "";
        } else if (field.type === "conditional") {
          initial[field.key] = initialData?.[field.key] || null;
        } else {
          initial[field.key] = initialData?.[field.key] || "";
        }
      });

      setFormData(initial);
      setArrayInputs(arrayInputStates);
    }
  }, [isOpen, fields, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData as T);
      onClose();
    } catch (error) {
      console.error("Form submission error:", error);
      alert("Failed to submit form. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      // When a trigger field changes, clear any conditional fields that depend on it
      fields.forEach((field) => {
        if (field.type === "conditional" && field.triggerKey === key) {
          if (value !== field.triggerValue) {
            next[field.key] = null;
          }
        }
      });

      return next;
    });
  };

  // Update a single key inside a conditional object (e.g. targeting.range)
  const handleConditionalSubChange = (fieldKey: string, subKey: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: {
        ...(prev[fieldKey] || {}),
        [subKey]: value,
      },
    }));
  };

  // When the discriminator changes (e.g. targeting.type), reset the object
  const handleDiscriminatorChange = (fieldKey: string, discriminatorKey: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldKey]: { [discriminatorKey]: value },
    }));
  };

  const handleArrayInputChange = (key: string, value: string) => {
    setArrayInputs((prev) => ({ ...prev, [key]: value }));
  };

  const addArrayItem = (key: string) => {
    const value = arrayInputs[key]?.trim();
    if (!value) return;
    setFormData((prev) => ({
      ...prev,
      [key]: [...(prev[key] || []), value],
    }));
    setArrayInputs((prev) => ({ ...prev, [key]: "" }));
  };

  const removeArrayItem = (key: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_: any, i: number) => i !== index),
    }));
  };

  const handleArrayInputKeyDown = (key: string, e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addArrayItem(key);
    }
  };

  const inputClass =
    "w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-white/40";

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => {
          // Conditional field: only render if triggerKey matches triggerValue
          if (field.type === "conditional") {
            const isVisible = formData[field.triggerKey!] === field.triggerValue;
            if (!isVisible) return null;

            const discriminatorKey = field.discriminatorKey!;
            const currentObj = formData[field.key] || {};
            const selectedType = currentObj[discriminatorKey] || "";
            const extraFields = field.subFields?.[selectedType] || [];

            return (
              <div key={field.key} className="space-y-4">
                {/* Discriminator select */}
                <div>
                  <label className="block text-white/90 font-medium mb-2">
                    {field.label}
                  </label>
                  <select
                    value={selectedType}
                    onChange={(e) =>
                      handleDiscriminatorChange(field.key, discriminatorKey, e.target.value)
                    }
                    className={inputClass}
                  >
                    <option value="">Select {field.label}</option>
                    {field.discriminatorOptions?.map((opt) => (
                      <option key={opt} value={opt} className="bg-gray-800">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub-fields for selected discriminator */}
                {extraFields.map((sub) => (
                  <div key={sub.key}>
                    <label className="block text-white/90 font-medium mb-2">
                      {sub.label}
                      {sub.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <input
                      type={sub.type === "number" ? "number" : "text"}
                      value={currentObj[sub.key] ?? ""}
                      onChange={(e) =>
                        handleConditionalSubChange(
                          field.key,
                          sub.key,
                          sub.type === "number" ? Number(e.target.value) : e.target.value
                        )
                      }
                      placeholder={sub.placeholder}
                      required={sub.required}
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div key={field.key}>
              <label className="block text-white/90 font-medium mb-2">
                {field.label}
                {field.required && <span className="text-red-400 ml-1">*</span>}
              </label>

              {field.type === "text" && (
                <input
                  type="text"
                  value={formData[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  required={field.required}
                  className={inputClass}
                />
              )}

              {field.type === "number" && (
                <input
                  type="number"
                  value={formData[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, Number(e.target.value))}
                  placeholder={field.placeholder}
                  required={field.required}
                  className={inputClass}
                />
              )}

              {field.type === "select" && (
                <select
                  value={formData[field.key] || ""}
                  onChange={(e) => handleInputChange(field.key, e.target.value)}
                  required={field.required}
                  className={inputClass}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option) => (
                    <option key={option} value={option} className="bg-gray-800">
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {field.type === "array" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={arrayInputs[field.key] || ""}
                      onChange={(e) => handleArrayInputChange(field.key, e.target.value)}
                      onKeyDown={(e) => handleArrayInputKeyDown(field.key, e)}
                      placeholder={field.placeholder || `Add ${field.label.toLowerCase()}`}
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
                    <div className="flex flex-wrap gap-2 mt-2">
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
              )}
            </div>
          );
        })}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </BaseModal>
  );
}