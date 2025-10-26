import { Shader } from "./shader";

export class Program {
    gl: WebGLRenderingContext
    program: WebGLProgram

    constructor(gl: WebGLRenderingContext, program: WebGLProgram) {
        this.gl = gl;
        this.program = program;
    }

    static async create(gl: WebGLRenderingContext, vertexUrl: string, fragmentUrl: string): Promise<Program> {
        // Load both shaders with correct types
        const vertexShader = await Shader.create(gl, vertexUrl, gl.VERTEX_SHADER);
        const fragmentShader = await Shader.create(gl, fragmentUrl, gl.FRAGMENT_SHADER);

        const program = gl.createProgram();
        if (!program) throw new Error("Failed to create program");

        gl.attachShader(program, vertexShader.shader);
        gl.attachShader(program, fragmentShader.shader);
        gl.linkProgram(program);

        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error(`Program link error: ${info}`);
        }

        return new Program(gl, program);
    }

    use() {
        this.gl.useProgram(this.program);
    }
}