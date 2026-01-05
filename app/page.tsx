import Glass from "./components/Glass";
import Link from "next/link";

export default function Home() {
  const skills = [
    "C++",
    "Python",
    "Java",
    "TypeScript",
    "JavaScript",
    "HTML",
    "CSS",
    "Haskell",
    "CMake",
    "PostgreSQL",
    "SvelteKit",
    "React",
    "Git",
    "GitHub",
    "Docker",
    "Tailwind",
  ];

  const additionalProjects = [
    {
      title: "Basilisk Engine 2D",
      description: "High-performance 2D physics engine based on Augmented Vertex Block Descent (AVBD) for robust rigid body simulation. Implemented GJK, EPA, and SAT pipelines with sub-microsecond contact generation.",
      tech: "C++",
      link: "https://github.com/BasiliskGroup/BasiliskEngine",
    },
    {
      title: "AVBD 3D Physics Engine",
      description: "Extended the AVBD 2D engine into a fully 3D solver ahead of the public release of the University of Utah's research implementation.",
      tech: "C++",
      link: "https://github.com/IsaacLagoy/AVBD3D",
    },
    {
      title: "Restaurant Point of Sale System",
      description: "Created an AI assistant capable of managing customer orders and responding with Text-to-Speech for personalized experiences. Connected to a PostgreSQL database to store operational and customer data.",
      tech: "React, TypeScript, Tailwind, PostgreSQL",
    },
    {
      title: "Crumple Quest",
      description: "Implemented dynamic navigation meshes for enemy AI pathing and algorithms for folding levels drawn on a piece of paper. Won TAGD Best Programming, Fall 2025.",
      tech: "C++",
      link: "https://edenk818.itch.io/crumplequest",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Welcome Section - Full Viewport */}
      <section className="min-h-screen flex items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Welcome &lt;3
          {/* Text */}
        </h1>
      </section>

      {/* Resume Information Section */}
      <section className="min-h-screen flex items-center justify-center px-4 md:px-8 py-12 md:py-20">
        <div className="max-w-7xl mx-auto w-full space-y-12">
          {/* Education */}
          <Glass className="p-5 md:p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Education
            </h2>
            <div className="space-y-2 text-white/90 text-sm md:text-base leading-relaxed">
              <p className="font-semibold text-white">
                BS, Computer Science — Texas A&M University
              </p>
              <p>4.0 GPA • Math Minor • Master's Fast Track Program</p>
              <p>Expected Graduation: December 2026</p>
            </div>
          </Glass>

          {/* Skills */}
          <Glass className="p-5 md:p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Skills
            </h2>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white/90 text-xs md:text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Glass>

          {/* Additional Projects */}
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
              Additional Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {additionalProjects.map((project, index) => (
                <Glass key={index} className="p-4 md:p-5 h-full">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      {project.title}
                    </h3>
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/70 hover:text-white text-xs transition-colors"
                      >
                        →
                      </a>
                    )}
                  </div>
                  <p className="text-white/60 text-xs mb-2 font-medium">
                    {project.tech}
                  </p>
                  <p className="text-white/80 text-xs md:text-sm leading-relaxed">
                    {project.description}
                  </p>
                </Glass>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}