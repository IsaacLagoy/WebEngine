"use client";

import Glass from "./Glass";
import { ReactNode } from "react";

interface ContentSectionProps {
  title: string;
  children: ReactNode;
}

export default function ContentSection({ title, children }: ContentSectionProps) {
  return (
    <Glass className="p-5 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
        {title}
      </h2>
      <div className="space-y-3 text-white/90 text-sm md:text-base leading-relaxed">
        {children}
      </div>
    </Glass>
  );
}

