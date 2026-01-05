"use client";

import { useEffect, useState } from "react";
import Glass from "../components/Glass";

interface Job {
  name: string;
  logo: string;
  description: string;
  link: string | null;
  imagePosition: "left" | "right";
}

interface GameAward {
  name: string;
  href: string;
  image: string;
}

interface Classwork {
  name: string;
  subject: string;
  course: number;
  description: string;
}

// Jobs data
const jobsData: Job[] = [
  {
    name: "Structurology",
    logo: "/images/work/structurology_logo.png",
    description: "I worked at Structurology during Summer 2024. I primarily made Microsoft Flows to automate processes for the engineers working at Structurology but I also worked on some tools to make accessing online data faster.",
    link: "https://www.structurology.com",
    imagePosition: "left",
  },
  {
    name: "iSTAR",
    logo: "/images/work/iSTAR_logo.png",
    description: "I started working with iSTAR, under Dr. Eman Hammad, during the spring 2024 semester doing a combination of IT and web development. I worked on the Cyber Expert Project Team where we designed a website to host virtual labs for students and monitor their engagement. I'm currently researching the viability of implementing trust based network architecture with DAG based blockchains in a project called Trust DAG.",
    link: null,
    imagePosition: "right",
  },
];

export default function ExperiencePage() {
  const [gameAwards, setGameAwards] = useState<GameAward[]>([]);
  const [classwork, setClasswork] = useState<Classwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [awardsResponse, classworkResponse] = await Promise.all([
          fetch("/json/game_awards.json"),
          fetch("/json/classwork.json"),
        ]);

        const awardsData = await awardsResponse.json();
        const classworkData = await classworkResponse.json();

        setGameAwards(awardsData as GameAward[]);
        setClasswork(classworkData as Classwork[]);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen py-20 px-4 md:px-8 flex items-center justify-center">
        <div className="text-white/70">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Hero Section */}
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Experience
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto">
            Professional journey, research, and academic achievements
          </p>
        </section>

        {/* Jobs and Research Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Jobs & Research
            </h2>
            <p className="text-white/60 text-xs md:text-sm">Professional journey and academic research</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {jobsData.map((job, index) => (
              <Glass 
                key={index}
                className="p-5 md:p-6 hover:bg-white/15 transition-all duration-300 flex flex-col"
              >
                <div className="mb-4 flex items-center gap-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 shrink-0 flex items-center justify-center">
                    <img
                      src={job.logo}
                      alt={job.name}
                      className="max-w-full max-h-full object-contain opacity-90"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        if (target.parentElement) {
                          target.parentElement.innerHTML = `<span class="text-white/50 text-sm font-semibold">${job.name}</span>`;
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg md:text-xl font-bold text-white mb-2">
                      {job.name}
                    </h3>
                    {job.link && (
                      <a
                        href={job.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-white/70 hover:text-white text-xs transition-colors group"
                      >
                        <span>Visit website</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </a>
                    )}
                  </div>
                </div>
                <p className="text-white/85 text-sm md:text-base leading-relaxed">
                  {job.description}
                </p>
              </Glass>
            ))}
          </div>
        </section>

        {/* Game Awards Section */}
        {gameAwards.length > 0 && (
          <section>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Game Awards
              </h2>
              <p className="text-white/60 text-xs md:text-sm">Recognition for game development achievements</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {gameAwards.map((award, index) => {
                const isLarge = index === 0 || index === gameAwards.length - 1;
                const spanClass = isLarge ? "md:col-span-2" : "";
                
                return (
                  <a
                    key={index}
                    href={`/projects/${award.href}`}
                    className={`group ${spanClass}`}
                  >
                    <Glass className="p-0 overflow-hidden hover:bg-white/15 transition-all duration-300 h-full flex flex-col">
                      <div className="aspect-video relative bg-white/5 overflow-hidden">
                        <img
                          src={`/images/projects/${award.image}`}
                          alt={award.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            if (target.parentElement) {
                              target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white/50 text-xs">${award.name}</div>`;
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="p-4 md:p-5 flex-1 flex flex-col">
                        <h3 className="text-white font-semibold text-sm md:text-base group-hover:text-white transition-colors">
                          {award.name}
                        </h3>
                      </div>
                    </Glass>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* Notable Classwork Section */}
        {classwork.length > 0 && (
          <section>
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Notable Classwork
              </h2>
              <p className="text-white/60 text-xs md:text-sm">Selected courses and academic achievements</p>
            </div>
            
            <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-4 md:gap-6">
              {classwork.map((item, index) => {
                const heightVariation = index % 3 === 0 ? "md:min-h-[180px]" : index % 3 === 1 ? "md:min-h-[160px]" : "md:min-h-[200px]";
                
                return (
                  <Glass 
                    key={index} 
                    className={`p-4 md:p-5 mb-4 md:mb-6 break-inside-avoid hover:bg-white/15 transition-all duration-300 ${heightVariation} flex flex-col`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-bold text-base md:text-lg leading-tight pr-2">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-white/60 mb-2 text-xs font-medium">
                      {item.subject} {item.course}
                    </p>
                    <p className="text-white/80 text-xs leading-relaxed flex-1">
                      {item.description}
                    </p>
                  </Glass>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
