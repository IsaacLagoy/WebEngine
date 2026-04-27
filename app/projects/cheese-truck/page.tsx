"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";

export default function CheeseTruckPage() {
  const features = [
    {
      title: "Food Truck Management",
      description: "Manage a food truck, handling orders and operations in a simulated environment.",
    },
    {
      title: "Customer Interactions",
      description: "Interact with customers, taking orders and serving food through the simulation.",
    },
    {
      title: "Threading",
      description: "Demonstrates concurrent programming with threads managing different aspects of the simulation.",
    },
    {
      title: "JavaFX UI",
      description: "Built with JavaFX, showcasing skills with Java's UI development library.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="JavaFX Grilled Cheese Truck"
        image="/images/projects/cheese_truck.png"
        imageAlt="JavaFX Grilled Cheese Truck"
        description="This was my final object-oriented project for my programming languages class, demonstrating skills with threads and JavaFX, a UI development library for Java."
        secondaryDescription="In this project you manage a food truck, a customer, and the interactions between them. More information can be found on the ReadMe in the GitHub repository."
        links={[
          { href: "https://github.com/IsaacLagoy/CheeseTruck", label: "View on GitHub" },
        ]}
      />

      <FeaturesGrid title="Project Features" features={features} />

      <ContentSection title="About">
        <p>
          This project was created as the final assignment for a programming languages class, focusing on object-oriented programming principles, concurrent programming with threads, and GUI development with JavaFX.
        </p>
        <p>
          The simulation demonstrates how different components (food truck, customers) can interact in a multi-threaded environment, with each component running independently while coordinating their actions through proper synchronization.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}

