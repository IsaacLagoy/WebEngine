"use client";

import Glass from "./components/Glass";
import Link from "next/link";
import { useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";


export default function Home() {
  const skills = [
    "cpp",
    "python",
    "java",
    "typescript",
    "javascript",
    "html",
    "css",
    "haskell",
    "cmake",
    "postgresql",
    "sveltekit",
    "react",
    "git",
    "github",
    "docker",
    "tailwind",
  ];

  const scrollContainerRef = useRef<HTMLDivElement>(null);

useLayoutEffect(() => {
  const track = scrollContainerRef.current;
  if (!track) return;

  let rafId: number;
  let offset = 0;
  const speed = 0.3;

  // Measure ONCE, after layout has settled
  const measure = () => {
    const firstChild = track.firstElementChild as HTMLElement;
    if (!firstChild) {
      rafId = requestAnimationFrame(measure);
      return;
    }

    // Calculate the width of one set of skills (half of total since we duplicate)
    const skillCount = track.children.length / 2;
    const childWidth = firstChild.offsetWidth;
    const gap = 32; // gap-8 = 32px
    const loopWidth = (childWidth + gap) * skillCount;

    const animate = () => {
      offset += speed;
      if (offset >= loopWidth) {
        offset = 0;
      }
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(measure);
  return () => cancelAnimationFrame(rafId);
}, []);

  return (
    <div className="min-h-screen">
      {/* Welcome Section - Full Viewport */}
      <section className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Welcome &lt;3
        </h1>
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <svg 
            className="w-6 h-6 text-white/60" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
          </svg>
        </div>
      </section>

      {/* Projects Section */}
      <section className="flex items-center justify-center px-4 md:px-8 py-6 md:py-6">
        <div className="max-w-7xl mx-auto w-full">
          {/* Headers - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-3 gap-6 mb-3">
            <div>
              <h2 className="text-3xl font-bold text-white">
                Featured Project
              </h2>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">
                Latest Project
              </h2>
            </div>
            <div></div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:grid-rows-3">
            {/* Column 1, Rows 1-3 - Featured Project */}
            <div className="md:row-span-3">
              <Link
                href={"/projects/basilisk"}
                className="group block h-full"
              >
                <Glass className="p-4 md:p-5 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-pointer">
                  <div className="relative w-full aspect-2/1 md:aspect-square mb-3 rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={"/images/basilisk/basilisk_square_white.png"}
                      alt={"Basilisk Engine"}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <h2 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {"Basilisk Engine"}
                  </h2>
                  <p className="text-white/80 text-xs md:text-sm leading-relaxed grow">
                    {"A custom game engine built from scratch in Python, featuring real-time 3D rendering, physics simulation, and a complete development toolkit."}
                  </p>
                </Glass>
              </Link>
            </div>

            {/* Column 2, Rows 1-2 - Latest Project */}
            <div className="md:row-span-2">
              <Link
                href={"/projects/crumpleQuest"}
                className="group block h-full"
              >
                <Glass className="p-4 md:p-5 h-full flex flex-col transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-pointer">
                  <div className="relative aspect-2/1 mb-3 rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={"/images/projects/crumple_quest.png"}
                      alt={"Crumple Quest"}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                    {"Crumple Quest"}
                  </h3>
                  <p className="text-white/80 text-xs md:text-sm leading-relaxed">
                    {"Award-winning 2D dungeon crawler with innovative paper-folding mechanics and intelligent AI pathfinding. Winner of Fall 2025 TAGD Best in Programming."}
                  </p>
                </Glass>
              </Link>
            </div>

            {/* Column 3, Row 1 - All Projects Link */}
            <div>
              <Link href="/projects" className="group block h-full">
                <Glass className="p-6 md:p-8 h-full hover:bg-white/15 transition-all duration-300 text-center flex flex-col justify-center">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    View All Projects
                  </h3>
                  <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                    Explore my portfolio →
                  </p>
                </Glass>
              </Link>
            </div>

            {/* Column 3, Row 2 - Experience Link */}
            <div>
              <Link href="/experience" className="group block h-full">
                <Glass className="p-6 md:p-8 h-full hover:bg-white/15 transition-all duration-300 text-center flex flex-col justify-center">
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    Experience
                  </h3>
                  <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                    Learn about my journey →
                  </p>
                </Glass>
              </Link>
            </div>

            {/* Column 2-3, Row 3 - Education */}
            <div className="md:col-span-2">
              <Glass className="p-6 md:p-8 h-full flex items-center">
                <div className="flex items-center gap-6 w-full">
                  <img
                    src="/images/school/tamu_logo.png" 
                    alt="Texas A&M University"
                    className="w-20 h-20 md:w-24 md:h-24 object-contain opacity-90 shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="space-y-1 text-white/90">
                    <p className="font-semibold text-white text-base md:text-lg">
                      BS, Computer Science — Texas A&M University
                    </p>
                    <p className="text-sm md:text-base">4.0 GPA • Math Minor • Master's Fast Track</p>
                    <p className="text-sm md:text-base">Expected Graduation: December 2026</p>
                  </div>
                </div>
              </Glass>
            </div>
          </div>

          {/* Skills Section */}
          <div className="space-y-6 mt-12">
            <h2 className="text-4xl md:text-4xl font-bold text-white">
              Skills
            </h2>
          </div>
        </div>
      </section>

      {/* Skills Carousel - Full Width */}
      <section className="w-full overflow-hidden py-6 pb-20">
        <div className="overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex gap-8 will-change-transform"
          >
            {[...skills, ...skills].map((skill, index) => (
              <div
                key={`skill-${index}`}
                className="shrink-0 w-20 h-20 md:w-24 md:h-24 flex items-center justify-center"
              >
                <img
                  src={`/graphics/skills/${skill}_logo.svg`}
                  alt={skill}
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  ); 
}