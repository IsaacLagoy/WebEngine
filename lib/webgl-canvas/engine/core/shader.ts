import { getGLTypeComponentCount, getGLTypeSize } from "../../math/glConstants";

/**
 * Loads shader source code from a file
 */
async function loadShaderSource(url: string): Promise<string> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load shader: ${url}`);
    return await res.text();
}

function compileShader(gl: WebGL2RenderingContext, source: string, type: number): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Failed to create shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Shader compilation error: ${info}`);
    }
    
    return shader;
}

function loadProgram(gl: WebGL2RenderingContext, vertex: WebGLShader, fragment: WebGLShader): WebGLProgram {
    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create program");
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    
    // Check for linking errors
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        gl.deleteProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        throw new Error(`Program link error: ${info}`);
    }

    // Delete shaders after linking
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return program;
}

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
 * Slot binding information
 */
interface SlotBinding {
    id: WebGLTexture | null;
    target: number;
}

/**
 * Shader class - represents a complete shader program with attribute management
 */
export class Shader {
    gl: WebGL2RenderingContext;
    program: WebGLProgram;
    attributes: AttributeInfo[] = [];
    stride: number = 0;
    private slotBindings = new Map<number, SlotBinding>();
    private uniformCache = new Map<string, WebGLUniformLocation | null>();

    constructor(gl: WebGL2RenderingContext, vertex: WebGLShader, fragment: WebGLShader) {
        this.gl = gl;
        this.program = loadProgram(gl, vertex, fragment);
        // Get all active attributes for VAO use
        this.loadAttributes();
    }

    /**
     * Creates and compiles a shader from files
     */
    static async create(gl: WebGL2RenderingContext, vertexUrl: string, fragmentUrl: string): Promise<Shader> {
        const vertexSrc = await loadShaderSource(vertexUrl);
        const fragmentSrc = await loadShaderSource(fragmentUrl);
        
        const vertexShader = compileShader(gl, vertexSrc, gl.VERTEX_SHADER);
        const fragmentShader = compileShader(gl, fragmentSrc, gl.FRAGMENT_SHADER);
        
        return new Shader(gl, vertexShader, fragmentShader);
    }

    /**
     * Get all active attributes in the shader and save them
     */
    private loadAttributes() {
        const nAttributes = this.gl.getProgramParameter(this.program, this.gl.ACTIVE_ATTRIBUTES);
        const tempAttributes: AttributeInfo[] = [];

        // First pass: collect all attributes
        for (let i = 0; i < nAttributes; i++) {
            const info = this.gl.getActiveAttrib(this.program, i);
            if (!info) continue;
            
            const location = this.gl.getAttribLocation(this.program, info.name);
            const componentCount = getGLTypeComponentCount(this.gl, info.type);
            tempAttributes.push({
                name: info.name,
                location: location,
                componentCount: componentCount,
                dataType: info.type,
                offset: 0
            });
        }

        // Sort by location and create array indexed by location
        tempAttributes.sort((a, b) => a.location - b.location);
        const maxLocation = tempAttributes.length > 0 
            ? Math.max(...tempAttributes.map(a => a.location))
            : -1;
        
        this.attributes = new Array(maxLocation + 1);

        // Calculate stride and offsets
        this.stride = 0;
        for (const attr of tempAttributes) {
            attr.offset = this.stride;
            this.stride += getGLTypeSize(this.gl, attr.dataType);
            this.attributes[attr.location] = attr;
        }
    }

    /**
     * Uses the shader program for rendering
     */
    use() {
        this.gl.useProgram(this.program);
    }

    /**
     * Get the location of a uniform
     */
    getUniformLocation(name: string): WebGLUniformLocation | null {
        if (!this.uniformCache.has(name)) {
            this.uniformCache.set(name, this.gl.getUniformLocation(this.program, name));
        }
        return this.uniformCache.get(name)!;
    }

    /**
     * Set a float uniform value
     */
    setUniform(name: string, value: number) {
        this.use();
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniform1f(loc, value);
        }
    }

    /**
     * Set an int uniform value
     */
    setUniformInt(name: string, value: number) {
        this.use();
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniform1i(loc, value);
        }
    }

    /**
     * Set a matrix uniform value
     */
    setUniformMatrix(name: string, value: Float32List) {
        this.use();
        const loc = this.getUniformLocation(name);
        if (loc !== null) {
            this.gl.uniformMatrix4fv(loc, false, value);
        }
    }

    /**
     * General method for binding a texture to a slot
     */
    private bindTextureToSlot(name: string, texID: WebGLTexture | null, target: number, slot: number) {
        this.use();

        this.gl.activeTexture(this.gl.TEXTURE0 + slot);
        this.gl.bindTexture(target, texID);

        this.slotBindings.set(slot, { id: texID, target: target });
        this.setUniformInt(name, slot);
    }

    /**
     * Binds a 2D texture to the shader
     */
    bindTexture(name: string, texture: WebGLTexture | null, slot: number = 0) {
        this.bindTextureToSlot(name, texture, this.gl.TEXTURE_2D, slot);
    }

    /**
     * Destroy the shader program
     */
    destroy() {
        this.slotBindings.clear();
        this.uniformCache.clear();
        this.gl.deleteProgram(this.program);
    }
}
