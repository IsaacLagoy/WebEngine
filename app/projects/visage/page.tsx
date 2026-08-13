"use client";

import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";
import GlassyVideo from "../../components/GlassyVideo";

export default function VisagePage() {
  const features = [
    {
      title: "Telemetry, Not Video",
      description:
        "Pilots see terrain without an extra camera feed over radio or Starlink. The drone state is sent over telemetry, which is magnitudes smaller than streaming video.",
    },
    {
      title: "Cesium Photorealistic Tiles",
      description:
        "Geometry and textures come from Cesium using Google Earth photorealistic tiles. Rendering is OpenGL.",
    },
    {
      title: "C++ Library",
      description:
        "Visage is written as a library with a small API so it can be packaged with other C++ code. Different apps wrap the same core.",
    },
    {
      title: "GStreamer and FFmpeg",
      description:
        "The same codebase plugs into GStreamer or FFmpeg. FFmpeg apps can do things GStreamer prevents, including a Qt control panel over live video.",
    },
    {
      title: "Proximity Highlight",
      description:
        "Terrain too close to the vehicle is highlighted in red so it draws the pilot's attention and helps avoid collisions.",
    },
    {
      title: "Yamcs Commands",
      description:
        "Visage can talk to the Yamcs ground system and send commands to the drone, including touch-to-target from the display.",
    },
  ];

  const overlays = [
    {
      title: "Synthetic Terrain",
      description:
        "Recreate the flight view from telemetry alone, as if a camera were on the aircraft.",
    },
    {
      title: "Video Overlay",
      description:
        "Blend Cesium terrain on top of real workshop or aircraft footage so live imagery and known satellite geometry sit together.",
    },
    {
      title: "Geometry Edges",
      description:
        "White outlines use the actual mesh and catch terrain edges you might miss with color fills alone.",
    },
    {
      title: "Shading and Blend",
      description:
        "Blinn-Phong shading, alpha blending with the real feed, and color customization are all tunable from Qt.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Visage"
        image="/images/projects/visage.jpg"
        imageAlt="Visage terrain visualization"
        description="A visualization platform for remote drone pilots, built at Windhover Labs during my summer internship."
        secondaryDescription="Shows terrain around the vehicle from telemetry instead of streaming a full video feed."
      />

      <GlassyVideo
        embedLink="https://www.youtube.com/embed/90W_elMEy9I?si=Csm9lSQdNYDDtBWI"
        title="Visage Demo"
      />

      <ContentSection title="About">
        <p>
          The goal was to simplify how much data needs to be sent. Instead of a
          full video feed, only the drone state goes over the link, and Visage
          rebuilds the view on the ground. Because the geometry comes from Google Earth photorealistic tiles,
          the view can be augmented past what a camera alone provides.
        </p>
      </ContentSection>

      <FeaturesGrid title="Design" features={features} />

      <ContentSection title="Apps">
        <p>
          The core is shared. Different ending application layers wrap it for
          different jobs.
        </p>
        <p>
          The GStreamer plugin sits in the company pipeline next to Yamcs. The
          FFmpeg path uses the same codebase with a Qt interface that controls
          terrain effects. That path overlays Cesium terrain on real footage
          from a drone in the workshop, so you get live imagery plus satellite
          geometry when you need to pick out something moving in the scene.
        </p>
        <p>
          Visage can also act as a touch screen into Yamcs. In an investor
          demo, clicking a tank in the view could send a track command so the
          drone followed that target when it moved in the workshop.
        </p>
      </ContentSection>

      <FeaturesGrid title="Vision Enhancements" features={overlays} />
    </ProjectPageLayout>
  );
}
