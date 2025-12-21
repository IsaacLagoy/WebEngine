"use client";

import { useRef, useEffect, useState } from "react";
import type { RenderFunction } from "./index";

interface WebGLCanvasProps {
  sceneFactory: (gl: WebGL2RenderingContext) => Promise<RenderFunction>;
}

export default function WebGLCanvas({ sceneFactory }: WebGLCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const renderFunctionRef = useRef<RenderFunction | null>(null);
  const renderLoopRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL 2.0 not supported.");
      return;
    }

    const init = async () => {
      // Create scene and get render function from factory
      const render = await sceneFactory(gl);
      renderFunctionRef.current = render;

      // Start render loop
      let lastTime = performance.now();
      let frameCount = 0;
      let fpsLastTime = performance.now();
      const fpsUpdateInterval = 500;

      const animate = (time: number) => {
        if (!renderFunctionRef.current) return;

        const dt = Math.min((time - lastTime) / 1000, 0.1);
        lastTime = time;

        // Call render function from factory
        renderFunctionRef.current(dt);

        // Update FPS display
        frameCount++;
        const fpsElapsed = time - fpsLastTime;
        if (fpsElapsed >= fpsUpdateInterval && fpsRef.current) {
          const fps = Math.round((frameCount * 1000) / fpsElapsed);
          fpsRef.current.textContent = `FPS: ${fps}`;
          frameCount = 0;
          fpsLastTime = time;
        }

        renderLoopRef.current = requestAnimationFrame(animate);
      };

      renderLoopRef.current = requestAnimationFrame(animate);
      setIsLoading(false);
    };

    init().catch((error) => {
      console.error(error);
      setIsLoading(false);
    });

    // Cleanup on unmount
    return () => {
      if (renderFunctionRef.current?.cleanup) {
        renderFunctionRef.current.cleanup();
      }
      if (renderLoopRef.current !== null) {
        cancelAnimationFrame(renderLoopRef.current);
        renderLoopRef.current = null;
      }
    };
  }, [sceneFactory]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
      {/* FPS Debug Display */}
      <div
        ref={fpsRef}
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          padding: "8px 12px",
          borderRadius: "4px",
          fontFamily: "monospace",
          fontSize: "14px",
          fontWeight: "bold",
          zIndex: 10,
          pointerEvents: "none",
        }}
      >
        FPS: --
      </div>
      {/* Loading overlay */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-1000 ${
          isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        style={{ zIndex: 1 }}
      />
    </div>
  );
}
