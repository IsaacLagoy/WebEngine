"use client";

import { useRef, useEffect, useState } from "react";
import type { RenderFunction } from "./index";

interface WebGLCanvasProps {
  sceneFactory: (gl: WebGL2RenderingContext) => Promise<RenderFunction>;
  /**
   * Resolution scale factor (0.0 to 1.0)
   * Renders at a lower resolution and scales up to fit the screen
   * Lower values improve performance but reduce quality
   * Default: 1.0 (full resolution)
   */
  resolutionScale?: number;
  /**
   * Whether to show the FPS counter on the canvas
   * Default: false
   */
  showFPS?: boolean;
}

export default function WebGLCanvas({ sceneFactory, resolutionScale = 1.0, showFPS = false }: WebGLCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const renderFunctionRef = useRef<RenderFunction | null>(null);
  const renderLoopRef = useRef<number | null>(null);
  const isPausedRef = useRef<boolean>(false);

  // Handle canvas resize to match container with throttling
  // The Engine's resizeCanvas() method will handle the actual resizing
  // We just need to trigger it when the container resizes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let resizeTimeout: number;
    const handleResize = () => {
      // Throttle resize events - wait 100ms after resize stops
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        // Call resize method on render function if available
        // This allows the Engine to handle resizing properly
        if (renderFunctionRef.current?.resize) {
          renderFunctionRef.current.resize();
        }
      }, 100);
    };

    // Use ResizeObserver to watch container size changes
    // Note: ResizeObserver may fire on transforms, but our throttling and caching will prevent unnecessary work
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Also listen to window resize as fallback
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2");
    if (!gl) {
      console.error("WebGL 2.0 not supported.");
      return;
    }

    const init = async () => {
      // Store resolution scale on the canvas so Engine.create can read it
      (canvas as any).__resolutionScale = resolutionScale;
      
      // Create scene and get render function from factory
      const render = await sceneFactory(gl);
      renderFunctionRef.current = render;

      // Enable camera controls if the render function supports it
      if (render.enableControls && canvas) {
        render.enableControls(canvas);
      }

      // Start render loop
      let frameCount = 0;
      let fpsLastTime = performance.now();
      const fpsUpdateInterval = 500;
      const targetFPS = 20; // Target frames per second
      const frameInterval = 1000 / targetFPS; // Time between frames in ms
      let lastRenderTime = performance.now();

      const animate = () => {
        if (!renderFunctionRef.current) return;

        // Pause rendering when canvas is not visible
        if (isPausedRef.current) {
          renderLoopRef.current = window.setTimeout(animate, frameInterval);
          return;
        }

        const now = performance.now();
        const elapsed = now - lastRenderTime;

        if (elapsed >= frameInterval) {
          const dt = Math.min(elapsed / 1000, 0.1);
          lastRenderTime = now;

          // Call render function from factory
          renderFunctionRef.current(dt);

          // Update FPS display if enabled
          if (showFPS) {
            frameCount++;
            const fpsElapsed = now - fpsLastTime;
            if (fpsElapsed >= fpsUpdateInterval && fpsRef.current) {
              const fps = Math.round((frameCount * 1000) / fpsElapsed);
              fpsRef.current.textContent = `FPS: ${fps}`;
              frameCount = 0;
              fpsLastTime = now;
            }
          }
        }

        // Schedule the next frame using setTimeout
        renderLoopRef.current = window.setTimeout(animate, frameInterval);
      };

      renderLoopRef.current = window.setTimeout(animate, frameInterval);
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
        // Clear both setTimeout and requestAnimationFrame
        clearTimeout(renderLoopRef.current);
        cancelAnimationFrame(renderLoopRef.current);
        renderLoopRef.current = null;
      }
    };
  }, [sceneFactory, resolutionScale, showFPS]);

  // Use Intersection Observer to pause rendering when canvas is off-screen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Pause rendering when less than 1% visible
          isPausedRef.current = !entry.isIntersecting || entry.intersectionRatio < 0.01;
        });
      },
      { threshold: 0.01 } // Start/stop when 1% visible
    );

    observer.observe(canvas);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      <canvas
        ref={canvasRef}
        tabIndex={0}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          willChange: "transform", // Hint to browser for optimization
        }}
      />
      {/* FPS Debug Display */}
      {showFPS && (
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
      )}
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