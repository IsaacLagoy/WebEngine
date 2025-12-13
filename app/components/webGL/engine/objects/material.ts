import { Engine } from "./engine";

/**
 * Loads a texture from an image file
 * Textures are images applied to 3D surfaces (like wrapping paper on a box)
 * 
 * @param gl - WebGL 2.0 context
 * @param url - Path to the image file
 * @returns The created texture
 */
export function loadTexture(gl: WebGL2RenderingContext, url: string): WebGLTexture {
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // temporary 1x1 pixel placeholder while image loads
    const pixel = new Uint8Array([255, 255, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

    const image = new Image();
    image.src = url;
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        gl.generateMipmap(gl.TEXTURE_2D); // optional
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        // Set wrap mode to REPEAT for tiling
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    };

    return texture;
}

/**
 * Material class - defines how a surface looks
 * 
 * Materials control:
 * - Diffuse: base color/texture of the surface
 * - Normal: bump mapping (makes flat surfaces look 3D)
 * - Specular: shininess/roughness (how reflective the surface is)
 */
export class Material {
    engine: Engine;

    // Texture maps (optional - can use solid colors instead)
    diffuseMap?: WebGLTexture;   // Base color texture
    normalMap?: WebGLTexture;    // Normal map for bump mapping
    specularMap?: WebGLTexture;  // Specular/roughness map

    // Material properties
    // Material color in 0-255 range (will be normalized to 0-1 in shader)
    color: [number, number, number] = [255, 255, 255];  // RGB color (0-255), tints albedo
    emission: [number, number, number] = [0, 0, 0];  // Emission color (0-255), makes surface glow
    roughness: number = 0.5;  // Roughness (0.0 = smooth, 1.0 = rough, used if no roughness map)
    roughnessMultiplier: number = 1.0;  // Multiplier for roughness (1.0 = normal, >1.0 = rougher, <1.0 = shinier)
    metallic: number = 0.0;  // Metallic (0.0 = dielectric, 1.0 = metal, uniform across surface)
    metallicMultiplier: number = 1.0;  // Multiplier for metallic (1.0 = normal, >1.0 = more metallic, <1.0 = less metallic)
    textureTiling: number = 1.0;  // Texture tiling factor (1.0 = no tiling, >1.0 = repeat texture multiple times)

    // Shared white texture (fallback when no texture is provided)
    private static _defaultWhiteTexture: WebGLTexture | null = null;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    gl(): WebGL2RenderingContext {
        return this.engine.gl;
    }

    setDiffuse(url: string) {
        this.diffuseMap = loadTexture(this.gl(), url);
    }

    setNormal(url: string) {
        this.normalMap = loadTexture(this.gl(), url);
    }

    setSpecular(url: string) {
        this.specularMap = loadTexture(this.gl(), url);
    }

    bindUniforms(program: WebGLProgram) {
        const gl = this.gl();

        // Always bind textures (white fallback if missing)
        // Shader will detect white textures and use defaults
        
        // Diffuse/albedo texture
        const diffuseLoc = this.engine.getUniformLocation(program, "uDiffuseMap");
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.diffuseMap || Material.defaultWhiteTexture(gl));
        if (diffuseLoc !== null) gl.uniform1i(diffuseLoc, 0);

        // Normal map (white = flat, use vertex normal)
        const normalLoc = this.engine.getUniformLocation(program, "uNormalMap");
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalMap || Material.defaultWhiteTexture(gl));
        if (normalLoc !== null) gl.uniform1i(normalLoc, 1);

        // Roughness map (white = use uniform value)
        const specLoc = this.engine.getUniformLocation(program, "uRoughnessMap");
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.specularMap || Material.defaultWhiteTexture(gl));
        if (specLoc !== null) gl.uniform1i(specLoc, 2);

        // Material color (normalize from 0-255 to 0-1)
        const colorLoc = this.engine.getUniformLocation(program, "uMaterialColor");
        if (colorLoc !== null) {
            gl.uniform3f(colorLoc, this.color[0] / 255.0, this.color[1] / 255.0, this.color[2] / 255.0);
        }
        
        // Emission color (normalize from 0-255 to 0-1)
        const emissionLoc = this.engine.getUniformLocation(program, "uEmission");
        if (emissionLoc !== null) {
            gl.uniform3f(emissionLoc, this.emission[0] / 255.0, this.emission[1] / 255.0, this.emission[2] / 255.0);
        }
        
        // Roughness, roughness multiplier, metallic & metallic multiplier
        const roughnessLoc = this.engine.getUniformLocation(program, "uRoughness");
        if (roughnessLoc !== null) gl.uniform1f(roughnessLoc, this.roughness);
        const roughnessMultiplierLoc = this.engine.getUniformLocation(program, "uRoughnessMultiplier");
        if (roughnessMultiplierLoc !== null) gl.uniform1f(roughnessMultiplierLoc, this.roughnessMultiplier);
        const metallicLoc = this.engine.getUniformLocation(program, "uMetallic");
        if (metallicLoc !== null) gl.uniform1f(metallicLoc, this.metallic);
        const metallicMultiplierLoc = this.engine.getUniformLocation(program, "uMetallicMultiplier");
        if (metallicMultiplierLoc !== null) gl.uniform1f(metallicMultiplierLoc, this.metallicMultiplier);
        
        // Texture tiling
        const textureTilingLoc = this.engine.getUniformLocation(program, "uTextureTiling");
        if (textureTilingLoc !== null) gl.uniform1f(textureTilingLoc, this.textureTiling);
    }

    /**
     * Creates a 1x1 white texture as a fallback
     * Used when a material doesn't have a texture map
     * Also used for nodes without materials
     */
    static defaultWhiteTexture(gl: WebGL2RenderingContext): WebGLTexture {
        if (!Material._defaultWhiteTexture) {
            const tex = gl.createTexture()!;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255])
            );
            // Set texture parameters for proper sampling
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            Material._defaultWhiteTexture = tex;
        }
        return Material._defaultWhiteTexture;
    }
}