"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";

export default function POSSystemPage() {
  const features = [
    {
      title: "AI Chat Assistant",
      description: "Multilingual ordering assistant powered by OpenAI API helps customers navigate the menu and place orders in their preferred language.",
    },
    {
      title: "Build Your Own Menu",
      description: "Intuitive customization system allows customers to select meal sizes, choose entrees, and pick sides for a personalized dining experience.",
    },
    {
      title: "Real-Time Kitchen View",
      description: "Dedicated employee interface displays incoming orders in real-time, tracking inventory usage as items are prepared.",
    },
    {
      title: "PostgreSQL Database",
      description: "Robust database architecture manages menu items, orders, inventory levels, and employee data with reliability and efficiency.",
    },
    {
      title: "Modern Web Stack",
      description: "Built with React, Next.js, and Node.js for a responsive, fast, and maintainable full-stack application.",
    },
    {
      title: "Complete Kiosk Experience",
      description: "Designed specifically for Panda Express-style ordering, streamlining the customer journey from selection to checkout.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="POS System"
        image="/images/projects/pos_home.png"
        imageAlt="POS System"
        description="A modern point-of-sale and kiosk system designed for Panda Express-style restaurants, featuring AI-powered ordering assistance and real-time kitchen management."
        secondaryDescription="Built with React, Next.js, and PostgreSQL to streamline the ordering experience for customers and kitchen operations for staff."
        links={[
          { href: "https://project-3-team-41-zbyt.onrender.com", label: "View Website" },
        ]}
      />

      <FeaturesGrid title="System Features" features={features} />

      <ContentSection title="From Java to Modern Web">
        <p>
          The POS System began as a JavaFX desktop application and was completely reimplemented as a modern web application using React, Next.js, and Node.js. This transformation made the system accessible from any device while significantly improving the user experience and maintainability.
        </p>
        <p>
          The system was developed as the final project for CSCE 331 Foundations of Software Engineering, demonstrating full-stack development capabilities, database design, API integration, and modern software engineering practices.
        </p>
      </ContentSection>

      <ContentSection title="Build Your Own Menu System">
        <p>
          The customizable meal builder allows customers to select their meal size, choose from multiple entree options, and pick their preferred sides. This intuitive interface guides users through the selection process, ensuring they create the perfect meal while clearly displaying pricing and portion information.
        </p>
        <img 
          src="/images/projects/pos_byo.png" 
          alt="Build Your Own Menu Interface" 
          className="w-full rounded-lg mt-6"
        />
      </ContentSection>

      <ContentSection title="AI-Powered Ordering Assistant">
        <p>
          One of the system's standout features is the AI chat assistant, which I designed and implemented using the OpenAI API. The assistant helps customers navigate the menu, answer questions about ingredients and options, and complete their orders—all in multiple languages. This feature makes the kiosk accessible to a broader audience and reduces the learning curve for first-time users, creating a more inclusive dining experience.
        </p>
        <img 
          src="/images/projects/pos_ai.png" 
          alt="AI Ordering Assistant" 
          className="w-full rounded-lg mt-6"
        />
      </ContentSection>

      <ContentSection title="Real-Time Kitchen Management">
        <p>
          The kitchen view provides employees with a live dashboard of incoming orders, displaying all active orders and their status. As kitchen staff prepare items, the system automatically tracks inventory usage, ensuring accurate stock levels and preventing overselling. This real-time coordination between the front-of-house kiosk and back-of-house operations streamlines the entire restaurant workflow.
        </p>
        <img 
          src="/images/projects/pos_kitchen.png" 
          alt="Kitchen Management View" 
          className="w-full rounded-lg mt-6"
        />
      </ContentSection>

      <ContentSection title="My Contributions">
        <p>
          As a key developer on this project, I focused on creating intuitive customer-facing features and robust backend systems:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/90">
          <li>Designed and implemented the AI chat assistant using OpenAI API with multilingual support</li>
          <li>Built the front-end interface using React and Next.js for responsive, modern UI</li>
          <li>Created the "Build Your Own" meal customization system with size, entree, and side selection</li>
          <li>Developed the real-time kitchen view for order management and inventory tracking</li>
          <li>Integrated PostgreSQL database for managing menu items, orders, inventory, and employee data</li>
          <li>Implemented the complete customer ordering flow from menu browsing to checkout</li>
        </ul>
      </ContentSection>

      <ContentSection title="Technical Architecture">
        <p>
          The system leverages a PostgreSQL database to maintain data integrity across menu items, orders, inventory levels, and employee records. The Node.js backend provides RESTful APIs that connect the React frontend to the database, while the Next.js framework enables server-side rendering for optimal performance.
        </p>
        <p>
          The kitchen view updates in real-time as orders come in, automatically adjusting inventory counts as items are prepared. This ensures accurate stock tracking and helps prevent overselling items that are running low.
        </p>
      </ContentSection>
    </ProjectPageLayout>
  );
}