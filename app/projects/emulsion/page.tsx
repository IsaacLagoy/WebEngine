"use client";

import Link from "next/link";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import AwardSection from "../../components/AwardSection";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";
import ConceptCards from "../../components/ConceptCards";

export default function EmulsionPage() {
  const features = [
    {
      title: "Two Dimensions",
      description: "Navigate between The Plain, a barren world void of color, and The Sight, a brighter dimension filled with demons.",
    },
    {
      title: "Combat System",
      description: "Use your trusty gun to vanquish monsters and survive the interdimensional peril.",
    },
    {
      title: "Dimensional Shifting",
      description: "Switch between dimensions strategically to overcome challenges and escape.",
    },
    {
      title: "Basilisk Engine",
      description: "Built with Basilisk Engine, proving Python can compete with major game engines.",
    },
  ];

  const concepts = [
    {
      title: "The Plain",
      description: "A completely barren world void of color. This dimension offers safety but limited visibility, forcing you to navigate carefully through its desolate landscape.",
    },
    {
      title: "The Sight",
      description: "A brighter dimension filled with demons. While more visible, this dimension is dangerous. You must use your gun strategically to survive and progress.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Emulsion"
        image="/images/projects/emulsion.png"
        imageAlt="Emulsion"
        description="You are trapped between two dimensions: The Plain, a completely barren world void of color, and The Sight, a brighter dimension that is also filled with demons."
        secondaryDescription="With your trusty gun, you must vanquish the monsters to escape this interdimensional peril."
        links={[
          { href: "https://github.com/BasiliskGroup/Emulsion", label: "View on GitHub" },
          { href: "https://gizmo-0918.itch.io/emulsion", label: "Download on itch.io" },
        ]}
      />

      <AwardSection
        title="2nd Place at Chillennium 2025"
        description={
          <>
            Emulsion won 2nd place at Chillennium 2025, a competition with over 50 teams. Furthermore, Emulsion was made using{" "}
            <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
              Basilisk Engine
            </Link>
            , outperforming teams using Godot, Unreal, and Unity. This was the first Basilisk project showing its viability as an engine.
          </>
        }
        awardImage="/images/projects/chillennium_2nd_2025.png"
        awardImageAlt="Chillennium 2025 2nd Place Award"
      />

      <FeaturesGrid title="Game Features" features={features} />

      <ContentSection title="A Milestone for Basilisk Engine">
        <p>
          Emulsion represents a pivotal moment for{" "}
          <Link href="/projects/basilisk" className="text-white underline hover:text-white/80">
            Basilisk Engine
          </Link>
          . Competing against teams using established engines like Godot, Unreal, and Unity, Emulsion proved that a Python-based engine could not only compete but excel.
        </p>
        <p>
          Winning 2nd place at Chillennium 2025—a competition with over 50 teams—demonstrated that Basilisk Engine was more than just a proof of concept. It was a viable tool for creating polished, competitive games.
        </p>
        <p>
          This achievement validated the team's vision of making game development accessible through Python while maintaining the performance and capabilities needed for real-time 3D graphics.
        </p>
      </ContentSection>

      <ConceptCards concepts={concepts} />
    </ProjectPageLayout>
  );
}

