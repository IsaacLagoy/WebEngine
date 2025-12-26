"use client";

import { WebGLCanvas } from "@/lib/webgl-canvas";
import { createCubeScene } from "@/lib/scenes";

export default function CubeScene() {
  return <WebGLCanvas sceneFactory={createCubeScene} />;
}

