"use client";

import { useMemo, useState, type FormEvent, type MouseEvent } from "react";
import type { DialogueForm } from "../src/game/dialogue/playback";
type DialogueFormModalProps = {
  form: DialogueForm;
  onSubmit: (values: Record<string, string>) => void;
};

export function DialogueFormModal({ form, onSubmit }: DialogueFormModalProps) {
  const initialSelectValues = useMemo(() => {
    const values: Record<string, string> = {};
    for (const field of form.fields) {
      if (field.type === "select") {
        values[field.name] = field.options[0]?.value ?? "";
      }
    }
    return values;
  }, [form]);

  const initialCheckboxValues = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const field of form.fields) {
      if (field.type === "checkboxes") {
        map[field.name] = new Set<string>();
      }
    }
    return map;
  }, [form]);

  const [selectValues, setSelectValues] = useState(initialSelectValues);
  const [checkboxValues, setCheckboxValues] = useState(initialCheckboxValues);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    for (const field of form.fields) {
      if (field.type === "select" && field.required && !selectValues[field.name]) {
        return;
      }
    }

    const out: Record<string, string> = { ...selectValues };
    for (const field of form.fields) {
      if (field.type === "checkboxes") {
        const selected = checkboxValues[field.name];
        out[field.name] = selected ? [...selected].sort().join(",") : "";
      }
    }
    onSubmit(out);
  };

  const stopPropagation = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="dmr-dialogue-form-backdrop" role="presentation">
      <div
        className="dmr-dialogue-form"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dmr-dialogue-form-title"
        onClick={stopPropagation}
      >
        <h2 id="dmr-dialogue-form-title" className="dmr-dialogue-form__title">
          {form.title}
        </h2>
        <form className="dmr-dialogue-form__body" onSubmit={handleSubmit}>
          {form.fields.map((field) => {
            if (field.type === "select") {
              return (
                <label key={field.name} className="dmr-dialogue-form__field">
                  <span className="dmr-dialogue-form__label">{field.label}</span>
                  <select
                    className="dmr-dialogue-form__select"
                    name={field.name}
                    value={selectValues[field.name] ?? ""}
                    required={field.required}
                    onChange={(e) =>
                      setSelectValues((prev) => ({ ...prev, [field.name]: e.target.value }))
                    }
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value || "__empty"} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              );
            }

            if (field.type === "checkboxes") {
              const checked = checkboxValues[field.name] ?? new Set<string>();
              return (
                <fieldset key={field.name} className="dmr-dialogue-form__field">
                  <legend className="dmr-dialogue-form__label">{field.label}</legend>
                  <div className="dmr-dialogue-form__checkboxes">
                    {field.options.map((opt) => (
                      <label key={opt.value} className="dmr-dialogue-form__checkbox">
                        <input
                          type="checkbox"
                          name={field.name}
                          value={opt.value}
                          checked={checked.has(opt.value)}
                          onChange={(e) => {
                            setCheckboxValues((prev) => {
                              const next = new Set(prev[field.name]);
                              if (e.target.checked) next.add(opt.value);
                              else next.delete(opt.value);
                              return { ...prev, [field.name]: next };
                            });
                          }}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            }

            return null;
          })}
          <button type="submit" className="dmr-dialogue-form__submit">
            {form.submitLabel ?? "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
