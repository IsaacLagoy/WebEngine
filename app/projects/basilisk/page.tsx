"use client";

import Glass from "../../components/Glass";
import Link from "next/link";
import Image from "next/image";

export default function BasiliskPage() {
  const games = [
    {
      name: "Selva",
      image: "/images/projects/selva.png",
      href: "/projects/selva",
      award: "Spring 2025 Best in Programming",
    },
    {
      name: "Emulsion",
      image: "/images/projects/emulsion.png",
      href: "/projects/emulsion",
      award: "2nd Place at Chillennium 2025",
    },
    {
      name: "IndepenDance Day",
      image: "/images/projects/independance_day.png",
      href: "/projects/indepenDanceDay",
      award: "Fall 2024 Best in Game Design",
    },
    {
      name: "Dicey Decks",
      image: "/images/projects/dicey_decks.png",
      href: "/projects/diceyDecks",
      award: "Spring 2024 Best in Programming",
    },
  ];

  const features = [
    {
      title: "Python Native",
      description: "Write your entire game in Python—no need to learn C++ or other low-level languages.",
    },
    {
      title: "GLSL Shaders",
      description: "Full support for custom GLSL shaders, giving you complete control over rendering.",
    },
    {
      title: "3D Graphics",
      description: "Built-in 3D rendering pipeline with support for models, lighting, and materials.",
    },
    {
      title: "Easy Installation",
      description: "Install with a single pip command. No complex setup or configuration required.",
    },
  ];

  return (
    <div className="min-h-screen px-4 md:px-8 py-8 md:py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center">
          <div className="inline-block mb-4">
            <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto">
              <Image
                src="/images/basilisk/basilisk_square_white.png"
                alt="Basilisk Engine"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 96px, 128px"
              />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Basilisk Engine
          </h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-6">
            A 3D game engine built with Python and GLSL. Create games without leaving your favorite language.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://github.com/BasiliskGroup/BasiliskEngine"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
            >
              View on GitHub
            </a>
            <a
              href="https://pypi.org/project/basilisk-engine/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
            >
              Install from PyPI
            </a>
          </div>
        </div>

        {/* Quick Start */}
        <Glass className="p-5 md:p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Get Started
          </h2>
          <div className="space-y-3">
            <p className="text-white/90 text-sm md:text-base">
              Install Basilisk Engine with pip:
            </p>
            <Glass className="p-3 bg-white/5">
              <code className="text-white font-mono text-sm md:text-base">
                pip install basilisk-engine
              </code>
            </Glass>
            <p className="text-white/70 text-xs md:text-sm mt-3">
              That's it! You're ready to start building 3D games in Python.
            </p>
          </div>
        </Glass>

        {/* Features Grid */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            Why Basilisk?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <Glass key={index} className="p-4 md:p-5 h-full">
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/80 text-sm md:text-base leading-relaxed">
                  {feature.description}
                </p>
              </Glass>
            ))}
          </div>
        </div>

        {/* Games Showcase */}
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">
            Games Built with Basilisk
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map((game, index) => (
              <Link key={index} href={game.href} className="group block h-full">
                <Glass className="p-4 h-full transition-all duration-300 hover:scale-105 hover:bg-white/5 cursor-pointer">
                  <div className="relative w-full aspect-video mb-3 rounded-lg overflow-hidden bg-white/5">
                    <Image
                      src={game.image}
                      alt={game.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1">
                    {game.name}
                  </h3>
                  <p className="text-white/70 text-xs md:text-sm">{game.award}</p>
                </Glass>
              </Link>
            ))}
          </div>
        </div>

        {/* About Section */}
        <Glass className="p-5 md:p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            About
          </h2>
          <div className="space-y-3 text-white/90 text-sm md:text-base leading-relaxed">
            <p>
              Basilisk Engine was born from a simple idea: what if you could build 3D games entirely in Python? 
              No need to learn C++ or deal with complex build systems. Just write Python code and create amazing games.
            </p>
            <p>
              Starting as a proof of concept during a game jam, Basilisk has grown into a full-featured engine 
              that has powered multiple award-winning games. From{" "}
              <Link href="/projects/diceyDecks" className="text-white underline hover:text-white/80">
                Dicey Decks
              </Link>{" "}
              to{" "}
              <Link href="/projects/selva" className="text-white underline hover:text-white/80">
                Selva
              </Link>
              , each game has pushed the engine further and proven that Python is more than capable of powering 
              real-time 3D graphics.
            </p>
            <p>
              Today, Basilisk Engine is available as a Python package, making it easy for anyone to get started. 
              Whether you're a Python developer looking to explore game development or a game developer who wants 
              to leverage Python's simplicity, Basilisk Engine provides the tools you need.
            </p>
          </div>
        </Glass>
      </div>
    </div>
  );
}

