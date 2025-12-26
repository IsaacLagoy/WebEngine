import { Engine } from "./engine";
import { vec3, mat4 } from "gl-matrix";
import { Shader } from "../core/shader";
import { Quad } from "../core/quad";
/**
 * Billboard - renders a solid color quad that faces the camera
 */
export declare class Billboard {
    engine: Engine;
    position: vec3;
    size: [number, number];
    color: [number, number, number];
    quad: Quad;
    shader: Shader | null;
    constructor(engine: Engine, position: vec3, size?: [number, number], color?: [number, number, number]);
    gl(): WebGL2RenderingContext;
    init(shader: Shader): Promise<void>;
    render(viewProjMatrix: mat4, cameraPos: vec3): void;
}
//# sourceMappingURL=billboard.d.ts.map