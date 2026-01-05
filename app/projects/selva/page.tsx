"use client";

import Link from "next/link";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import AwardSection from "../../components/AwardSection";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";
import ConceptCards from "../../components/ConceptCards";

export default function SelvaPage() {
  const features = [
    {
      title: "Memory Portals",
      description: "Open portals to your memories using picture frames. Each frame is a gateway to a different world.",
    },
    {
      title: "Unique Shaders",
      description: "Every memory has its own custom shader, creating distinct visual experiences that are integral to gameplay.",
    },
    {
      title: "Shader-Based Puzzles",
      description: "Solve puzzles by weaving in and out of visual effects. The shaders aren't just cosmetic—they're part of the challenge.",
    },
    {
      title: "Rich Mechanics",
      description: "Features the most mechanics and shaders of any Basilisk Engine game, showcasing the engine's capabilities.",
    },
  ];

  const concepts = [
    {
      title: "Memory Exploration",
      description: "Navigate through different memories, each represented by a picture frame. These portals transport you to distinct worlds, each with its own visual identity and challenges.",
    },
    {
      title: "Visual Puzzle Solving",
      description: "The shaders aren't just for show—they're part of the puzzle. You'll need to move between different visual effects, using the distortions and transformations to solve challenges and progress.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Selva"
        image="/images/projects/selva.png"
        imageAlt="Selva"
        description="Remember who you are and open portals to your memories using picture frames. Solve puzzles in each memory to reach the end of the game!"
        secondaryDescription="Each memory has its own shader with puzzles requiring you to weave in and out of each visual effect."
        links={[
          { href: "https://github.com/BasiliskGroup/Selva", label: "View on GitHub" },
          { href: "https://isaaclagoy.itch.io/selva", label: "Download on itch.io" },
        ]}
      />

      <AwardSection
        title="Spring 2025 Best in Programming"
        description={
          <>
            Selva won the Spring 2025 TAGD Best in Programming Award, recognizing its technical excellence and innovative use of shaders. By far, it features the most mechanics and shaders present in any Basilisk Engine game to date.
          </>
        }
        awardImage="/images/projects/spring_best_programming_2025.png"
        awardImageAlt="Spring 2025 Best in Programming Award"
      />

      <FeaturesGrid title="Game Features" features={features} />

      <ContentSection title="Technical Achievement">
        <p>
          Selva represents a significant milestone for{" "}
          <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
            Basilisk Engine
          </Link>
          . As always, it was created using the engine, but Selva pushed the boundaries of what was possible.
        </p>
        <p>
          The game features an unprecedented number of custom shaders, each carefully crafted to create unique visual experiences. These aren't just visual effects—each shader is integrated into the gameplay, creating puzzles that require players to understand and interact with the visual distortions.
        </p>
        <p>
          With more mechanics and shaders than any previous Basilisk Engine game, Selva demonstrates the engine's growing maturity and the team's ability to create increasingly complex and polished experiences.
        </p>
      </ContentSection>

      <ConceptCards concepts={concepts} />
    </ProjectPageLayout>
  );
}

