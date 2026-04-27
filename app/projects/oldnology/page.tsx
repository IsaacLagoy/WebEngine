"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import AwardSection from "../../components/AwardSection";

export default function OldnologyPage() {
  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Oldnology"
        image="/images/projects/oldnology.png"
        imageAlt="Oldnology"
        description="You are oldnology and you have to fight newnology so get with the times."
        secondaryDescription="You are oldnology and you have to fight newnology so get with the times."
        links={[
          { href: "https://github.com/BasiliskGroup/Oldnology", label: "View on GitHub" },
          { href: "https://edenk818.itch.io/newnology", label: "Download on itch.io" },
        ]}
      />

      <AwardSection
        title="Spring 2026 Best in Programming"
        description={
          <>
            Oldnology utilizes WebGPU's interface through Rust, bound to Basilisk Engine's C++ to run it's cellular automita on the GPU.
          </>
        }
        awardImage="/images/projects/spring_best_programming_2025.png"
        awardImageAlt="Spring 2025 Best in Programming Award"
      />
    </ProjectPageLayout>
  );
}

