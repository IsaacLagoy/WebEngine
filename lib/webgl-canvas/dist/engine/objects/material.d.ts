import { Engine } from "./engine";
/**
 * Loads a texture from an image file
 * Textures are images applied to 3D surfaces (like wrapping paper on a box)
 *
 * @param gl - WebGL 2.0 context
 * @param url - Path to the image file
 * @param options - Optional texture configuration
 * @param options.wrapMode - Texture wrap mode: 'repeat' (default) for tiling, 'clamp' for non-tiling textures like sprites
 * @param options.generateMipmaps - Whether to generate mipmaps (default: true). Set to false for transparent textures to prevent white edge artifacts
 * @returns The created texture
 */
export declare function loadTexture(gl: WebGL2RenderingContext, url: string, options?: {
    wrapMode?: 'repeat' | 'clamp';
    generateMipmaps?: boolean;
}): WebGLTexture;
/**
 * Material class - defines how a surface looks
 *
 * Materials control:
 * - Diffuse: base color/texture of the surface
 * - Normal: bump mapping (makes flat surfaces look 3D)
 * - Specular: shininess/roughness (how reflective the surface is)
 */
export declare class Material {
    engine: Engine;
    diffuseMap?: WebGLTexture;
    normalMap?: WebGLTexture;
    specularMap?: WebGLTexture;
    color: [number, number, number];
    emission: [number, number, number];
    roughness: number;
    roughnessMultiplier: number;
    metallic: number;
    metallicMultiplier: number;
    textureTiling: number;
    private static _defaultWhiteTextures;
    constructor(engine: Engine);
    gl(): WebGL2RenderingContext;
    setDiffuse(url: string, options?: {
        wrapMode?: 'repeat' | 'clamp';
        generateMipmaps?: boolean;
    }): void;
    setNormal(url: string, options?: {
        wrapMode?: 'repeat' | 'clamp';
        generateMipmaps?: boolean;
    }): void;
    setSpecular(url: string): void;
    bindUniforms(program: WebGLProgram): void;
    /**
     * Creates a 1x1 white texture as a fallback
     * Used when a material doesn't have a texture map
     * Also used for nodes without materials
     *
     * IMPORTANT: Each WebGL context gets its own texture since textures are context-specific
     */
    static defaultWhiteTexture(gl: WebGL2RenderingContext): WebGLTexture;
}
//# sourceMappingURL=material.d.ts.map