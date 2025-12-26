/**
 * Attribute information structure
 */
export interface AttributeInfo {
    name: string;
    location: number;
    componentCount: number;
    dataType: number;
    offset: number;
}
/**
 * Shader class - represents a complete shader program with attribute management
 */
export declare class Shader {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    attributes: AttributeInfo[];
    stride: number;
    private slotBindings;
    private uniformCache;
    constructor(gl: WebGL2RenderingContext, vertex: WebGLShader, fragment: WebGLShader);
    /**
     * Creates and compiles a shader from files
     */
    static create(gl: WebGL2RenderingContext, vertexUrl: string, fragmentUrl: string): Promise<Shader>;
    /**
     * Get all active attributes in the shader and save them
     */
    private loadAttributes;
    /**
     * Uses the shader program for rendering
     */
    use(): void;
    /**
     * Get the location of a uniform
     */
    getUniformLocation(name: string): WebGLUniformLocation | null;
    /**
     * Set a float uniform value
     */
    setUniform(name: string, value: number): void;
    /**
     * Set an int uniform value
     */
    setUniformInt(name: string, value: number): void;
    /**
     * Set a matrix uniform value
     */
    setUniformMatrix(name: string, value: Float32List): void;
    /**
     * General method for binding a texture to a slot
     */
    private bindTextureToSlot;
    /**
     * Binds a 2D texture to the shader
     */
    bindTexture(name: string, texture: WebGLTexture | null, slot?: number): void;
    /**
     * Destroy the shader program
     */
    destroy(): void;
}
//# sourceMappingURL=shader.d.ts.map