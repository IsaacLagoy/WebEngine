"use client";

import { ReactNode } from "react";

interface ProjectPageLayoutProps {
  children: ReactNode;
}

export default function ProjectPageLayout({ children }: ProjectPageLayoutProps) {
  return (
    <div className="min-h-screen px-4 md:px-8 pt-20 md:pt-24 pb-8 md:pb-12">
      <div className="max-w-5xl mx-auto space-y-8">
        {children}
      </div>
    </div>
  );
}

