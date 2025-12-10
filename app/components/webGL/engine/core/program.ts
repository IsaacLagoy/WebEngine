import { Shader } from "./shader";

/**
 * Program class - represents a complete shader program
 * A program links a vertex shader and fragment shader together
 * This is what actually gets used to render things
 */
export class Program {
    gl: WebGL2RenderingContext
    program: WebGLProgram

    constructor(gl: WebGL2RenderingContext, program: WebGLProgram) {
        this.gl = gl;
        this.program = program;
    }

    /**
     * Creates a shader program by loading and linking vertex + fragment shaders
     * @param gl - WebGL 2.0 context
     * @param vertexUrl - Path to vertex shader (.vert file)
     * @param fragmentUrl - Path to fragment shader (.frag file)
     */
    static async create(gl: WebGL2RenderingContext, vertexUrl: string, fragmentUrl: string): Promise<Program> {
        // Load and compile both shaders
        // Vertex shader: runs once per vertex, transforms 3D positions
        const vertexShader = await Shader.create(gl, vertexUrl, gl.VERTEX_SHADER);
        // Fragment shader: runs once per pixel, determines final color
        const fragmentShader = await Shader.create(gl, fragmentUrl, gl.FRAGMENT_SHADER);

        // Create a program object to link shaders together
        const program = gl.createProgram();
        if (!program) throw new Error("Failed to create program");

        // Attach both shaders to the program
        gl.attachShader(program, vertexShader.shader);
        gl.attachShader(program, fragmentShader.shader);
        
        // Link the program (connects vertex outputs to fragment inputs)
        gl.linkProgram(program);

        // Check for linking errors
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error(`Program link error: ${info}`);
        }

        return new Program(gl, program);
    }

    /**
     * Activates this shader program for rendering
     * Only one program can be active at a time
     */
    use() {
        this.gl.useProgram(this.program);
    }
}