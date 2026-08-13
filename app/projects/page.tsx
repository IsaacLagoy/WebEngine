"use client";

import Glass from "../components/Glass";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";

interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  href: string;
  types?: string[];
}

const projects: Project[] = [
  {
    id: "mekf",
    title: "MEKF",
    description: "A multiplicative extended Kalman filter for Windhover Labs, running in Gazebo SITL.",
    image: "/images/projects/mekf.jpg",
    href: "/projects/mekf",
  },
  {
    id: "visage",
    title: "Visage",
    description: "Terrain visualization for remote drone pilots from telemetry, built at Windhover Labs.",
    image: "/images/projects/visage.jpg",
    href: "/projects/visage",
  },
  {
    id: "bad-apple-suzanne",
    title: "Bad Apple But It's Suzanne",
    description: "Recreation of the Bad Apple music video with raytraced Suzanne the Blender Monkey",
    image: "/images/projects/bad_apple_suzanne.png",
    href: "/projects/bad-apple-suzanne",
  },
  {
    id: "ray-trace",
    title: "Monte Carlo Ray Tracer",
    description: "Ray tracer built for CSCE 441, Computer Graphics",
    image: "/images/projects/death_by_a_thousand_samples.png",
    href: "/projects/ray-tracing",
  },
  {
    id: "crumple-quest",
    title: "Crumple Quest",
    description: "A puzzle platformer where you fold paper levels to solve puzzles and progress through the game.",
    image: "/images/projects/crumple_quest.png",
    href: "/projects/crumple-quest",  
    types: ["game"],
  },
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
    types: ["game"],
  },
  {
    id: "emulsion",
    title: "Emulsion",
    description: "Trapped between two dimensions, you must vanquish monsters to escape interdimensional peril.",
    image: "/images/projects/emulsion.png",
    href: "/projects/emulsion",
    types: ["game"],
  },
  {
    id: "oldnology",
    title: "Oldnology",
    description: "You are oldnology and you have to fight newnology so get with the times.",
    image: "/images/projects/oldnology.png",
    href: "/projects/oldnology",
    types: ["game"],
  },
  {
    id: "independance-day",
    title: "IndepenDance Day",
    description: "Help John Bitcock, a robot who dreams of dancing, rewrite history so robots can dance.",
    image: "/images/projects/independance_day.png",
    href: "/projects/independance-day",
    types: ["game"],
  },
  {
    id: "barnes-hut",
    title: "Barnes-Hut Simulation",
    description: "A simulation of the Barnes-Hut algorithm for gravitational force calculations.",
    image: "/images/projects/barnes_hut.png",
    href: "/projects/barnes-hut",
  },
  {
    id: "matrix-stack",
    title: "Matrix Stack",
    description: "See how the matrix stack works in a 2D canvas.",
    image: "/images/assets/matrix_stack.png",
    href: "/games/matrix-stack",
    types: ["game", "web"],
  },
  {
    id: "pos-system",
    title: "Restaurant Point of Sale System",
    description: "An AI-powered POS system that manages customer orders and provides Text-to-Speech responses.",
    image: "/images/projects/pos_home.png",
    href: "/projects/pos-system",
  },
  {
    id: "avbd3d",
    title: "AVBD 3D Physics Engine",
    description: "Extended the AVBD 2D engine into a fully 3D solver ahead of the public release of the University of Utah's research implementation.",
    image: "/images/projects/avbd3d.png",
    href: "/projects/avbd3d",
  },
  {
    id: "dicey-decks",
    title: "Dicey Decks",
    description: "Play as a dice traveling through dungeons in search of spell cards. Defeat enemies and collect money.",
    image: "/images/projects/dicey_decks.png",
    href: "/projects/dicey-decks",
    types: ["game"],
  },
  {
    id: "geologic-time-periods",
    title: "Geologic Time Periods",
    description: "Test your knowledge of geologic time periods.",
    image: "/images/assets/rock.jpg",
    href: "/games/geology-periods",
    types: ["game", "web"],
  },
  {
    id: "tetris-ml",
    title: "Tetris ML",
    description: "A machine learning bot that trains to play Tetris using genetic algorithms and weighted scoring.",
    image: "/images/projects/tetris_ml.png",
    href: "/projects/tetris-ml",
  },
  {
    id: "cheese-truck",
    title: "JavaFX Grilled Cheese Truck",
    description: "A food truck management simulation demonstrating object-oriented programming with threads and JavaFX.",
    image: "/images/projects/cheese_truck.png",
    href: "/projects/cheese-truck",
  },
  {
    id: "visual-sorters",
    title: "Visual Sorters",
    description: "A program that displays the process sorting algorithms take to sort an array with visual feedback.",
    image: "/images/projects/quick_sort.png",
    href: "/projects/visual-sorters",
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
  const availableTypes = useMemo(() => {
    const uniqueTypes = new Set<string>();
    for (const project of projects) {
      for (const type of project.types ?? []) {
        uniqueTypes.add(type);
      }
    }
    return Array.from(uniqueTypes).sort();
  }, []);

  type ProjectFilter = "all" | (typeof availableTypes)[number];
  const [filter, setFilter] = useState<ProjectFilter>("all");

  const filteredProjects = useMemo(() => {
    if (filter === "all") {
      return projects;
    }
    return projects.filter((project) => (project.types ?? []).includes(filter));
  }, [filter]);

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const type of availableTypes) {
      counts.set(type, 0);
    }
    for (const project of projects) {
      for (const type of project.types ?? []) {
        counts.set(type, (counts.get(type) ?? 0) + 1);
      }
    }
    return counts;
  }, [availableTypes]);

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

        {/* Filter Controls */}
        <section>
          <Glass className="p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
                  filter === "all"
                    ? "bg-white/20 border-white/40 text-white"
                    : "bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
                }`}
              >
                All ({projects.length})
              </button>
              {availableTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilter(type)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors border ${
                    filter === type
                      ? "bg-white/20 border-white/40 text-white"
                      : "bg-white/5 border-white/20 text-white/80 hover:bg-white/10"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({typeCounts.get(type) ?? 0})
                </button>
              ))}
            </div>
          </Glass>
        </section>

        {/* Projects Grid */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredProjects.map((project) => (
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
