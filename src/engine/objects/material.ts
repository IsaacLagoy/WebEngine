import { Engine } from "./engine";


export function loadTexture(gl: WebGLRenderingContext, url: string): WebGLTexture {
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
    };

    return texture;
}

export class Material {
    engine: Engine;

    diffuseMap?: WebGLTexture;
    normalMap?: WebGLTexture;
    specularMap?: WebGLTexture;

    diffuseColor: [number, number, number] = [1, 0.5, 0.5];
    shininess: number = 32.0;

    private static _defaultWhiteTexture: WebGLTexture | null = null;

    constructor(engine: Engine) {
        this.engine = engine;
    }

    gl(): WebGLRenderingContext {
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

        // diffuse
        const diffuseLoc = this.engine.getUniformLocation(program, "uDiffuseMap");
        const hasDiffuseLoc = this.engine.getUniformLocation(program, "uHasDiffuseMap");
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.diffuseMap || Material.defaultWhiteTexture(gl));
        gl.uniform1i(diffuseLoc, 0);
        gl.uniform1i(hasDiffuseLoc, this.diffuseMap ? 1 : 0);

        // normal
        const normalLoc = this.engine.getUniformLocation(program, "uNormalMap");
        const hasNormalLoc = this.engine.getUniformLocation(program, "uHasNormalMap");
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.normalMap || Material.defaultWhiteTexture(gl));
        gl.uniform1i(normalLoc, 1);
        gl.uniform1i(hasNormalLoc, this.normalMap ? 1 : 0);

        // specular
        const specLoc = this.engine.getUniformLocation(program, "uSpecularMap");
        const hasSpecLoc = this.engine.getUniformLocation(program, "uHasSpecularMap");
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.specularMap || Material.defaultWhiteTexture(gl));
        gl.uniform1i(specLoc, 2);
        gl.uniform1i(hasSpecLoc, this.specularMap ? 1 : 0);

        // diffuse color & shininess
        const colorLoc = this.engine.getUniformLocation(program, "uDiffuseColor");
        gl.uniform3fv(colorLoc, this.diffuseColor);
        const shininessLoc = this.engine.getUniformLocation(program, "uShininess");
        gl.uniform1f(shininessLoc, this.shininess);
    }

    // 1x1 texture fallback
    static defaultWhiteTexture(gl: WebGLRenderingContext): WebGLTexture {
        if (!Material._defaultWhiteTexture) {
            const tex = gl.createTexture()!;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(
                gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0,
                gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255])
            );
            Material._defaultWhiteTexture = tex;
        }
        return Material._defaultWhiteTexture;
    }
}
