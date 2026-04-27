"use client";

import Link from "next/link";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import AwardSection from "../../components/AwardSection";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";
import GlassyVideo from "../../components/GlassyVideo";

export default function CrumpleQuestPage() {
  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Barnes-Hut Simulation"
        image="/images/projects/barnes_hut.png"
        imageAlt="Barnes-Hut Simulation"
        description="A simulation of the Barnes-Hut algorithm for gravitational force calculations."
      />

      <GlassyVideo 
        embedLink="https://www.youtube.com/embed/uzA3jQEhxJY?si=j8yXFGq67-lWG-55" 
        title="Barnes-Hut Simulation" 
      />

      <ContentSection title="About the Project">
        <p>
          While this probably should be in the Basilisk Engine page, I put it here because I thought it was a notable feature not many people would use. Earlier today in my graphics class, my professor mentioned Barnes-Hut and I thought it would be cool to showcase that I had already made it. In short here's how it works:
        </p>
        <ol className="list-decimal pl-6 space-y-1">
          <li>Hijack the spacial partitioning system and make each AABB store the mass of all rigids contained in it. </li>
          <li>When computing gravity, use the mass of untraveled leaves to approximate the gravitational contribution of all contained rigids.</li>
          <li>Using all collected gravities during the traversal, compute the net gravitational force on the current rigid.</li>
          <li>Cinema</li>
        </ol>
      </ContentSection>
    </ProjectPageLayout>
  );
}