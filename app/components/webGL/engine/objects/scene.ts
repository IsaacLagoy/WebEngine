import { Node } from "./node";
import { Camera } from "../core/camera";
import { Engine } from "./engine";

/**
 * Scene class - contains all objects in the 3D world
 * A scene is a collection of nodes (3D objects) that get rendered together
 */
export class Scene {
    engine: Engine;
    nodes: Node[] = [];  // All 3D objects in the scene

    constructor(engine: Engine) {
        this.engine = engine;

        // Set this as the engine's main scene if none exists
        if (!engine.scene) {
            engine.scene = this;
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
     * @param camera - Camera that defines the viewpoint
     */
    draw(program: WebGLProgram, camera: Camera) {
        // Get view-projection matrix (combines camera view + perspective projection)
        const vpMatrix = camera.getViewProjectionMatrix();
        const camPos = camera.position as [number, number, number];

        // Draw each object in the scene
        for (const node of this.nodes) {
            node.draw(this.gl(), program, vpMatrix, camPos);
        }
    }
}

