"use client";

import Glass from "./Glass";
import Image from "next/image";

interface Link {
  href: string;
  label: string;
}

interface ProjectHeroProps {
  title: string;
  image: string;
  imageAlt: string;
  description: string | React.ReactNode;
  secondaryDescription?: string | React.ReactNode;
  links?: Link[];
}

export default function ProjectHero({
  title,
  image,
  imageAlt,
  description,
  secondaryDescription,
  links = [],
}: ProjectHeroProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-center">
      <div className="relative w-full md:w-1/2 aspect-video max-w-sm">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      <Glass className="flex-1 p-5 md:p-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {title}
        </h1>
        <div className="text-base md:text-lg text-white/90 mb-4 leading-relaxed">
          {typeof description === "string" ? <p>{description}</p> : description}
        </div>
        {secondaryDescription && (
          <div className="text-sm md:text-base text-white/80 mb-6 leading-relaxed">
            {typeof secondaryDescription === "string" ? (
              <p>{secondaryDescription}</p>
            ) : (
              secondaryDescription
            )}
          </div>
        )}
        {links.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {links.map((link, index) => (
              <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white font-semibold text-sm transition-all duration-300 hover:scale-105"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </Glass>
    </div>
  );
}

