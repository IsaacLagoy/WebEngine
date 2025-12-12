import { Node } from "./node";
import { Camera } from "../core/camera";
import { Engine } from "./engine";
import { Shader } from "../core/shader";
import { PointLight } from "./pointLight";
import { InstanceGroup } from "./instanceGroup";
import { Mesh } from "./mesh";
import { Material } from "./material";
import { Billboard } from "./billboard";
import { FireBillboard } from "./fireBillboard";
import { vec3 } from "gl-matrix";
/**
 * Scene class - contains all objects in the 3D world
 * A scene is a collection of nodes (3D objects) that get rendered together
 * Uses instancing to batch nodes with the same mesh+material for efficient rendering
 */
export class Scene {
    engine: Engine;
    nodes: Node[] = [];  // All 3D objects in the scene
    instanceGroups: Map<string, InstanceGroup> = new Map();  // Instance groups keyed by "meshId_materialId"
    pointLights: PointLight[] = [];  // Point lights in the scene
    billboards: Billboard[] = [];  // Billboards
    fireBillboards: FireBillboard[] = [];  // Animated fire billboards
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
     * Get a unique key for a mesh+material combination
     */
    private getInstanceGroupKey(mesh: Mesh, material: Material | null): string {
        // Use object reference as ID (simple but effective)
        const meshId = (mesh as any).__id || ((mesh as any).__id = Math.random().toString(36));
        const materialId = material ? ((material as any).__id || ((material as any).__id = Math.random().toString(36))) : "null";
        return `${meshId}_${materialId}`;
    }

    /**
     * Add a node (3D object) to the scene
     * Automatically groups nodes by mesh+material for instanced rendering
     */
    add(node: Node) {
        this.nodes.push(node);
        
        // Add to appropriate instance group
        const key = this.getInstanceGroupKey(node.mesh, node.material);
        let group = this.instanceGroups.get(key);
        if (!group) {
            group = new InstanceGroup(this.engine, node.mesh, node.material);
            this.instanceGroups.set(key, group);
        }
        group.addNode(node);
    }

    /**
     * Remove a node from the scene
     */
    remove(node: Node) {
        const index = this.nodes.indexOf(node);
        if (index !== -1) {
            this.nodes.splice(index, 1);
            
            // Remove from instance group
            const key = this.getInstanceGroupKey(node.mesh, node.material);
            const group = this.instanceGroups.get(key);
            if (group) {
                group.removeNode(node);
                // Remove empty groups
                if (group.nodes.length === 0) {
                    this.instanceGroups.delete(key);
                }
            }
        }
    }

    /**
     * Add a point light to the scene
     */
    addPointLight(light: PointLight) {
        this.pointLights.push(light);
    }

    /**
     * Add a billboard to the scene
     */
    addBillboard(billboard: Billboard) {
        this.billboards.push(billboard);
    }

    /**
     * Add a fire billboard to the scene
     */
    addFireBillboard(fireBillboard: FireBillboard) {
        this.fireBillboards.push(fireBillboard);
    }

    /**
     * Remove a point light from the scene
     */
    removePointLight(light: PointLight) {
        const index = this.pointLights.indexOf(light);
        if (index !== -1) {
            this.pointLights.splice(index, 1);
        }
    }

    /**
     * Get all point lights in the scene
     */
    getPointLights(): PointLight[] {
        return this.pointLights;
    }

    gl(): WebGL2RenderingContext {
        return this.engine.gl;
    }

