"use client";

import { useState } from "react";
import Glass from "../../components/Glass";
import { HeaderCell, Cell } from "./Cells";

export default function GamesPage() {
  const [reveal, setReveal] = useState(false);

  return (
    <div className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-12">
        {/* Hero */}
        <section className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Geologic Time Periods
          </h1>
          <button
            onClick={() => setReveal(!reveal)}
            className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-md bg-white/20 text-white hover:bg-white/30 transition"
          >
            {reveal ? "Hide Answers" : "Reveal Answers"}
          </button>
        </section>

        {/* Chart */}
        <section className="flex justify-center">
          <Glass className="p-2 sm:p-4 md:p-6 lg:p-10 max-w-[800px] w-full">
            <div className="grid grid-cols-5 gap-0.5">

              {/* EONS */}
              <div className="col-span-1 grid grid-rows-22 gap-0.5">
                <HeaderCell>Eons</HeaderCell>
                <Cell answer="Phanerozoic" reveal={reveal} span={17} />
                <Cell answer="Proterozoic" reveal={reveal} span={1} />
                <Cell answer="Archean" reveal={reveal} span={1} />
                <Cell answer="Hadean" reveal={reveal} span={1} />
              </div>

              {/* ERAS */}
              <div className="col-span-1 grid grid-rows-22 gap-0.5">
                <HeaderCell>Eras</HeaderCell>
                <Cell answer="Cenozoic" reveal={reveal} span={7} />
                <Cell answer="Mesozoic" reveal={reveal} span={3} />
                <Cell answer="Paleozoic" reveal={reveal} span={7} />
              </div>

              {/* PERIODS */}
              <div className="col-span-2 grid grid-rows-22 gap-0.5">
                <HeaderCell>Periods</HeaderCell>
                <Cell answer="Quaternary" reveal={reveal} span={2} />
                <Cell answer="Neogene" reveal={reveal} span={2} />
                <Cell answer="Paleogene" reveal={reveal} span={3} />
                <Cell answer="Cretaceous" reveal={reveal} span={1} />
                <Cell answer="Jurassic" reveal={reveal} span={1} />
                <Cell answer="Triassic" reveal={reveal} span={1} />
                <Cell answer="Permian" reveal={reveal} span={1} />

                {/* Carboniferous nested */}
                <div className="row-span-2">
                  <div className="grid grid-cols-2 h-full gap-1">
                    <Cell answer="Carboniferous" reveal={reveal} />
                    <div className="grid grid-rows-2 gap-1 h-full">
                      <Cell answer="Pennsylvanian" reveal={reveal} />
                      <Cell answer="Mississippian" reveal={reveal} />
                    </div>
                  </div>
                </div>

                <Cell answer="Devonian" reveal={reveal} span={1} />
                <Cell answer="Silurian" reveal={reveal} span={1} />
                <Cell answer="Ordovician" reveal={reveal} span={1} />
                <Cell answer="Cambrian" reveal={reveal} span={1} />
              </div>

              {/* EPOCHS */}
              <div className="col-span-1 grid grid-rows-22 gap-0.5">
                <HeaderCell>Epochs</HeaderCell>
                <Cell answer="Holocene" reveal={reveal} span={1} />
                <Cell answer="Pleistocene" reveal={reveal} span={1} />
                <Cell answer="Pliocene" reveal={reveal} span={1} />
                <Cell answer="Miocene" reveal={reveal} span={1} />
                <Cell answer="Oligocene" reveal={reveal} span={1} />
                <Cell answer="Eocene" reveal={reveal} span={1} />
                <Cell answer="Paleocene" reveal={reveal} span={1} />
              </div>

            </div>
          </Glass>
        </section>
      </div>
    </div>
  );
}