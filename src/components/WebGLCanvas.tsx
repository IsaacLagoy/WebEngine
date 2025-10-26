import { useRef, useEffect } from "react";
import { Program } from "../engine/core/program";
import { Scene } from "../engine/objects/scene";
import { Engine } from "../engine/objects/engine";
import { Mesh } from "../engine/objects/mesh";
import { Node } from "../engine/objects/node";
import { vec3, quat } from "gl-matrix";
import { Material } from "../engine/objects/material";
import { randomVec3 } from "../math/random";


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

        const gl = canvas.getContext("webgl");
        if (!gl) return console.error("WebGL not supported");

        const init = async () => {
            // Load main scene shader program (async)
            const program = await Program.create(
                gl, 
                "/shaders/default.vert", 
                "/shaders/default.frag"
            );

            // Create engine (async - loads quad shader)
            const engine = await Engine.create(gl);

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

                // render
                engine.render(program.program);
                requestAnimationFrame(render);
            }

            requestAnimationFrame(render);

            // handle resize
            const handleResize = () => {
                engine.resizeCanvas();
            };
            window.addEventListener('resize', handleResize);
            
            return () => {
                window.removeEventListener('resize', handleResize);
            };
        };
        init().catch(err => console.error("Init error:", err));
    }, []);

    return <canvas ref={canvasRef} width={800} height={600} />;
}