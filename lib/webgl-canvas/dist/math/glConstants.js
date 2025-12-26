"use strict";
/**
 * WebGL/OpenGL constants that aren't in TypeScript definitions
 * These constants exist at runtime in WebGL2 but aren't typed
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.GL_BOOL_VEC4 = exports.GL_BOOL_VEC3 = exports.GL_BOOL_VEC2 = exports.GL_INT_VEC4 = exports.GL_INT_VEC3 = exports.GL_INT_VEC2 = exports.GL_FLOAT_VEC4 = exports.GL_FLOAT_VEC3 = exports.GL_FLOAT_VEC2 = exports.GL_BOOL = exports.GL_FLOAT = exports.GL_UNSIGNED_INT = exports.GL_INT = void 0;
exports.getGLTypeComponentCount = getGLTypeComponentCount;
exports.getGLTypeSize = getGLTypeSize;
// Basic types (some are in WebGL2RenderingContext, some aren't)
exports.GL_INT = 0x1404;
exports.GL_UNSIGNED_INT = 0x1405; // Also available as gl.UNSIGNED_INT
exports.GL_FLOAT = 0x1406; // Also available as gl.FLOAT
exports.GL_BOOL = 0x8B56;
// Vector types (not in TypeScript definitions)
exports.GL_FLOAT_VEC2 = 0x8B50;
exports.GL_FLOAT_VEC3 = 0x8B51;
exports.GL_FLOAT_VEC4 = 0x8B52;
exports.GL_INT_VEC2 = 0x8B53;
exports.GL_INT_VEC3 = 0x8B54;
exports.GL_INT_VEC4 = 0x8B55;
exports.GL_BOOL_VEC2 = 0x8B57;
exports.GL_BOOL_VEC3 = 0x8B58;
exports.GL_BOOL_VEC4 = 0x8B59;
/**
 * Get the component count of a WebGL type
 */
function getGLTypeComponentCount(gl, type) {
    // Check both our constants and WebGL constants
    const glFloat = gl.FLOAT;
    const glUnsignedInt = gl.UNSIGNED_INT;
    switch (type) {
        case exports.GL_BOOL:
        case exports.GL_INT:
        case exports.GL_UNSIGNED_INT:
        case exports.GL_FLOAT:
        case glFloat:
        case glUnsignedInt:
            return 1;
        case exports.GL_BOOL_VEC2:
        case exports.GL_INT_VEC2:
        case exports.GL_FLOAT_VEC2:
            return 2;
        case exports.GL_BOOL_VEC3:
        case exports.GL_INT_VEC3:
        case exports.GL_FLOAT_VEC3:
            return 3;
        case exports.GL_BOOL_VEC4:
        case exports.GL_INT_VEC4:
        case exports.GL_FLOAT_VEC4:
            return 4;
    }
    return 0;
}
/**
 * Get the size in bytes of a WebGL type
 */
function getGLTypeSize(gl, type) {
    // Check both our constants and WebGL constants
    const glFloat = gl.FLOAT;
    const glUnsignedInt = gl.UNSIGNED_INT;
    switch (type) {
        case exports.GL_BOOL:
        case exports.GL_INT:
        case exports.GL_UNSIGNED_INT:
        case exports.GL_FLOAT:
        case glFloat:
        case glUnsignedInt:
            return 4;
        case exports.GL_BOOL_VEC2:
        case exports.GL_INT_VEC2:
        case exports.GL_FLOAT_VEC2:
            return 8;
        case exports.GL_BOOL_VEC3:
        case exports.GL_INT_VEC3:
        case exports.GL_FLOAT_VEC3:
            return 12;
        case exports.GL_BOOL_VEC4:
        case exports.GL_INT_VEC4:
        case exports.GL_FLOAT_VEC4:
            return 16;
    }
    return 0;
}
//# sourceMappingURL=glConstants.js.map