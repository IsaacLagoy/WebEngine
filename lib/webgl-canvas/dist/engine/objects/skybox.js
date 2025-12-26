"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Skybox = void 0;
const gl_matrix_1 = require("gl-matrix");
/**
 * Skybox class - renders a sky with Preetham atmospheric scattering
 */
class Skybox {
    constructor(engine, scene, mesh, shader) {
        this.modelMatrix = gl_matrix_1.mat4.create();
        this.size = 500.0;
        // Atmospheric parameters
        this.sunElevation = 0.3;
        this.sunAzimuth = 0.0;
        this.turbidity = 2.5;
        this.sunIntensity = 1.0;
        this.sunDirection = gl_matrix_1.vec3.create();
        this.cycleTime = 0.0; // Time parameter for day-night cycle (0.0 to 1.0)
        this.engine = engine;
        this.scene = scene;
        this.mesh = mesh;
        this.shader = shader;
        gl_matrix_1.mat4.fromScaling(this.modelMatrix, gl_matrix_1.vec3.fromValues(this.size, this.size, this.size));
        this.updateSunDirection();
    }
    updateSunDirection() {
        // Elevation: -0.5 = below horizon (night), 0.0 = horizon, 0.5 = zenith
        // Map to radians: -PI/4 (below) to PI/2 (zenith)
        const elevationRad = this.sunElevation * Math.PI;
        const azimuthRad = this.sunAzimuth * Math.PI * 2.0;
        const cosElev = Math.cos(elevationRad);
        const sinElev = Math.sin(elevationRad);
        // Y is up, X is east, Z is north
        this.sunDirection[0] = Math.sin(azimuthRad) * cosElev;
        this.sunDirection[1] = sinElev;
        this.sunDirection[2] = Math.cos(azimuthRad) * cosElev;
        gl_matrix_1.vec3.normalize(this.sunDirection, this.sunDirection);
    }
    setSunElevation(elevation) {
        this.sunElevation = Math.max(-0.5, Math.min(0.5, elevation));
        this.updateSunDirection();
    }
    setSunAzimuth(azimuth) {
        this.sunAzimuth = azimuth;
        this.updateSunDirection();
    }
    setTurbidity(turbidity) {
        this.turbidity = Math.max(1.0, Math.min(20.0, turbidity));
    }
    /**
     * Get the direction of the active celestial body (sun or moon) for lighting
     * Returns direction pointing FROM surface TOWARD the light source
     */
    getLightDirection() {
        // If sun is above horizon, use sun direction
        // If sun is below horizon, use moon direction (opposite of sun)
        if (this.sunDirection[1] > -0.1) {
            // Sun is active (above or near horizon)
            return this.sunDirection;
        }
        else {
            // Moon is active (sun is below horizon)
            // Moon is opposite to sun, but always above horizon
            const moonDir = gl_matrix_1.vec3.create();
            gl_matrix_1.vec3.negate(moonDir, this.sunDirection);
            moonDir[1] = Math.abs(moonDir[1]); // Ensure moon is above horizon
            gl_matrix_1.vec3.normalize(moonDir, moonDir);
            return moonDir;
        }
    }
    /**
     * Get the color of the active celestial body for lighting
     */
    getLightColor() {
        // If sun is above horizon, use warm sunlight
        // If sun is below horizon, use cool moonlight
        if (this.sunDirection[1] > -0.1) {
            // Sun is active - warm sunlight color
            const sunFactor = Math.max(0.0, this.sunDirection[1]); // 0 to 1
            return gl_matrix_1.vec3.fromValues(0.8 + sunFactor * 0.2, // Red: 0.8 to 1.0
            0.7 + sunFactor * 0.3, // Green: 0.7 to 1.0
            0.6 + sunFactor * 0.4 // Blue: 0.6 to 1.0
            );
        }
        else {
            // Moon is active - cool moonlight color
            return gl_matrix_1.vec3.fromValues(0.4, 0.5, 0.8); // Blue-moonlight
        }
    }
    /**
     * Set the time parameter for day-night cycle (0.0 to 1.0)
     * 0.0 = night, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset, 1.0 = night
     */
    setCycleTime(time) {
        this.cycleTime = time % 1.0; // Wrap to 0.0-1.0
        if (this.cycleTime < 0.0) {
            this.cycleTime += 1.0;
        }
        // Update sun position based on cycle time
        // Sun elevation: full cycle from -0.5 (below horizon/night) to 0.5 (zenith/noon)
        const sunElevationCycle = Math.sin((this.cycleTime - 0.25) * Math.PI * 2.0) * 0.5;
        this.setSunElevation(sunElevationCycle);
        // Sun azimuth: rotates around horizon
        // Sun rises in east (0.75), moves to south (0.5), sets in west (0.25)
        const sunAzimuthCycle = 0.75 - this.cycleTime;
        this.setSunAzimuth(sunAzimuthCycle);
        // Sun intensity: bright during day, very dim at night
        if (sunElevationCycle > -0.1) {
            // Daytime: bright sun (elevation -0.1 to 0.5)
            const dayFactor = (sunElevationCycle + 0.1) / 0.6; // 0.0 to 1.0
            this.sunIntensity = 0.3 + dayFactor * 2.5; // 0.3 to 2.8
        }
        else {
            // Nighttime: very dim (moonlight/starlight)
            const nightFactor = (sunElevationCycle + 0.5) / 0.4; // 0.0 to 1.0
            this.sunIntensity = 0.05 + nightFactor * 0.25; // 0.05 to 0.3
        }
        // Turbidity: more hazy at sunrise/sunset
        const horizonProximity = Math.abs(sunElevationCycle); // Distance from horizon
        const horizonFactor = 1.0 - Math.min(horizonProximity * 2.0, 1.0);
        this.turbidity = 2.0 + horizonFactor * 1.5;
    }
    render() {
        const gl = this.engine.gl;
        const vpMatrix = this.scene.camera.getViewProjectionMatrix();
        gl.viewport(0, 0, this.engine.width, this.engine.height);
        const cullFaceWasEnabled = gl.isEnabled(gl.CULL_FACE);
        const currentCullFace = gl.getParameter(gl.CULL_FACE_MODE);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);
        const depthTestWasEnabled = gl.isEnabled(gl.DEPTH_TEST);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        this.shader.use();
        const program = this.shader.program;
        // Set uniforms
        const viewProjLoc = gl.getUniformLocation(program, "uViewProj");
        if (viewProjLoc !== null) {
            gl.uniformMatrix4fv(viewProjLoc, false, vpMatrix);
        }
        const modelLoc = gl.getUniformLocation(program, "uModel");
        if (modelLoc !== null) {
            gl.uniformMatrix4fv(modelLoc, false, this.modelMatrix);
        }
        const sunDirLoc = gl.getUniformLocation(program, "uSunDirection");
        if (sunDirLoc !== null) {
            gl.uniform3fv(sunDirLoc, this.sunDirection);
        }
        const turbidityLoc = gl.getUniformLocation(program, "uTurbidity");
        if (turbidityLoc !== null) {
            gl.uniform1f(turbidityLoc, this.turbidity);
        }
        const sunIntensityLoc = gl.getUniformLocation(program, "uSunIntensity");
        if (sunIntensityLoc !== null) {
            gl.uniform1f(sunIntensityLoc, this.sunIntensity);
        }
        const timeLoc = gl.getUniformLocation(program, "uTime");
        if (timeLoc !== null) {
            gl.uniform1f(timeLoc, 0.0);
        }
        const positionLoc = gl.getAttribLocation(program, "aPosition");
        const texCoordLoc = gl.getAttribLocation(program, "aTexCoord");
        if (positionLoc >= 0 && this.mesh.vertexBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
            gl.enableVertexAttribArray(positionLoc);
            gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        }
        if (texCoordLoc >= 0 && this.mesh.texcoordBuffer) {
            gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.texcoordBuffer);
            gl.enableVertexAttribArray(texCoordLoc);
            gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
        }
        if (this.mesh.indexBuffer) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
            gl.drawElements(gl.TRIANGLES, this.mesh.numIndices, gl.UNSIGNED_SHORT, 0);
        }
        gl.depthMask(true);
        if (depthTestWasEnabled) {
            gl.enable(gl.DEPTH_TEST);
        }
        if (cullFaceWasEnabled) {
            gl.cullFace(currentCullFace);
        }
        else {
            gl.disable(gl.CULL_FACE);
        }
    }
}
exports.Skybox = Skybox;
//# sourceMappingURL=skybox.js.map