"use client";

import { STATS, DICE_SIDES, DiceSides, parsePositiveInteger } from "@/app/dnd/utils/effectUtils";

export interface FormFieldsState {
  levelInput: string;
  stableLevel: number;
  diceCountInput: string;
  stableDiceCount: number;
  diceSides: DiceSides;
  stat: string;
  element: string;
}

export function defaultFormFieldsState(): FormFieldsState {
  return {
    levelInput: "1",
    stableLevel: 1,
    diceCountInput: "1",
    stableDiceCount: 1,
    diceSides: 6,
    stat: STATS[0],
    element: "",
  };
}

interface Props {
  form: string[];
  state: FormFieldsState;
  elements: string[];
  onChange: (next: Partial<FormFieldsState>) => void;
}

export default function EnchantmentFormFields({ form, state, elements, onChange }: Props) {
  const hasDice    = form.includes("dice");
  const hasLevel   = form.includes("level") && !hasDice;
  const hasStat    = form.includes("stat");
  const hasElement = form.includes("element");

  if (!hasLevel && !hasDice && !hasStat && !hasElement) return null;

  const levelInvalid     = parsePositiveInteger(state.levelInput) === null;
  const diceCountInvalid = parsePositiveInteger(state.diceCountInput) === null;

  const inputClass =
    "px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/40";

  return (
    <div className="flex flex-col gap-4">
      {hasLevel && (
        <div className="flex items-center gap-4">
          <label className="text-white/60 text-sm w-24 shrink-0">Level</label>
          <div className="flex-1 space-y-2">
            <input
              type="text"
              inputMode="numeric"
              value={state.levelInput}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({ levelInput: raw });
                const parsed = parsePositiveInteger(raw);
                if (parsed !== null) onChange({ stableLevel: parsed });
              }}
              className={`w-full ${inputClass}`}
            />
            {levelInvalid && (
              <span className="inline-flex px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-200 border border-red-400/40">
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
              value={state.diceCountInput}
              onChange={(e) => {
                const raw = e.target.value;
                onChange({ diceCountInput: raw });
                const parsed = parsePositiveInteger(raw);
                if (parsed !== null) onChange({ stableDiceCount: parsed });
              }}
              className={`w-24 ${inputClass}`}
              placeholder="count"
            />
            <span className="text-white/60">d</span>
            <select
              value={state.diceSides}
              onChange={(e) =>
                onChange({ diceSides: Number(e.target.value) as DiceSides })
              }
              className={`w-28 ${inputClass}`}
            >
              {DICE_SIDES.map((s) => (
                <option key={s} value={s} className="bg-gray-800">{s}</option>
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
            value={state.stat}
            onChange={(e) => onChange({ stat: e.target.value })}
            className={`flex-1 ${inputClass}`}
          >
            {STATS.map((s) => (
              <option key={s} value={s} className="bg-gray-800">{s}</option>
            ))}
          </select>
        </div>
      )}

      {hasElement && (
        <div className="flex items-center gap-4">
          <label className="text-white/60 text-sm w-24 shrink-0">Element</label>
          <select
            value={state.element}
            onChange={(e) => onChange({ element: e.target.value })}
            className={`flex-1 ${inputClass}`}
          >
            {elements.map((el) => (
              <option key={el} value={el} className="bg-gray-800">{el}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}