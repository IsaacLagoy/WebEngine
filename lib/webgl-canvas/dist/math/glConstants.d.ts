/**
 * WebGL/OpenGL constants that aren't in TypeScript definitions
 * These constants exist at runtime in WebGL2 but aren't typed
 */
export declare const GL_INT = 5124;
export declare const GL_UNSIGNED_INT = 5125;
export declare const GL_FLOAT = 5126;
export declare const GL_BOOL = 35670;
export declare const GL_FLOAT_VEC2 = 35664;
export declare const GL_FLOAT_VEC3 = 35665;
export declare const GL_FLOAT_VEC4 = 35666;
export declare const GL_INT_VEC2 = 35667;
export declare const GL_INT_VEC3 = 35668;
export declare const GL_INT_VEC4 = 35669;
export declare const GL_BOOL_VEC2 = 35671;
export declare const GL_BOOL_VEC3 = 35672;
export declare const GL_BOOL_VEC4 = 35673;
/**
 * Get the component count of a WebGL type
 */
export declare function getGLTypeComponentCount(gl: WebGL2RenderingContext, type: number): number;
/**
 * Get the size in bytes of a WebGL type
 */
export declare function getGLTypeSize(gl: WebGL2RenderingContext, type: number): number;
//# sourceMappingURL=glConstants.d.ts.map