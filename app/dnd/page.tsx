"use client";

import Glass from "../components/Glass";

export default function ExperiencePage() {
  return (
    <div className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            D&D Database
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto">
            Homebrew Rules - Powered by Firebase
          </p>
        </section>
        <a href="/dnd/elements">
          <Glass>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
              Magic Elements Database
            </h2>
            <p className="text-white/80 text-sm md:text-base">
              A comprehensive database of magic elements for Dungeons & Dragons, complete with descriptions and attributes.
            </p>
          </Glass>
        </a>
        </div>
    </div>
  );
}