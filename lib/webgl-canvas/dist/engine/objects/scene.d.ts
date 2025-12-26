import { Node } from "./node";
import { Camera } from "../core/camera";
import { Engine } from "./engine";
import { Shader } from "../core/shader";
import { PointLight } from "./pointLight";
import { InstanceGroup } from "./instanceGroup";
import { Billboard } from "./billboard";
import { FireBillboard } from "./fireBillboard";
import { Skybox } from "./skybox";
import { vec3 } from "gl-matrix";
/**
 * Scene class - contains all objects in the 3D world
 * A scene is a collection of nodes (3D objects) that get rendered together
 * Uses instancing to batch nodes with the same mesh+material for efficient rendering
 */
export declare class Scene {
    engine: Engine;
    nodes: Node[];
    instanceGroups: Map<string, InstanceGroup>;
    pointLights: PointLight[];
    billboards: Billboard[];
    fireBillboards: FireBillboard[];
    skybox: Skybox | null;
    shader: Shader | null;
    camera: Camera;
    private keysPressed;
    private mouseDeltaX;
    private mouseDeltaY;
    private isPointerLocked;
    private canvas;
    mouseSensitivity: number;
    private handleKeyDown;
    private handleKeyUp;
    private handleMouseMove;
    private handleMouseDown;
    private handlePointerLockChange;
    private handlePointerLockError;
    fogColor: vec3;
    fogStart: number;
    fogEnd: number;
    fogDensity: number;
    constructor(engine: Engine, shader?: Shader);
    /**
     * Get a unique key for a mesh+material combination
     */
    private getInstanceGroupKey;
    /**
     * Add a node (3D object) to the scene
     * Automatically groups nodes by mesh+material for instanced rendering
     */
    add(node: Node): void;
    /**
     * Remove a node from the scene
     */
    remove(node: Node): void;
    /**
     * Add a point light to the scene
     */
    addPointLight(light: PointLight): void;
    /**
     * Add a billboard to the scene
     */
    addBillboard(billboard: Billboard): void;
    /**
     * Add a fire billboard to the scene
     */
    addFireBillboard(fireBillboard: FireBillboard): void;
    /**
     * Remove a point light from the scene
     */
    removePointLight(light: PointLight): void;
    /**
     * Get all point lights in the scene
     */
    getPointLights(): PointLight[];
    gl(): WebGL2RenderingContext;
    /**
     * Sets scene-level uniforms (lights, camera) that are shared across all nodes
     * This should be called once per frame before drawing nodes
     * @param program - Shader program to use for rendering
     */
    setSceneUniforms(program: WebGLProgram): void;
    /**
     * Draws all nodes in the scene using instanced rendering where possible
     * @param program - Shader program to use for rendering
     */
    draw(program: WebGLProgram): void;
    /**
     * Enable camera controls for this scene
     * @param canvas - Canvas element to attach event listeners to
     */
    enableCameraControls(canvas: HTMLCanvasElement): void;
    /**
     * Disable camera controls and clean up event listeners
     */
    disableCameraControls(): void;
    private setupInputListeners;
    private cleanupInputListeners;
    update(dt: number): void;
    /**
     * Set the day-night cycle time (0.0 to 1.0)
     * 0.0 = night, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1.0 = night
     */
    setCycleTime(time: number): void;
    /**
     * Render the scene using the given shader program
     * @param program - Shader program to use for rendering
     */
    render(): void;
}
//# sourceMappingURL=scene.d.ts.map