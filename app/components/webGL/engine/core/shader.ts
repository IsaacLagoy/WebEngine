/**
 * Loads shader source code from a file
 * Shaders are programs that run on the GPU - vertex shaders process vertices,
 * fragment shaders process pixels
 */
export async function loadShaderSource(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load shader: ${url}`);
    return await res.text();
}

/**
 * Shader class - represents a single shader (vertex or fragment)
 * A shader is source code that gets compiled and runs on the GPU
 */
export class Shader {
    gl: WebGL2RenderingContext;
    shader: WebGLShader;

    constructor(gl: WebGL2RenderingContext, shader: WebGLShader) {
        this.gl = gl;
        this.shader = shader;
    }

    /**
     * Creates and compiles a shader from a file
     * @param gl - WebGL 2.0 context
     * @param url - Path to shader file (.vert or .frag)
     * @param type - Either VERTEX_SHADER or FRAGMENT_SHADER
     */
    static async create(gl: WebGL2RenderingContext, url: string, type: number): Promise<Shader> {
        // Load the shader source code from file
        const src = await loadShaderSource(url);
        
        // Create a shader object in GPU memory
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Failed to create shader");
        
        // Upload source code to GPU
        gl.shaderSource(shader, src);
        
        // Compile the shader (GPU compiles it to machine code)
        gl.compileShader(shader);
        
        // Check for compilation errors
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${info}`);
        }
        
        return new Shader(gl, shader);
    }
}
