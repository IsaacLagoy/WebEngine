import { Node } from "./node";
import { Camera } from "../core/camera";
import { Engine } from "./engine";

export class Scene {
    engine: Engine;
    nodes: Node[] = [];

    constructor(engine: Engine) {
        this.engine = engine;

        if (!engine.scene) {
            engine.scene = this;
        }
    }

    add(node: Node) {
        this.nodes.push(node);
    }

    gl(): WebGLRenderingContext {
        return this.engine.gl;
    }

    draw(program: WebGLProgram, camera: Camera) {
        const vpMatrix = camera.getViewProjectionMatrix();
        const camPos = camera.position as [number, number, number];

        for (const node of this.nodes) {
            node.draw(this.gl(), program, vpMatrix, camPos);
        }
    }
}

