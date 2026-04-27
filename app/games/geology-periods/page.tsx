"use client";

import { useState, useEffect } from "react";
import Glass from "../../components/Glass";
import { HeaderCell, Cell } from "./Cells";

const ALL_ANSWERS = [
  "Phanerozoic", "Proterozoic", "Archean", "Hadean",
  "Cenozoic", "Mesozoic", "Paleozoic",
  "Quaternary", "Neogene", "Paleogene", "Tertiary", "Cretaceous", "Jurassic", "Triassic", "Permian",
  "Carboniferous", "Pennsylvanian", "Mississippian", "Devonian", "Silurian", "Ordovician", "Cambrian", "Ediacaran",
  "Holocene", "Pleistocene", "Pliocene", "Miocene", "Oligocene", "Eocene", "Paleocene",
  "0.012", "2.6", "5.3", "23.0", "33.9", "55.8", "66", "146", "200", "252", "299", "318", "359", "416", "444", "488", "541", "635", "2500", "4000", "4600",
];

const initialValues = Object.fromEntries(ALL_ANSWERS.map((a) => [a, ""]));

export default function GamesPage() {
  const [reveal, setReveal] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [timerRunning, setTimerRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  const updateValue = (answer: string, v: string) => {
    setValues((prev) => ({ ...prev, [answer]: v }));
  };

  const allCorrect = ALL_ANSWERS.every(
    (answer) => values[answer]?.trim().toLowerCase() === answer.trim().toLowerCase()
  );

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    if (timerRunning && allCorrect) {
      setTimerRunning(false);
      setShowCompletionPopup(true);
    }
  }, [timerRunning, allCorrect]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-12">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Geologic Time Periods
          </h1>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => {
                if (!timerRunning && elapsedSeconds === 0) {
                  setTimerRunning(true);
                }
              }}
              disabled={timerRunning || allCorrect}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md bg-white/20 text-white hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Timer
            </button>
            <button
              onClick={() => setReveal(!reveal)}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md bg-white/20 text-white hover:bg-white/30 transition"
            >
              {reveal ? "Hide Answers" : "Reveal Answers"}
            </button>
            {(timerRunning || elapsedSeconds > 0) && (
              <div className="h-full bg-white/10 shadow-inner rounded-md flex items-center px-3 text-white text-sm">
                {formatTime(elapsedSeconds)}
              </div>
            )}
          </div>
        </section>

        {/* Chart */}
        <section className="flex justify-center">
          <Glass className="p-2 sm:p-4 md:p-6 lg:p-10 max-w-[800px] w-full">
            <div className="grid grid-cols-6 gap-0.5">

              {/* EONS */}
              <div className="col-span-1 grid grid-rows-23 gap-0.5">
                <HeaderCell>Eons</HeaderCell>
                <Cell answer="Phanerozoic" reveal={reveal} span={17} value={values["Phanerozoic"]} onChange={(v) => updateValue("Phanerozoic", v)} />
                <Cell answer="Proterozoic" reveal={reveal} span={2} value={values["Proterozoic"]} onChange={(v) => updateValue("Proterozoic", v)} />
                <Cell answer="Archean" reveal={reveal} span={1} value={values["Archean"]} onChange={(v) => updateValue("Archean", v)} />
                <Cell answer="Hadean" reveal={reveal} span={1} value={values["Hadean"]} onChange={(v) => updateValue("Hadean", v)} />
              </div>

              {/* ERAS */}
              <div className="col-span-1 grid grid-rows-23 gap-0.5">
                <HeaderCell>Eras</HeaderCell>
                <Cell answer="Cenozoic" reveal={reveal} span={7} value={values["Cenozoic"]} onChange={(v) => updateValue("Cenozoic", v)} />
                <Cell answer="Mesozoic" reveal={reveal} span={3} value={values["Mesozoic"]} onChange={(v) => updateValue("Mesozoic", v)} />
                <Cell answer="Paleozoic" reveal={reveal} span={7} value={values["Paleozoic"]} onChange={(v) => updateValue("Paleozoic", v)} />
              </div>

              {/* PERIODS */}
              <div className="col-span-2 grid grid-rows-23 gap-0.5">
                <HeaderCell>Periods</HeaderCell>
                <Cell answer="Quaternary" reveal={reveal} span={2} value={values["Quaternary"]} onChange={(v) => updateValue("Quaternary", v)} />

                <div className="row-span-5">
                  <div className="grid grid-cols-2 h-full gap-1">
                    <div className="grid grid-rows-5 gap-1 h-full">
                      <Cell answer="Neogene" reveal={reveal} span={2} value={values["Neogene"]} onChange={(v) => updateValue("Neogene", v)}/>
                      <Cell answer="Paleogene" reveal={reveal} span={3} value={values["Paleogene"]} onChange={(v) => updateValue("Paleogene", v)}/>
                    </div>
                    <Cell answer="Tertiary" reveal={reveal} value={values["Tertiary"]} onChange={(v) => updateValue("Tertiary", v)} />
                  </div>
                </div>

                <Cell answer="Cretaceous" reveal={reveal} span={1} value={values["Cretaceous"]} onChange={(v) => updateValue("Cretaceous", v)} />
                <Cell answer="Jurassic" reveal={reveal} span={1} value={values["Jurassic"]} onChange={(v) => updateValue("Jurassic", v)} />
                <Cell answer="Triassic" reveal={reveal} span={1} value={values["Triassic"]} onChange={(v) => updateValue("Triassic", v)} />
                <Cell answer="Permian" reveal={reveal} span={1} value={values["Permian"]} onChange={(v) => updateValue("Permian", v)} />

                {/* Carboniferous nested */}
                <div className="row-span-2">
                  <div className="grid grid-cols-2 h-full gap-1">
                    <Cell answer="Carboniferous" reveal={reveal} value={values["Carboniferous"]} onChange={(v) => updateValue("Carboniferous", v)} />
                    <div className="grid grid-rows-2 gap-1 h-full">
                      <Cell answer="Pennsylvanian" reveal={reveal} value={values["Pennsylvanian"]} onChange={(v) => updateValue("Pennsylvanian", v)} />
                      <Cell answer="Mississippian" reveal={reveal} value={values["Mississippian"]} onChange={(v) => updateValue("Mississippian", v)} />
                    </div>
                  </div>
                </div>

                <Cell answer="Devonian" reveal={reveal} span={1} value={values["Devonian"]} onChange={(v) => updateValue("Devonian", v)} />
                <Cell answer="Silurian" reveal={reveal} span={1} value={values["Silurian"]} onChange={(v) => updateValue("Silurian", v)} />
                <Cell answer="Ordovician" reveal={reveal} span={1} value={values["Ordovician"]} onChange={(v) => updateValue("Ordovician", v)} />
                <Cell answer="Cambrian" reveal={reveal} span={1} value={values["Cambrian"]} onChange={(v) => updateValue("Cambrian", v)} />
                <Cell answer="Ediacaran" reveal={reveal} span={1} value={values["Ediacaran"]} onChange={(v) => updateValue("Ediacaran", v)} />
              </div>

              {/* EPOCHS */}
              <div className="col-span-1 grid grid-rows-23 gap-0.5">
                <HeaderCell>Epochs</HeaderCell>
                <Cell answer="Holocene" reveal={reveal} span={1} value={values["Holocene"]} onChange={(v) => updateValue("Holocene", v)} />
                <Cell answer="Pleistocene" reveal={reveal} span={1} value={values["Pleistocene"]} onChange={(v) => updateValue("Pleistocene", v)} />
                <Cell answer="Pliocene" reveal={reveal} span={1} value={values["Pliocene"]} onChange={(v) => updateValue("Pliocene", v)} />
                <Cell answer="Miocene" reveal={reveal} span={1} value={values["Miocene"]} onChange={(v) => updateValue("Miocene", v)} />
                <Cell answer="Oligocene" reveal={reveal} span={1} value={values["Oligocene"]} onChange={(v) => updateValue("Oligocene", v)} />
                <Cell answer="Eocene" reveal={reveal} span={1} value={values["Eocene"]} onChange={(v) => updateValue("Eocene", v)} />
                <Cell answer="Paleocene" reveal={reveal} span={1} value={values["Paleocene"]} onChange={(v) => updateValue("Paleocene", v)} />
              </div>

              <div className="col-span-1 grid grid-rows-23 gap-0.5">
                <HeaderCell>Dates (Ma)</HeaderCell>
                <Cell answer="0.012" reveal={reveal} span={1} value={values["0.012"]} onChange={(v) => updateValue("0.012", v)} />
                <Cell answer="2.6" reveal={reveal} span={1} value={values["2.6"]} onChange={(v) => updateValue("2.6", v)} />
                <Cell answer="5.3" reveal={reveal} span={1} value={values["5.3"]} onChange={(v) => updateValue("5.3", v)} />
                <Cell answer="23.0" reveal={reveal} span={1} value={values["23.0"]} onChange={(v) => updateValue("23.0", v)} />
                <Cell answer="33.9" reveal={reveal} span={1} value={values["33.9"]} onChange={(v) => updateValue("33.9", v)} />
                <Cell answer="55.8" reveal={reveal} span={1} value={values["55.8"]} onChange={(v) => updateValue("55.8", v)} />
                <Cell answer="66" reveal={reveal} span={1} value={values["66"]} onChange={(v) => updateValue("66", v)} />
                <Cell answer="146" reveal={reveal} span={1} value={values["146"]} onChange={(v) => updateValue("146", v)} />
                <Cell answer="200" reveal={reveal} span={1} value={values["200"]} onChange={(v) => updateValue("200", v)} />
                <Cell answer="252" reveal={reveal} span={1} value={values["252"]} onChange={(v) => updateValue("252", v)} />
                <Cell answer="299" reveal={reveal} span={1} value={values["299"]} onChange={(v) => updateValue("299", v)} />
                <Cell answer="318" reveal={reveal} span={1} value={values["318"]} onChange={(v) => updateValue("318", v)} />
                <Cell answer="359" reveal={reveal} span={1} value={values["359"]} onChange={(v) => updateValue("359", v)} />
                <Cell answer="416" reveal={reveal} span={1} value={values["416"]} onChange={(v) => updateValue("416", v)} />
                <Cell answer="444" reveal={reveal} span={1} value={values["444"]} onChange={(v) => updateValue("444", v)} />
                <Cell answer="488" reveal={reveal} span={1} value={values["488"]} onChange={(v) => updateValue("488", v)} />
                <Cell answer="541" reveal={reveal} span={1} value={values["541"]} onChange={(v) => updateValue("541", v)} />
                <Cell answer="635" reveal={reveal} span={1} value={values["635"]} onChange={(v) => updateValue("635", v)} />
                <Cell answer="2500" reveal={reveal} span={1} value={values["2500"]} onChange={(v) => updateValue("2500", v)} />
                <Cell answer="4000" reveal={reveal} span={1} value={values["4000"]} onChange={(v) => updateValue("4000", v)} />
                <Cell answer="4600" reveal={reveal} span={1} value={values["4600"]} onChange={(v) => updateValue("4600", v)} />
              </div>

            </div>
          </Glass>
        </section>
      </div>

      {/* Completion popup */}
      {showCompletionPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCompletionPopup(false)}
        >
          <div
            className="bg-white/95 dark:bg-slate-900/95 rounded-lg shadow-xl px-8 py-6 text-center max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Complete!</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-4">
              Your time: <span className="font-mono font-bold text-slate-900 dark:text-white">{formatTime(elapsedSeconds)}</span>
            </p>
            <button
              onClick={() => setShowCompletionPopup(false)}
              className="px-4 py-2 rounded-md bg-white/20 text-slate-800 dark:text-white hover:bg-white/30 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}