"use client";

import { WebGLCanvas } from "@/lib/webgl-canvas";
import { createGlueGunScene } from "@/lib/scenes";

export default function GlueScene() {
  return <WebGLCanvas sceneFactory={createGlueGunScene} />;
}

