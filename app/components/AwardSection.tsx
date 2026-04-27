"use client";

import Glass from "./Glass";
import Image from "next/image";
import { ReactNode } from "react";

interface AwardSectionProps {
  title: string;
  description: string | ReactNode;
  awardImage: string;
  awardImageAlt: string;
}

export default function AwardSection({
  title,
  description,
  awardImage,
  awardImageAlt,
}: AwardSectionProps) {
  return (
    <Glass className="p-5 md:p-6">
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="flex-1">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            {title}
          </h2>
          <div className="text-white/90 text-sm md:text-base leading-relaxed">
            {typeof description === "string" ? <p>{description}</p> : description}
          </div>
        </div>
        <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
          <Image
            src={awardImage}
            alt={awardImageAlt}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 128px, 160px"
          />
        </div>
      </div>
    </Glass>
  );
}

