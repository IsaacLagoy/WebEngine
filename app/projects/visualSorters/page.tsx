"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import ContentSection from "../../components/ContentSection";

export default function VisualSortersPage() {
  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Visual Sorters"
        image="/images/projects/quick_sort.png"
        imageAlt="Visual Sorters"
        description="This program displays the process that a sorting algorithm takes to sort an array."
        secondaryDescription="The red line shows which part of the array is being swapped. Below you can find the algorithms included in this program, and more can be added if need be."
        links={[
          { href: "https://github.com/IsaacLagoy/VisualSorters/tree/main", label: "View on GitHub" },
        ]}
      />

      <ContentSection title="About">
        <p>
          Visual Sorters is an educational tool that helps visualize how different sorting algorithms work. By showing each step of the sorting process with visual feedback, it makes abstract algorithms more concrete and easier to understand.
        </p>
        <p>
          The program highlights which elements are being compared or swapped at each step, making it clear how the algorithm progresses toward a sorted array. This visual approach is particularly useful for learning and teaching sorting algorithms.
        </p>
        <p>
          The project is designed to be extensible, allowing new sorting algorithms to be added easily for comparison and learning purposes.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}

