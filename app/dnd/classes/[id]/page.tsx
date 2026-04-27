"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DndClass, ClassData, readCollection } from "@/lib/firebase";
import Glass from "@/app/components/Glass";

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trail, setTrail] = useState<string | null>(null);

  const [cls, setCls] = useState<DndClass | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await readCollection<ClassData>("classes");
        setCls(data.find((c) => c.id === id) ?? null);
      } catch (err) {
        console.error("Error loading class:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setTrail(params.get("trail"));
  }, []);

  function handleSkillSheetClick(sheetName: string) {
    const sheetId = sheetName.toLowerCase().replace(/\s+/g, "-");
    const nextTrail = trail ? `${trail},classes/${id}` : `classes/${id}`;
    router.push(`/dnd/skill-sheets/${sheetId}?trail=${nextTrail}`);
  }

  if (loading) {
    return (
      <main className="min-h-screen px-8 py-12">
        <div className="text-white/70 text-lg">Loading...</div>
      </main>
    );
  }

  if (!cls) {
    return (
      <main className="min-h-screen px-8 py-12">
        <div className="text-white/70 text-lg">Class not found.</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-8 py-12">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          {cls.name}
        </h1>

        {/* Description */}
        {cls.description && (
          <p className="text-white/70 text-lg leading-relaxed">
            {cls.description}
          </p>
        )}

        {/* Stats */}
        <Glass className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-6">
          <Stat label="Health Die" value={cls.health} />
          <Stat label="Mana Per Level" value={String(cls.mana)} />
          <Stat label="Skills Per Level" value={String(cls.skills)} />
          <Stat
            label="THAC0"
            value={`Starts at ${cls.thac0[0]}, −1 per ${cls.thac0[1]} levels`}
          />
          <Stat
            label="AC"
            value={`Starts at ${cls.ac[0]}, −1 per ${cls.ac[1]} levels`}
          />
          {cls.alignment && (
            <Stat label="Alignment" value={cls.alignment} />
          )}
        </Glass>

        {/* Skill Sheets */}
        {cls.skill_sheets.length > 0 && (
          <div>
            <h2 className="text-white font-bold text-xl mb-3">Skill Sheets</h2>
            <ul className="space-y-3">
              {cls.skill_sheets.map((sheetName) => (
                <li key={sheetName}>
                  <Glass
                    className="p-4 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSkillSheetClick(sheetName)}
                  >
                    <span className="text-white font-semibold">{sheetName}</span>
                  </Glass>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Rules */}
        {cls.rules && (
          <div>
            <h2 className="text-white font-bold text-xl mb-3">Rules</h2>
            <Glass className="p-6">
              <p className="text-white/70 leading-relaxed">{cls.rules}</p>
            </Glass>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-white font-semibold">{value}</div>
    </div>
  );
}