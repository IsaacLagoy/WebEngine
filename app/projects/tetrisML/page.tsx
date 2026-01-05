"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";

export default function TetrisMLPage() {
  const weights = [
    {
      title: "covered",
      description: "Avoids covering unfilled tiles with another block.",
    },
    {
      title: "height",
      description: "Minimizes the height of the blocks placed.",
    },
    {
      title: "twospace",
      description: "Tries to leave space for 2-wide blocks to fit in.",
    },
    {
      title: "edgespace",
      description: "Attempts to fill in the sides to avoid reliance on lines.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Tetris ML"
        image="/images/projects/tetris_ml.png"
        imageAlt="Tetris ML"
        description="This program, written in Python with pygame for the visuals, trains a bot to play Tetris."
        secondaryDescription="The Tetris clone includes all the mechanics of the original game besides storing blocks. The highest score it has achieved during training passed 700 lines cleared."
        links={[
          { href: "https://github.com/IsaacLagoy/TetrisML", label: "View on GitHub" },
        ]}
      />

      <ContentSection title="How It Works">
        <p>
          The bot works by calculating the results of its actions weighed by specific variables. The bot learns by randomly adjusting the weights from a parent bot. The most successful child bot will then compete against the parent to determine who will become the next parent bot.
        </p>
        <p>
          This genetic algorithm approach allows the bot to evolve and improve over generations, finding optimal strategies for playing Tetris through trial and error.
        </p>
      </ContentSection>

      <FeaturesGrid title="Weight Variables" features={weights} />

      <ContentSection title="Technical Details">
        <p>
          Built with Python and pygame, this project demonstrates machine learning concepts through a practical application. The genetic algorithm approach allows the bot to discover effective strategies without explicit programming of game rules.
        </p>
        <p>
          The bot's ability to clear over 700 lines shows that the learning algorithm successfully found strategies that balance the different weight variables to maximize performance.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}

