"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scene = void 0;
const camera_1 = require("../core/camera");
const instanceGroup_1 = require("./instanceGroup");
const gl_matrix_1 = require("gl-matrix");
/**
 * Scene class - contains all objects in the 3D world
 * A scene is a collection of nodes (3D objects) that get rendered together
 * Uses instancing to batch nodes with the same mesh+material for efficient rendering
 */
class Scene {
    constructor(engine, shader) {
        this.nodes = []; // All 3D objects in the scene
        this.instanceGroups = new Map(); // Instance groups keyed by "meshId_materialId"
        this.pointLights = []; // Point lights in the scene
        this.billboards = []; // Billboards
        this.fireBillboards = []; // Animated fire billboards
        this.skybox = null; // Skybox for background
        this.shader = null;
        // Input handling
        this.keysPressed = new Set();
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.isPointerLocked = false;
        this.canvas = null;
        this.mouseSensitivity = 0.002; // Mouse sensitivity multiplier
        // Event handler references for cleanup
        this.handleKeyDown = null;
        this.handleKeyUp = null;
        this.handleMouseMove = null;
        this.handleMouseDown = null;
        this.handlePointerLockChange = null;
        this.handlePointerLockError = null;
        // Fog parameters
        this.fogColor = gl_matrix_1.vec3.fromValues(0.02, 0.02, 0.08); // Fog color (very dark blue - darkens objects)
        this.fogStart = 30.0; // Distance where fog starts (narrow range for testing)
        this.fogEnd = 200.0; // Distance where fog ends (fully fogged) - very narrow range
        this.fogDensity = 0.4;
        this.engine = engine;
        // Set this as the engine's main scene if none exists
        if (!engine.scene) {
            engine.scene = this;
        }
        this.camera = new camera_1.Camera(engine);
        if (shader) {
            this.shader = shader;
        }
    }
    /**
     * Get a unique key for a mesh+material combination
     */
    getInstanceGroupKey(mesh, material) {
        // Use object reference as ID (simple but effective)
        const meshId = mesh.__id || (mesh.__id = Math.random().toString(36));
        const materialId = material ? (material.__id || (material.__id = Math.random().toString(36))) : "null";
        return `${meshId}_${materialId}`;
    }
    /**
     * Add a node (3D object) to the scene
     * Automatically groups nodes by mesh+material for instanced rendering
     */
    add(node) {
        this.nodes.push(node);
        // Add to appropriate instance group
        const key = this.getInstanceGroupKey(node.mesh, node.material);
        let group = this.instanceGroups.get(key);
        if (!group) {
            group = new instanceGroup_1.InstanceGroup(this.engine, node.mesh, node.material);
            this.instanceGroups.set(key, group);
        }
        group.addNode(node);
    }
    /**
     * Remove a node from the scene
     */
    remove(node) {
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
    addPointLight(light) {
        this.pointLights.push(light);
    }
    /**
     * Add a billboard to the scene
     */
    addBillboard(billboard) {
        this.billboards.push(billboard);
    }
    /**
     * Add a fire billboard to the scene
     */
    addFireBillboard(fireBillboard) {
        this.fireBillboards.push(fireBillboard);
    }
    /**
     * Remove a point light from the scene
     */
    removePointLight(light) {
        const index = this.pointLights.indexOf(light);
        if (index !== -1) {
            this.pointLights.splice(index, 1);
        }
    }
    /**
     * Get all point lights in the scene
     */
    getPointLights() {
        return this.pointLights;
    }
    gl() {
        return this.engine.gl;
    }
    /**
     * Sets scene-level uniforms (lights, camera) that are shared across all nodes
     * This should be called once per frame before drawing nodes
     * @param program - Shader program to use for rendering
     */
    setSceneUniforms(program) {
        const gl = this.gl();
        // Ambient color (scene-level) - prevents pure black faces
        const ambientLoc = this.engine.getUniformLocation(program, "uAmbientColor");
        if (ambientLoc !== null) {
            gl.uniform3f(ambientLoc, 1.0, 1.0, 1.0); // White ambient
        }
        // Directional light (scene-level) - from active celestial body (sun or moon)
        // Light direction should point FROM surface TOWARD the light source
        const lightDirLoc = this.engine.getUniformLocation(program, "uLightDir");
        const lightColorLoc = this.engine.getUniformLocation(program, "uLightColor");
        if (this.skybox) {
            // Get light direction and color from skybox
            const lightDir = this.skybox.getLightDirection();
            const lightColor = this.skybox.getLightColor();
            if (lightDirLoc !== null && lightDir) {
                gl.uniform3fv(lightDirLoc, lightDir);
            }
            if (lightColorLoc !== null && lightColor) {
                gl.uniform3fv(lightColorLoc, lightColor);
            }
        }
        else {
            // Fallback: default moonlight if no skybox
            if (lightDirLoc !== null) {
                gl.uniform3fv(lightDirLoc, [-0.2, 1, -0.3]);
            }
            if (lightColorLoc !== null) {
                gl.uniform3f(lightColorLoc, 0.4, 0.5, 0.8);
            }
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
                    gl.uniform3f(colorLoc, light.color[0] * light.intensity, light.color[1] * light.intensity, light.color[2] * light.intensity);
                }
                // Attenuation (constant, linear, quadratic)
                const attLoc = this.engine.getUniformLocation(program, `uPointLightAttenuation[${i}]`);
                if (attLoc !== null) {
                    gl.uniform3f(attLoc, light.constant, light.linear, light.quadratic);
                }
            }
            else {
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
        // Fog uniforms
        const fogColorLoc = this.engine.getUniformLocation(program, "uFogColor");
        if (fogColorLoc !== null) {
            gl.uniform3fv(fogColorLoc, this.fogColor);
        }
        const fogStartLoc = this.engine.getUniformLocation(program, "uFogStart");
        if (fogStartLoc !== null) {
            gl.uniform1f(fogStartLoc, this.fogStart);
        }
        const fogEndLoc = this.engine.getUniformLocation(program, "uFogEnd");
        if (fogEndLoc !== null) {
            gl.uniform1f(fogEndLoc, this.fogEnd);
        }
        const fogDensityLoc = this.engine.getUniformLocation(program, "uFogDensity");
        if (fogDensityLoc !== null) {
            gl.uniform1f(fogDensityLoc, this.fogDensity);
        }
    }
    /**
     * Draws all nodes in the scene using instanced rendering where possible
     * @param program - Shader program to use for rendering
     */
    draw(program) {
        // Set scene-level uniforms once per frame (lights, etc.)
        this.setSceneUniforms(program);
        // Get view-projection matrix (combines camera view + perspective projection)
        const vpMatrix = this.camera.getViewProjectionMatrix();
        const camPos = this.camera.position;
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
    /**
     * Enable camera controls for this scene
     * @param canvas - Canvas element to attach event listeners to
     */
    enableCameraControls(canvas) {
        this.canvas = canvas;
        this.setupInputListeners();
    }
    /**
     * Disable camera controls and clean up event listeners
     */
    disableCameraControls() {
        this.cleanupInputListeners();
        this.canvas = null;
    }
    setupInputListeners() {
        if (!this.canvas)
            return;
        // Keyboard handlers
        // Only process keyboard events when this scene's canvas has focus or pointer lock
        this.handleKeyDown = (e) => {
            // Only process if this canvas has pointer lock or is focused
            if (!this.isPointerLocked && document.activeElement !== this.canvas) {
                return;
            }
            const key = e.key.toLowerCase();
            if (key === "w" || key === "a" || key === "s" || key === "d" ||
                key === "arrowup" || key === "arrowdown" ||
                key === "arrowleft" || key === "arrowright") {
                e.preventDefault();
                this.keysPressed.add(key);
            }
        };
        this.handleKeyUp = (e) => {
            // Only process if this canvas has pointer lock or is focused
            if (!this.isPointerLocked && document.activeElement !== this.canvas) {
                return;
            }
            const key = e.key.toLowerCase();
            if (key === "w" || key === "a" || key === "s" || key === "d" ||
                key === "arrowup" || key === "arrowdown" ||
                key === "arrowleft" || key === "arrowright") {
                this.keysPressed.delete(key);
            }
        };
        // Mouse movement handler (for pointer lock)
        this.handleMouseMove = (e) => {
            if (this.isPointerLocked) {
                // Mouse movement is in movementX/Y when pointer is locked
                // Apply sensitivity multiplier
                this.mouseDeltaX = (e.movementX || 0) * this.mouseSensitivity;
                this.mouseDeltaY = (e.movementY || 0) * this.mouseSensitivity;
            }
        };
        // Mouse click handler to request pointer lock
        this.handleMouseDown = (e) => {
            if (!this.isPointerLocked && this.canvas) {
                this.canvas.requestPointerLock();
            }
        };
        // Pointer lock change handler
        // Only process if this scene's canvas is the one that got/lost pointer lock
        this.handlePointerLockChange = () => {
            const wasLocked = this.isPointerLocked;
            this.isPointerLocked = document.pointerLockElement === this.canvas;
            // Only process if the lock state changed for THIS canvas
            if (wasLocked !== this.isPointerLocked) {
                if (!this.isPointerLocked) {
                    // Reset mouse delta when pointer lock is released
                    this.mouseDeltaX = 0;
                    this.mouseDeltaY = 0;
                }
            }
        };
        // Pointer lock error handler
        this.handlePointerLockError = () => {
            console.warn("Pointer lock failed");
            this.isPointerLocked = false;
        };
        // Add event listeners
        window.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("keyup", this.handleKeyUp);
        this.canvas.addEventListener("mousemove", this.handleMouseMove);
        this.canvas.addEventListener("mousedown", this.handleMouseDown);
        document.addEventListener("pointerlockchange", this.handlePointerLockChange);
        document.addEventListener("pointerlockerror", this.handlePointerLockError);
    }
    cleanupInputListeners() {
        if (this.handleKeyDown) {
            window.removeEventListener("keydown", this.handleKeyDown);
            this.handleKeyDown = null;
        }
        if (this.handleKeyUp) {
            window.removeEventListener("keyup", this.handleKeyUp);
            this.handleKeyUp = null;
        }
        if (this.canvas && this.handleMouseMove) {
            this.canvas.removeEventListener("mousemove", this.handleMouseMove);
            this.handleMouseMove = null;
        }
        if (this.canvas && this.handleMouseDown) {
            this.canvas.removeEventListener("mousedown", this.handleMouseDown);
            this.handleMouseDown = null;
        }
        if (this.handlePointerLockChange) {
            document.removeEventListener("pointerlockchange", this.handlePointerLockChange);
            this.handlePointerLockChange = null;
        }
        if (this.handlePointerLockError) {
            document.removeEventListener("pointerlockerror", this.handlePointerLockError);
            this.handlePointerLockError = null;
        }
        // Exit pointer lock if active
        if (document.pointerLockElement === this.canvas) {
            document.exitPointerLock();
        }
        this.keysPressed.clear();
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.isPointerLocked = false;
    }
    update(dt) {
        for (const node of this.nodes) {
            // Skip update for static nodes (like leaves)
            if (!node.skipUpdate) {
                node.update(dt);
            }
        }
        // Update fire billboard animations
        for (const fireBillboard of this.fireBillboards) {
            fireBillboard.update(dt);
        }
        // Update camera with input state
        if (this.canvas) {
            const inputState = {
                keys: this.keysPressed,
                mouseDeltaX: this.mouseDeltaX,
                mouseDeltaY: this.mouseDeltaY
            };
            this.camera.update(dt, inputState);
            // Reset mouse delta after processing (it's accumulated per frame)
            this.mouseDeltaX = 0;
            this.mouseDeltaY = 0;
        }
        else {
            // No input handling, update camera without input (empty state)
            this.camera.update(dt, { keys: new Set(), mouseDeltaX: 0, mouseDeltaY: 0 });
        }
        if (this.shader) {
            this.camera.use(this.shader);
        }
    }
    /**
     * Set the day-night cycle time (0.0 to 1.0)
     * 0.0 = night, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1.0 = night
     */
    setCycleTime(time) {
        if (this.skybox) {
            this.skybox.setCycleTime(time);
        }
    }
    /**
     * Render the scene using the given shader program
     * @param program - Shader program to use for rendering
     */
    render() {
        const gl = this.gl();
        // Ensure depth testing is enabled for 3D rendering
        gl.enable(gl.DEPTH_TEST);
        // Render skybox first (before main scene)
        if (this.skybox) {
            this.skybox.render();
        }
        // Render main scene
        if (!this.shader)
            return;
        this.shader.use();
        this.draw(this.shader.program);
    }
}
exports.Scene = Scene;
//# sourceMappingURL=scene.js.map