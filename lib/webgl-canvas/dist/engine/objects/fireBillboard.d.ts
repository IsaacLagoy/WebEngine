import { Billboard } from "./billboard";
import { Engine } from "./engine";
import { vec3, mat4 } from "gl-matrix";
/**
 * FireBillboard - animated fire effect using sprite sheets
 * Extends Billboard with texture animation support
 */
export declare class FireBillboard extends Billboard {
    textures: WebGLTexture[];
    currentFrame: number;
    frameTime: number;
    frameDuration: number;
    constructor(engine: Engine, position: vec3, size?: [number, number], textures?: WebGLTexture[]);
    /**
     * Load all fire sprite frames
     */
    static loadFrames(engine: Engine): Promise<WebGLTexture[]>;
    /**
     * Update animation frame
     */
    update(dt: number): void;
    /**
     * Render the fire billboard with current animation frame
     */
    render(viewProjMatrix: mat4, cameraPos: vec3): void;
}
//# sourceMappingURL=fireBillboard.d.ts.map