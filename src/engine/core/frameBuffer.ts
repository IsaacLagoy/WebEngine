import { Engine } from "../objects/engine";

export class FrameBuffer {
    engine: Engine;
    framebuffer: WebGLFramebuffer | null = null;
    colorTexture: WebGLTexture | null = null;
    depthBuffer: WebGLRenderbuffer | null = null;

    constructor(engine: Engine) {
        this.engine = engine;
        this.init();
    }

    gl(): WebGLRenderingContext {
        return this.engine.gl;
    }

    bind() {
        this.gl().bindFramebuffer(this.gl().FRAMEBUFFER, this.framebuffer);
    }

    unbind() {
        this.gl().bindFramebuffer(this.gl().FRAMEBUFFER, null);
    }

    resize() {
        this.destory();
        this.init();
    }

    destory() {
        const gl = this.gl();
        if (this.colorTexture) gl.deleteTexture(this.colorTexture);
        if (this.depthBuffer) gl.deleteRenderbuffer(this.depthBuffer);
        if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
        this.colorTexture = null;
        this.depthBuffer = null;
        this.framebuffer = null;
    }

    init() {
        const gl = this.gl();

        // create framebuffer
        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        // create color texture
        this.colorTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.colorTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.engine.width, this.engine.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colorTexture, 0);

        // create depth buffer
        this.depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.engine.width, this.engine.height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.depthBuffer);

        // unbind
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
}