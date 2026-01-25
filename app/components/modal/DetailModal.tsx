"use client";

import BaseModal from "./BaseModal";

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
};

export default function DetailModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  title,
  data,
  fields,
}: DetailModalProps<T>) {
  if (!data) return null;

  const renderValue = (field: DisplayFieldConfig) => {
    const value = data[field.key];

    if (field.render) {
      return field.render(value);
    }

    // Default rendering based on type
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

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <div className="text-white/70 text-sm font-medium mb-1">
              {field.label}
            </div>
            <div className="text-white/90">{renderValue(field)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-white/10">
        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </BaseModal>
  );
}