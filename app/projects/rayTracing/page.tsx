"use client";

import Image from "next/image";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";

export default function RayTracingPage() {
    const features = [
        {
            title: "Monte Carlo Path Tracing",
            description: "Uses probability to create a more realistic image by averaging the results of many random paths.",
        },
        {
            title: "GPU Acceleration",
            description: "I am on a M1 MacBook Pro so I do not have ray tracing specific hardware acceleration. To achieve higher Monte-Carlo speeds, I implemented it as a fragment shader through OpenGL, using the GPU as my hardware acceleration.",
        },
        {
            title: "SAH BVH",
            description: "I've implemented BVHs before but mostof them have been top-down instead of bottom up.In this project I implement a BVH for both model space for narrow collisions and world space for broad collisions.",
        },
        {
            title: "Antialiasing",
            description: "Multiple ray casts per pixel leverage probability to mix the contributions of multiple objects in a single pixel.",
        },
        {
            title: "Ambient Occlusion",
            description: "Indirect lighting rays get trapped in tight corners creating darker spots while being able to escape to a light source when given more room. ",
        },
        {
            title: "Refraction",
            description: "Utilizes Snell's law to calculate the angle of the refracted ray.",
        },
        {
            title: "Texture Mapping",
            description: "Uses a textured material system for albedo, normal, roughness, and metalness.",
        },
        {
            title: "Area light sources",
            description: "Lights are treated as objects instead of point lights, allowing for more realistic lighting. This is also required by Monte Carlo Path Tracing.",
        },
        {
            title: "Light Attenuation",
            description: "transmissive objects can use absorption and density to absorb specific light frequencies.",
        },
        {
            title: "Boxes",
            description: "simple OBBs with each face of the cube having full UVs",
        },
      ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="Monte Carlo Ray Tracer"
        image="/images/projects/death_by_a_thousand_samples.png"
        imageAlt="Monte Carlo Ray Tracer"
        description="A ray tracer built for CSCE 441, Computer Graphics"
        links={[
          { href: "https://github.com/IsaacLagoy/Ray-Tracing", label: "View on GitHub" },
        ]}
      />

      <ContentSection title="Blinn-Phong vs Path Tracing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-white font-semibold">Blinn-Phong Ray Tracing</h3>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5">
              <Image
                src="/images/projects/Blinn5.png"
                alt="Blinn-Phong render"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-white font-semibold">Monte Carlo Path Tracing</h3>
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-white/5">
              <Image
                src="/images/projects/Scene5.png"
                alt="Path traced render"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </ContentSection>

    <FeaturesGrid title="Bonus Features" features={features} />
    </ProjectPageLayout>
  );
}

