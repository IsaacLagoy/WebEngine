"use client";

import { WebGLCanvas } from "@/lib/webgl-canvas";
import { createCampfireScene } from "@/lib/scenes";

export default function CampScene() {
  return <WebGLCanvas sceneFactory={createCampfireScene} />;
}