    /**
     * Sets scene-level uniforms (lights, camera) that are shared across all nodes
     * This should be called once per frame before drawing nodes
     * @param program - Shader program to use for rendering
     */
    setSceneUniforms(program: WebGLProgram) {
        const gl = this.gl();
        
        // Ambient color (scene-level) - prevents pure black faces
        const ambientLoc = this.engine.getUniformLocation(program, "uAmbientColor");
        if (ambientLoc !== null) {
            gl.uniform3f(ambientLoc, 1.0, 1.0, 1.0); // White ambient
        }
        
        // Directional light (scene-level) - blue moonlight
        // Light direction should point FROM surface TOWARD the light source
        // Since moonlight comes from above, the direction vector should point up (positive Y)
        const lightDirLoc = this.engine.getUniformLocation(program, "uLightDir");
        if (lightDirLoc !== null) {
            // Direction pointing up and slightly backward (toward moonlight source above)
            gl.uniform3fv(lightDirLoc, [-0.2, 1, -0.3]);
        }
        
        // Set directional light color to blue-moonlight
        const lightColorLoc = this.engine.getUniformLocation(program, "uLightColor");
        if (lightColorLoc !== null) {
            // Blue-moonlight color (cool blue-white)
            gl.uniform3f(lightColorLoc, 0.4, 0.5, 0.8);
        }
        
        // Point lights (scene-level)
        const pointLights = this.getPointLights();
        const numLights = Math.min(pointLights.length, 16); // MAX_POINT_LIGHTS is 16
        
        // Set number of point lights
        const numLightsLoc = this.engine.getUniformLocation(program, "uNumPointLights");
        if (numLightsLoc !== null) {
            gl.uniform1i(numLightsLoc, numLights);
        }
        
        // Set point light uniforms (WebGL requires setting each array element individually)
        for (let i = 0; i < 16; i++) { // Always set all 16 to ensure arrays are properly initialized
            if (i < numLights) {
                const light = pointLights[i];
                
                // Position
                const posLoc = this.engine.getUniformLocation(program, `uPointLightPositions[${i}]`);
                if (posLoc !== null) {
                    gl.uniform3fv(posLoc, light.position);
                }
                
                // Color (multiplied by intensity)
                const colorLoc = this.engine.getUniformLocation(program, `uPointLightColors[${i}]`);
                if (colorLoc !== null) {
                    gl.uniform3f(
                        colorLoc,
                        light.color[0] * light.intensity,
                        light.color[1] * light.intensity,
                        light.color[2] * light.intensity
                    );
                }
                
                // Attenuation (constant, linear, quadratic)
                const attLoc = this.engine.getUniformLocation(program, `uPointLightAttenuation[${i}]`);
                if (attLoc !== null) {
                    gl.uniform3f(attLoc, light.constant, light.linear, light.quadratic);
                }
            } else {
                // Set unused lights to zero/neutral values
                const posLoc = this.engine.getUniformLocation(program, `uPointLightPositions[${i}]`);
                if (posLoc !== null) {
                    gl.uniform3f(posLoc, 0, 0, 0);
                }
                
                const colorLoc = this.engine.getUniformLocation(program, `uPointLightColors[${i}]`);
                if (colorLoc !== null) {
                    gl.uniform3f(colorLoc, 0, 0, 0);
                }
                
                const attLoc = this.engine.getUniformLocation(program, `uPointLightAttenuation[${i}]`);
                if (attLoc !== null) {
                    gl.uniform3f(attLoc, 1, 0, 0);
                }
            }
        }
    }

    /**
     * Draws all nodes in the scene using instanced rendering where possible
     * @param program - Shader program to use for rendering
     */
    draw(program: WebGLProgram) {
        // Set scene-level uniforms once per frame (lights, etc.)
        this.setSceneUniforms(program);
        
        // Get view-projection matrix (combines camera view + perspective projection)
        const vpMatrix = this.camera.getViewProjectionMatrix();
        const camPos = this.camera.position as [number, number, number];
        const gl = this.gl();

        // Draw all instance groups (instancing is required for all nodes)
        for (const group of this.instanceGroups.values()) {
            group.drawInstanced(gl, program, vpMatrix, camPos);
        }

        // Draw billboards (solid color quads)
        for (const billboard of this.billboards) {
            billboard.render(vpMatrix, camPos);
        }

        // Draw fire billboards (animated sprites)
        for (const fireBillboard of this.fireBillboards) {
            fireBillboard.render(vpMatrix, camPos);
        }
    }

    update(dt: number) {
        for (const node of this.nodes) {
            node.update(dt);
        }

        // Update fire billboard animations
        for (const fireBillboard of this.fireBillboards) {
            fireBillboard.update(dt);
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

