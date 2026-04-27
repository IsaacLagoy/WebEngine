"use client";

import Link from "next/link";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import AwardSection from "../../components/AwardSection";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";
import GlassyVideo from "../../components/GlassyVideo";

export default function CrumpleQuestPage() {
  const features = [
    {
      title: "Paper Folding Mechanics",
      description: "Master the unique ability to fold and unfold the game world, revealing new paths and creating strategic advantages in combat.",
    },
    {
      title: "Intelligent Enemy AI",
      description: "Face enemies that use advanced pathfinding with Earcut triangulation and A* navigation to hunt you through the dungeon.",
    },
    {
      title: "Dynamic Navigation Mesh",
      description: "Experience a world that adapts as you fold reality, with navigation meshes that update in real-time to match the paper geometry.",
    },
    {
      title: "Epic Boss Battle",
      description: "Test your skills against a challenging boss encounter designed to push your mastery to the limit.",
    },
    {
      title: "Minimap System",
      description: "Navigate the twisting dungeon with a custom-built minimap that helps you track your progress and plan your route.",
    },
    {
      title: "Varied Enemy Behaviors",
      description: "Each enemy type features unique attack patterns and movement behaviors, keeping combat fresh and challenging.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Crumple Quest"
        image="/images/projects/crumple_quest.png"
        imageAlt="Crumple Quest"
        description="Fold your way through the epic world of Crumple Quest."
        secondaryDescription="Master the art of folding reality itself to navigate treacherous dungeons, outsmart intelligent enemies, and conquer an epic boss battle."
        links={[
          { href: "https://edenk818.itch.io/crumplequest", label: "Download from Itch.io" },
        ]}
      />

      <AwardSection
        title="Fall 2025 TAGD Best in Programming"
        description={
          <>
            Crumple Quest won the Fall 2025 TAGD Best in Programming Award, recognizing the technical achievement of implementing dynamic paper folding mechanics with real-time navigation mesh updates. Built with{" "}
            <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
              Basilisk Engine 2D
            </Link>
            , the game showcases advanced AI pathfinding and innovative gameplay mechanics.
          </>
        }
        awardImage="/images/projects/fall_best_programming_2025.png"
        awardImageAlt="Fall 2025 TAGD Best in Programming Award"
      />

      <GlassyVideo 
        embedLink="https://www.youtube.com/embed/jV88AL2RO2w?si=HWfuFBX-j3EMBHFI" 
        title="Crumple Quest Gameplay" 
      />

      <FeaturesGrid title="Key Features" features={features} />

      <ContentSection title="Technical Innovation">
        <p>
          Crumple Quest's core innovation lies in its paper folding system. I created a custom algorithm that handles both folding and unfolding paper geometry while dynamically updating the navigation mesh in real-time. This allows the game world to transform as you play, creating new paths and strategic opportunities.
        </p>
        <p>
          The enemy AI represents another significant technical achievement. Enemies use Earcut for scene triangulation, construct a navigation graph from the results, and employ A* pathfinding to intelligently pursue the player through the shifting dungeon. Each enemy type features unique attack patterns and movement behaviors, creating varied and engaging combat encounters.
        </p>
        <p>
          Built with{" "}
          <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
            Basilisk Engine 2D
          </Link>{" "}
          in C++, I implemented the physics system, collision detection, player controller, level navigation, and minimap functionality. The boss battle serves as the ultimate test of all these systems working in harmony.
        </p>
      </ContentSection>

      <ContentSection title="My Contributions">
        <p>
          I was responsible for many of the core technical systems that bring the game to life:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/90">
          <li>Designed and implemented the paper folding/unfolding algorithm with dynamic navigation mesh updates</li>
          <li>Developed the physics engine and collision detection system</li>
          <li>Created the player controller and level navigation mechanics</li>
          <li>Built the enemy AI using Earcut triangulation, graph construction, and A* pathfinding</li>
          <li>Implemented unique enemy attack patterns and movement behaviors</li>
          <li>Designed and programmed the boss battle encounter</li>
          <li>Developed the minimap system for dungeon navigation</li>
        </ul>
      </ContentSection>
    </ProjectPageLayout>
  );
}