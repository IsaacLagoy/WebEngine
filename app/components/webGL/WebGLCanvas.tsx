"use client";

import { useRef, useEffect } from "react";
import { Program } from "./engine/core/program";
import { Scene } from "./engine/objects/scene";
import { Engine } from "./engine/objects/engine";
import { Mesh } from "./engine/objects/mesh";
import { Node } from "./engine/objects/node";
import { vec3, quat } from "gl-matrix";
import { Material } from "./engine/objects/material";
import { randomVec3 } from "./math/random";
import { FrameBuffer } from "./engine/core/frameBuffer";


function getRandomPosition(rangeX: number, rangeY: number, minZ: number, maxZ: number) {
    const x = (Math.random() - 0.5) * rangeX;
    const y = (Math.random() - 0.5) * rangeY;
    const z = minZ + Math.random() * (maxZ - minZ);
    return vec3.fromValues(x, y, z);
}

export default function WebGLCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Request WebGL 2.0 context (modern standard, supported in Safari 11+)
        // WebGL 2.0 adds features like VAOs (Vertex Array Objects) for better performance
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL 2.0 not supported. Please use a modern browser.");
            return;
        }

        const init = async () => {
            // Load main scene shader program (async)
            const program = await Program.create(
                gl, 
                "/shaders/default.vert", 
                "/shaders/default.frag"
            );

            // Create engine (async - loads quad shader)
            const engine = await Engine.create(gl);

            // Manual post-process programs
            const quantizeProgram = await Program.create(
                gl,
                "/shaders/quad.vert",
                "/shaders/quantize.frag"
            );
            const greyscaleProgram = await Program.create(
                gl,
                "/shaders/quad.vert",
                "/shaders/greyscale.frag"
            );

            // Secondary framebuffer for ping-pong post-processing
            const secondaryFramebuffer = new FrameBuffer(engine);

            let lastWidth = engine.width;
            let lastHeight = engine.height;
            

            // Load meshes
            const sphereMesh = await Mesh.fromObj(engine, "/models/sphere.obj");
            const cubeMesh = await Mesh.fromObj(engine, "/models/cube.obj");

            // Create materials
            const rockMaterial = new Material(engine);
            rockMaterial.setDiffuse("/materials/rocks/rocks_Color.jpg");
            rockMaterial.setNormal("/materials/rocks/rocks_NormalGL.jpg");
            rockMaterial.setSpecular("/materials/rocks/rocks_Roughness.jpg");

            const barkMaterial = new Material(engine);
            barkMaterial.setDiffuse("/materials/bark/bark_Color.jpg");
            barkMaterial.setNormal("/materials/bark/bark_NormalGL.jpg");
            barkMaterial.setSpecular("/materials/bark/bark_Roughness.jpg");

            const plainMaterial = new Material(engine);

            // Create scene
            const scene = new Scene(engine);

            // Create nodes with random positions
            const nodes: Node[] = [];
            const numCubes = 1000;

            for (let i = 0; i < numCubes; i++) {
                const position = getRandomPosition(50, 50, -50, 50);
                const scale = vec3.fromValues(0.5, 0.5, 0.5);
                const rotation = quat.create();

                const material = i % 3 === 0 ? rockMaterial : 
                                (i % 3 === 1 ? plainMaterial : barkMaterial);
                const mesh = i % 2 === 0 ? cubeMesh : sphereMesh;

                const node = new Node(scene, position, scale, rotation, mesh, material);
                node.angularVelocity = randomVec3(
                    vec3.fromValues(-2, -2, -2), 
                    vec3.fromValues(2, 2, 2)
                );
                nodes.push(node);
                scene.add(node);
            }

            // time variables
            let frameCount = 0;
            let lastTime = performance.now();
            let fpsTime = performance.now();

            // Render loop
            function render(currentTime: number) {
                if (!gl) return;

                // Check and resize canvas if needed (handles window resizing)
                // This ensures dimensions are always correct before rendering
                engine.resizeCanvas();

                // Resize secondary framebuffer if canvas size changed
                if (engine.width !== lastWidth || engine.height !== lastHeight) {
                    secondaryFramebuffer.resize();
                    lastWidth = engine.width;
                    lastHeight = engine.height;
                }

                const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
                lastTime = currentTime;

                // physics
                for (const node of nodes) node.update(dt);

                frameCount++;
                if (currentTime - fpsTime > 1000) {
                    console.log(`FPS: ${frameCount}`);
                    frameCount = 0;
                    fpsTime = currentTime;
                }

                // render: scene to offscreen framebuffer
                engine.beginFrame();
                engine.drawScene(program.program);
                engine.endFrame();

                // post: greyscale -> secondary framebuffer
                if (engine.framebuffer.colorTexture && secondaryFramebuffer.colorTexture) {
                    engine.blitToFramebuffer(
                        engine.framebuffer.colorTexture,
                        greyscaleProgram,
                        secondaryFramebuffer
                    );
                }

                // post: quantize -> screen
                if (secondaryFramebuffer.colorTexture) {
                    engine.present(
                        secondaryFramebuffer.colorTexture,
                        quantizeProgram,
                        (glCtx, prog) => {
                            const loc = glCtx.getUniformLocation(prog, "uQuantizationLevel");
                            if (loc !== null) {
                                glCtx.uniform1f(loc, 4.0); // 4 color levels per channel
                            }
                        }
                    );
                }
                requestAnimationFrame(render);
            }

            requestAnimationFrame(render);

            // Use ResizeObserver for accurate canvas resizing
            // Based on: https://webglfundamentals.org/webgl/lessons/webgl-resizing-the-canvas.html
            // This provides the most accurate size information, especially with devicePixelRatio
            const rect = canvas.getBoundingClientRect();
            const initialDpr = window.devicePixelRatio || 1;
            const canvasToDisplaySizeMap = new Map<HTMLCanvasElement, [number, number]>([
                [canvas, [Math.round(rect.width * initialDpr), Math.round(rect.height * initialDpr)]]
            ]);

            function onResize(entries: ResizeObserverEntry[]) {
                for (const entry of entries) {
                    let width: number;
                    let height: number;
                    let dpr = window.devicePixelRatio || 1;

                    if (entry.devicePixelContentBoxSize && entry.devicePixelContentBoxSize.length > 0) {
                        // Best path: Chrome/Edge only - gives exact device pixel size
                        const size = entry.devicePixelContentBoxSize[0];
                        width = size.inlineSize;
                        height = size.blockSize;
                        dpr = 1; // Already in device pixels
                    } else if (entry.contentBoxSize && Array.isArray(entry.contentBoxSize) && entry.contentBoxSize.length > 0) {
                        // Fallback: use contentBoxSize if available (array format)
                        const size = entry.contentBoxSize[0];
                        width = size.inlineSize;
                        height = size.blockSize;
                    } else {
                        // Final fallback: use contentRect (works in all browsers)
                        width = entry.contentRect.width;
                        height = entry.contentRect.height;
                    }

                    const displayWidth = Math.round(width * dpr);
                    const displayHeight = Math.round(height * dpr);
                    canvasToDisplaySizeMap.set(entry.target as HTMLCanvasElement, [displayWidth, displayHeight]);
                    
                    // Trigger resize on engine
                    engine.resizeCanvas();
                }
            }

            const resizeObserver = new ResizeObserver(onResize);
            try {
                // Try to observe device-pixel-content-box (Chrome/Edge only)
                resizeObserver.observe(canvas, { box: 'device-pixel-content-box' });
            } catch (ex) {
                // Fallback to content-box for other browsers
                resizeObserver.observe(canvas, { box: 'content-box' });
            }

            // Override engine.resizeCanvas to use ResizeObserver data
            engine.resizeCanvas = function() {
                const [displayWidth, displayHeight] = canvasToDisplaySizeMap.get(canvas) || [canvas.width || 300, canvas.height || 150];
                const canvasEl = this.gl.canvas as HTMLCanvasElement;

                // Don't resize if dimensions are invalid
                if (displayWidth <= 0 || displayHeight <= 0) {
                    return;
                }

                // Check if the canvas is not the same size
                if (canvasEl.width !== displayWidth || canvasEl.height !== displayHeight) {
                    // Make the canvas the same size
                    canvasEl.width = displayWidth;
                    canvasEl.height = displayHeight;
                    this.width = displayWidth;
                    this.height = displayHeight;

                    // Update camera aspect ratio
                    this.camera.setAspect(displayWidth / displayHeight);

                    // Resize framebuffer to match new canvas size
                    if (this.framebuffer) {
                        this.framebuffer.resize();
                    }
                }

                // Always set viewport to current dimensions
                // This is critical - WebGL doesn't automatically update viewport when canvas resizes
                this.gl.viewport(0, 0, this.width, this.height);
            };

            // Initial resize to set up canvas properly
            engine.resizeCanvas();
            
            return () => {
                resizeObserver.disconnect();
            };
        };
        init().catch(err => console.error("Init error:", err));
    }, []);

    return (
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: '100%', 
          height: '100%', 
          display: 'block',
          pointerEvents: 'none'
        }} 
      />
    );
}