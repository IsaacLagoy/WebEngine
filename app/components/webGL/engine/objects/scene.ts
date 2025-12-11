import { Node } from "./node";
import { Camera } from "../core/camera";
import { Engine } from "./engine";
import { Shader } from "../core/shader";
/**
 * Scene class - contains all objects in the 3D world
 * A scene is a collection of nodes (3D objects) that get rendered together
 */
export class Scene {
    engine: Engine;
    nodes: Node[] = [];  // All 3D objects in the scene
    shader: Shader | null = null;
    camera: Camera;

    constructor(engine: Engine, shader?: Shader) {
        this.engine = engine;

        // Set this as the engine's main scene if none exists
        if (!engine.scene) {
            engine.scene = this;
        }

        this.camera = new Camera(engine);
        if (shader) {
            this.shader = shader;
        }
    }

    /**
     * Add a node (3D object) to the scene
     */
    add(node: Node) {
        this.nodes.push(node);
    }

    gl(): WebGL2RenderingContext {
        return this.engine.gl;
    }

    /**
     * Draws all nodes in the scene
     * @param program - Shader program to use for rendering
     */
    draw(program: WebGLProgram) {
        // Get view-projection matrix (combines camera view + perspective projection)
        const vpMatrix = this.camera.getViewProjectionMatrix();
        const camPos = this.camera.position as [number, number, number];

        // Draw each object in the scene
        for (const node of this.nodes) {
            node.draw(this.gl(), program, vpMatrix, camPos);
        }
    }

    update(dt: number) {
        for (const node of this.nodes) {
            node.update(dt);
        }

        if (this.shader) {
            this.camera.use(this.shader);
        }
    }

    /**
     * Render the scene using the given shader program
     * @param program - Shader program to use for rendering
     */
    render() {
        if (!this.shader) return;
        const gl = this.gl();
        // Ensure depth testing is enabled for 3D rendering
        gl.enable(gl.DEPTH_TEST);
        this.shader.use();
        this.draw(this.shader.program);
    }
}

