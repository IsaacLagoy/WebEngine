"use client";

import { useEffect, useRef } from "react";
import { createCampScene } from "./render-engine/campScene";

export default function CampScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const campScene = createCampScene(container);
    return () => campScene.dispose();
  }, []);

  return <div ref={containerRef} className="w-full h-full" />;
}

