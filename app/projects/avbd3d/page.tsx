"use client";

import Link from "next/link";
import ProjectPageLayout from "../../components/ProjectPageLayout";
import ProjectHero from "../../components/ProjectHero";
import FeaturesGrid from "../../components/FeaturesGrid";
import ContentSection from "../../components/ContentSection";
import GlassyVideo from "../../components/GlassyVideo";

export default function AVBD3DPage() {
  const features = [
    {
      title: "3D Physics Simulation",
      description: "Extension of Roblox and University of Utah's 2D AVBD algorithm into full 3D space with rigid body dynamics.",
    },
    {
      title: "GJK/EPA Collision Detection",
      description: "Advanced collision pipeline using Gilbert-Johnson-Keerthi and Expanding Polytope Algorithm for accurate contact generation.",
    },
    {
      title: "Configurable Debug Visualization",
      description: "Built-in options to visualize normals, constraints, wireframes, EPA vertices, and contact points for development.",
    },
    {
      title: "Basilisk Engine Compatible",
      description: "Designed with compatibility in mind for the future C++ version of Basilisk Engine using modern rendering libraries.",
    },
    {
      title: "Custom Rendering Pipeline",
      description: "OpenGL-based renderer using GLFW, GLAD, GLM, STB, and ASSIMP for robust 3D visualization.",
    },
    {
      title: "Research Implementation",
      description: "Based on cutting-edge research from SIGGRAPH 2025, implementing state-of-the-art physics simulation techniques.",
    },
  ];

  return (
    <ProjectPageLayout>
      <ProjectHero
        title="AVBD 3D"
        image="/images/projects/avbd3d.png"
        imageAlt="AVBD 3D"
        description="A 3D implementation of Augmented Vertex Block Descent, extending Roblox and University of Utah's research into three-dimensional physics simulation."
        secondaryDescription="Built with C++ and OpenGL, featuring advanced collision detection using GJK/EPA algorithms and designed for compatibility with Basilisk Engine."
        links={[
          { href: "https://github.com/IsaacLagoy/AVBD3D", label: "View on GitHub" },
          { href: "https://graphics.cs.utah.edu/research/projects/avbd/", label: "Research Project Page" },
        ]}
      />

      <FeaturesGrid title="Technical Features" features={features} />

      <GlassyVideo 
        embedLink="https://www.youtube.com/embed/_X5YvO2wDbI?si=368OqLXbG6ipr1Wu" 
        title="AVBD 3D Simulation Demo" 
      />

      <ContentSection title="About the Project">
        <p>
          AVBD 3D is an ongoing research implementation that extends the Augmented Vertex Block Descent algorithm from 2D to 3D. Based on the public 2D demo from the University of Utah and Roblox's collaborative research, this project explores the challenges and opportunities of bringing this advanced physics simulation technique into three-dimensional space.
        </p>
        <p>
          The project is currently in active development as I work through understanding the intricacies of AVBD and debugging the 3D implementation. This is a learning journey through cutting-edge physics simulation research published at SIGGRAPH 2025.
        </p>
      </ContentSection>

      <ContentSection title="Key Architectural Changes">
        <p>
          The transition from 2D to 3D required fundamental changes to the data structures and algorithms. Some major differences include:
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Rigid Bodies</h4>
            <ul className="list-disc list-inside space-y-1 text-white/90">
              <li>Position expanded from <code className="bg-white/10 px-1 py-0.5 rounded">float3</code> to <code className="bg-white/10 px-1 py-0.5 rounded">vec3 position</code> and <code className="bg-white/10 px-1 py-0.5 rounded">quat rotation</code></li>
              <li>Velocity changed from <code className="bg-white/10 px-1 py-0.5 rounded">float3</code> to <code className="bg-white/10 px-1 py-0.5 rounded">vec6</code> (linear and angular)</li>
              <li>Scale updated from <code className="bg-white/10 px-1 py-0.5 rounded">float2</code> to <code className="bg-white/10 px-1 py-0.5 rounded">vec3</code></li>
              <li>Moment of inertia replaced with full <code className="bg-white/10 px-1 py-0.5 rounded">mat3x3 inertiaTensor</code></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Forces and Constraints</h4>
            <ul className="list-disc list-inside space-y-1 text-white/90">
              <li>Jacobian expanded from <code className="bg-white/10 px-1 py-0.5 rounded">float3</code> to <code className="bg-white/10 px-1 py-0.5 rounded">vec6</code></li>
              <li>Hessian matrix grew from <code className="bg-white/10 px-1 py-0.5 rounded">float6</code> to <code className="bg-white/10 px-1 py-0.5 rounded">mat6x6</code></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white mb-2">Contact Manifolds</h4>
            <ul className="list-disc list-inside space-y-1 text-white/90">
              <li>Contact positions and normals upgraded from <code className="bg-white/10 px-1 py-0.5 rounded">float2</code> to <code className="bg-white/10 px-1 py-0.5 rounded">vec3</code></li>
              <li>Maximum contacts increased from 2 to 4 points per manifold</li>
            </ul>
          </div>
        </div>
      </ContentSection>

      <ContentSection title="Development and Debug Features">
        <p>
          The project includes extensive debug visualization options configurable at build time to aid in development and understanding of the physics simulation:
        </p>
        <ul className="list-disc list-inside space-y-2 text-white/90 mt-4">
          <li><strong>Show Normals:</strong> Visualize surface normals for collision geometry</li>
          <li><strong>Show Constraints:</strong> Display active constraint relationships between bodies</li>
          <li><strong>Wireframe Rigids:</strong> Render rigid bodies as wireframes for internal structure visibility</li>
          <li><strong>Show EPA Vertices:</strong> Visualize the near-face polytope vertices from the EPA algorithm</li>
          <li><strong>Show Contact Points:</strong> Display generated contact points between colliding bodies</li>
        </ul>
      </ContentSection>
    </ProjectPageLayout>
  );
}