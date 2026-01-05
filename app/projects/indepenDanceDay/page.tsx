"use client";

import Link from "next/link";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import AwardSection from "../../components/AwardSection";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";

export default function IndepenDanceDayPage() {
  const features = [
    {
      title: "Physics-Based Puzzles",
      description: "Solve puzzles using John's precision cutting laser to navigate obstacles and progress.",
    },
    {
      title: "Story-Driven",
      description: "Help John rewrite history by infiltrating the White House and modifying the Declaration of Independence.",
    },
    {
      title: "Engine-Focused Design",
      description: "The first game created using the engine-focused paradigm, keeping game code separate from Basilisk.",
    },
    {
      title: "Basilisk Engine",
      description: "Built with Basilisk Engine, demonstrating the engine's capabilities for narrative-driven games.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="IndepenDance Day"
        image="/images/projects/independance_day.png"
        imageAlt="IndepenDance Day"
        description="John Bitcock, a robot who dreams of becoming a professional dancer, lives in his worst nightmare, an alternate version of America where it's illegal for robots to dance."
        secondaryDescription="Determined to make his dream a reality, John sets out on a daring mission to rewrite history. Help John infiltrate the White House, solve physics-based puzzles using his precision cutting laser, and rewrite the Declaration of Independence so robots can dance."
        links={[
          { href: "https://github.com/BasiliskGroup/BasiliskEngine/tree/IndepenDance-Day", label: "View on GitHub" },
          { href: "https://isaaclagoy.itch.io/independance-day", label: "Download on itch.io" },
        ]}
      />

      <AwardSection
        title="Fall 2024 Best in Game Design"
        description={
          <>
            IndepenDance Day was the first game created using the engine-focused paradigm for designing a game with{" "}
            <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
              Basilisk Engine
            </Link>
            . We made sure to keep our game's code 100% separate from Basilisk's so that we could package Basilisk after the semester.
          </>
        }
        awardImage="/images/projects/design_award_fall_2024.png"
        awardImageAlt="Fall 2024 Best in Game Design Award"
      />

      <FeaturesGrid title="Game Features" features={features} />

      <ContentSection title="Engine-Focused Paradigm">
        <p>
          IndepenDance Day marked an important shift in how we approached game development with{" "}
          <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
            Basilisk Engine
          </Link>
          . This was the first game created using our engine-focused paradigm, where we deliberately kept the game's code completely separate from the engine's code.
        </p>
        <p>
          This separation was crucial—it allowed us to package Basilisk Engine as a standalone Python package after the semester, making it available for others to use. The clean architecture demonstrated that Basilisk could be used as a proper game engine, not just a one-off project.
        </p>
        <p>
          The game's success in winning the Fall 2024 Best in Game Design Award validated this approach and set the foundation for future Basilisk Engine games.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}

