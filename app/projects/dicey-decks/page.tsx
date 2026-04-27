"use client";

import Link from "next/link";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import AwardSection from "../../components/AwardSection";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";

export default function DiceyDecksPage() {
  const features = [
    {
      title: "Dungeon Exploration",
      description: "Travel through dungeons in search of spell cards, encountering enemies and collecting rewards.",
    },
    {
      title: "Card Collection",
      description: "Collect spell cards to build your deck and become more powerful as you progress.",
    },
    {
      title: "Combat System",
      description: "Defeat enemies using your collected cards and strategic gameplay.",
    },
    {
      title: "Proof of Concept",
      description: "The original proof of concept that demonstrated Python could power a full 3D game.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Dicey Decks"
        image="/images/projects/dicey_decks.png"
        imageAlt="Dicey Decks"
        description="In Dicey Decks, you play as a dice traveling through dungeons in search of spell cards."
        secondaryDescription="Defeat your enemies and collect money to become more powerful and delve further into the dungeon."
        links={[
          { href: "https://github.com/JonahCoffelt/Real-Engine-Python", label: "View on GitHub" },
          { href: "https://gizmo-0918.itch.io/dicey-decks", label: "Download on itch.io" },
        ]}
      />

      <AwardSection
        title="Spring 2024 Best in Programming"
        description={
          <>
            Written completely in Python and GLSL without the assistance of another engine, Dicey Decks won the Spring 2024 TAGD Programming Award. Even though Dicey Decks was greatly flawed, it served as the proof of concept for our better{" "}
            <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
              Basilisk Engine
            </Link>
            .
          </>
        }
        awardImage="/images/projects/spring_best_programming_2024.jpeg"
        awardImageAlt="Spring 2024 Best in Programming Award"
      />

      <FeaturesGrid title="Game Features" features={features} />

      <ContentSection title="The Beginning">
        <p>
          Dicey Decks was the original proof of concept that started it all. Created during a game jam under the pressure of ETAM, this game proved that you could build a complete 3D game entirely in Python and GLSL, without relying on existing game engines.
        </p>
        <p>
          While the game had its flaws, it demonstrated the core concept: Python could be used for real-time 3D graphics and game development. This proof of concept directly led to the development of{" "}
          <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
            Basilisk Engine
          </Link>
          , which would go on to power multiple award-winning games.
        </p>
        <p>
          Winning the Spring 2024 TAGD Programming Award validated the approach and showed that Python-based game development was not just possible, but could produce competitive results.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}

