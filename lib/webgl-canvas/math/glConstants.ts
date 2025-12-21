/**
 * WebGL/OpenGL constants that aren't in TypeScript definitions
 * These constants exist at runtime in WebGL2 but aren't typed
 */

// Basic types (some are in WebGL2RenderingContext, some aren't)
export const GL_INT = 0x1404;
export const GL_UNSIGNED_INT = 0x1405; // Also available as gl.UNSIGNED_INT
export const GL_FLOAT = 0x1406; // Also available as gl.FLOAT
export const GL_BOOL = 0x8B56;

// Vector types (not in TypeScript definitions)
export const GL_FLOAT_VEC2 = 0x8B50;
export const GL_FLOAT_VEC3 = 0x8B51;
export const GL_FLOAT_VEC4 = 0x8B52;
export const GL_INT_VEC2 = 0x8B53;
export const GL_INT_VEC3 = 0x8B54;
export const GL_INT_VEC4 = 0x8B55;
export const GL_BOOL_VEC2 = 0x8B57;
export const GL_BOOL_VEC3 = 0x8B58;
export const GL_BOOL_VEC4 = 0x8B59;

/**
 * Get the component count of a WebGL type
 */
export function getGLTypeComponentCount(gl: WebGL2RenderingContext, type: number): number {
    // Check both our constants and WebGL constants
    const glFloat = gl.FLOAT;
    const glUnsignedInt = gl.UNSIGNED_INT;
    
    switch (type) {
        case GL_BOOL:
        case GL_INT:
        case GL_UNSIGNED_INT:
        case GL_FLOAT:
        case glFloat:
        case glUnsignedInt:
            return 1;

        case GL_BOOL_VEC2:
        case GL_INT_VEC2:
        case GL_FLOAT_VEC2:
            return 2;

        case GL_BOOL_VEC3:
        case GL_INT_VEC3:
        case GL_FLOAT_VEC3:
            return 3;

        case GL_BOOL_VEC4:
        case GL_INT_VEC4:
        case GL_FLOAT_VEC4:
            return 4;
    }
    return 0;
}

/**
 * Get the size in bytes of a WebGL type
 */
export function getGLTypeSize(gl: WebGL2RenderingContext, type: number): number {
    // Check both our constants and WebGL constants
    const glFloat = gl.FLOAT;
    const glUnsignedInt = gl.UNSIGNED_INT;
    
    switch (type) {
        case GL_BOOL:
        case GL_INT:
        case GL_UNSIGNED_INT:
        case GL_FLOAT:
        case glFloat:
        case glUnsignedInt:
            return 4;

        case GL_BOOL_VEC2:
        case GL_INT_VEC2:
        case GL_FLOAT_VEC2:
            return 8;

        case GL_BOOL_VEC3:
        case GL_INT_VEC3:
        case GL_FLOAT_VEC3:
            return 12;

        case GL_BOOL_VEC4:
        case GL_INT_VEC4:
        case GL_FLOAT_VEC4:
            return 16;
    }
    return 0;
}
