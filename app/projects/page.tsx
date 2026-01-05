"use client";

import Glass from "../components/Glass";
import Link from "next/link";
import Image from "next/image";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
}

const projects: Project[] = [
  {
    id: "basilisk",
    title: "Basilisk Engine",
    description: "A 3D game engine built with Python and GLSL. Powers multiple award-winning games.",
    image: "/images/basilisk/basilisk_square_white.png",
    href: "/projects/basilisk",
  },
  {
    id: "selva",
    title: "Selva",
    description: "Remember who you are and open portals to your memories using picture frames. Solve puzzles in each memory.",
    image: "/images/projects/selva.png",
    href: "/projects/selva",
  },
  {
    id: "emulsion",
    title: "Emulsion",
    description: "Trapped between two dimensions, you must vanquish monsters to escape interdimensional peril.",
    image: "/images/projects/emulsion.png",
    href: "/projects/emulsion",
  },
  {
    id: "independance-day",
    title: "IndepenDance Day",
    description: "Help John Bitcock, a robot who dreams of dancing, rewrite history so robots can dance.",
    image: "/images/projects/independance_day.png",
    href: "/projects/indepenDanceDay",
  },
  {
    id: "dicey-decks",
    title: "Dicey Decks",
    description: "Play as a dice traveling through dungeons in search of spell cards. Defeat enemies and collect money.",
    image: "/images/projects/dicey_decks.png",
    href: "/projects/diceyDecks",
  },
  {
    id: "tetris-ml",
    title: "Tetris ML",
    description: "A machine learning bot that trains to play Tetris using genetic algorithms and weighted scoring.",
    image: "/images/projects/tetris_ml.png",
    href: "/projects/tetrisML",
  },
  {
    id: "cheese-truck",
    title: "JavaFX Grilled Cheese Truck",
    description: "A food truck management simulation demonstrating object-oriented programming with threads and JavaFX.",
    image: "/images/projects/cheese_truck.png",
    href: "/projects/cheeseTruck",
  },
  {
    id: "visual-sorters",
    title: "Visual Sorters",
    description: "A program that displays the process sorting algorithms take to sort an array with visual feedback.",
    image: "/images/projects/quick_sort.png",
    href: "/projects/visualSorters",
  },
  {
    id: "y86",
    title: "x86-Like CPU",
    description: "A y86 CPU implementation, a reduced version of x86, created for computer organization class.",
    image: "/images/projects/logisim.png",
    href: "/projects/y86",
  },
];

export default function ProjectsPage() {
  return (
    <div className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Projects
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto">
            A collection of games, engines, and programming projects
          </p>
        </section>

        {/* Projects Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={project.href}
                className="group block h-full"
              >
                <Glass className="p-4 md:p-5 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-pointer">
                  <div className="relative w-full aspect-square mb-3 rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {project.title}
                  </h2>
                  <p className="text-white/80 text-xs md:text-sm leading-relaxed grow">
                    {project.description}
                  </p>
                </Glass>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
