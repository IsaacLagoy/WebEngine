"use client";

import Glass from "../components/Glass";
import Link from "next/link";

const SECTIONS = [
  {
    href: "https://docs.google.com/document/d/1Nl7M05CE57KXw6QNjNrDS-5E6uKVaryZsamc3JPRMuA/edit?usp=sharing",
    label: "Rule Book",
    description: "This is the very incomplete rule book for my homebrew",
    newTab: true,
  },
  {
    href: "/dnd/classes",
    label: "Classes",
    description: "Browse playable classes, stats, and alignments"
  },  
  {
    href: "/dnd/shop",
    label: "Shop",
    description: "Browse items and their prices",
  },
  {
    href: "/dnd/items",
    label: "Items",
    description: "Browse items and their properties",
  },
  {
    href: "/dnd/potions",
    label: "Potions",
    description: "Potions and their effects",
  },
  {
    href: "/dnd/races",
    label: "Races",
    description: "Browse playable races and their stats",
  },
  {
    href: "/dnd/skill-sheets",
    label: "Skill Sheets",
    description: "Per-class skill and spell progression by level",
  },
  {
    href: "/dnd/skills",
    label: "Skills",
    description: "All available skills and their roll requirements",
  },
  {
    href: "/dnd/spells",
    label: "Spells",
    description: "Full spell list with targeting and MP costs",
  },
  {
    href: "/dnd/elements",
    label: "Elements",
    description: "Magic elements and their weaknesses",
  },
];

export default function DndPage() {
  return (
    <div className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-4xl mx-auto space-y-10">

        {/* Hero */}
        <section className="text-center space-y-3">
          <h1 className="text-5xl md:text-6xl font-bold text-white">
            D&amp;D
          </h1>
          <p className="text-white/50 text-sm md:text-base">
            Homebrew — Powered by Firebase
          </p>
        </section>

        {/* Nav Cards */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SECTIONS.map((section) => (
              <Link
                key={section.href}
                href={section.href}
                target={section.newTab ? "_blank" : undefined}
                rel={section.newTab ? "noopener noreferrer" : undefined}
              >
                <Glass className="p-6 h-full hover:bg-white/10 transition-colors cursor-pointer group">
                  <div className="flex flex-col gap-3">
                    <div>
                      <div className="text-white font-bold text-lg group-hover:text-white/90 transition-colors">
                        {section.label}
                      </div>
                      <div className="text-white/40 text-sm mt-1 leading-relaxed">
                        {section.description}
                      </div>
                    </div>
                  </div>
                </Glass>
              </Link>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}