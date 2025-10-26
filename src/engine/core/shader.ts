
// get shader from public folder
export async function loadShaderSource(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load shader: ${url}`);
    return await res.text();
}

export class Shader {
    gl: WebGLRenderingContext;
    shader: WebGLShader;

    constructor(gl: WebGLRenderingContext, shader: WebGLShader) {
        this.gl = gl;
        this.shader = shader;
    }

    static async create(gl: WebGLRenderingContext, url: string, type: number): Promise<Shader> {
        const src = await loadShaderSource(url);
        const shader = gl.createShader(type);
        if (!shader) throw new Error("Failed to create shader");
        
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const info = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Shader compilation error: ${info}`);
        }
        
        return new Shader(gl, shader);
    }
}
