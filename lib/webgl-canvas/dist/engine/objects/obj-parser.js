"use strict";
/**
 * Async OBJ parser that yields control to prevent blocking the main thread
 *
 * Note: Since webgl-obj-loader is synchronous, we can't make parsing truly async
 * without rewriting the parser or using a Web Worker. This implementation yields
 * control before and after parsing to allow the browser to handle other tasks.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseObjAsync = parseObjAsync;
const OBJ = __importStar(require("webgl-obj-loader"));
/**
 * Yields control to the browser to prevent blocking the main thread
 */
function yieldToBrowser() {
    return new Promise((resolve) => {
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => resolve(), { timeout: 0 });
        }
        else {
            // Fallback for browsers without requestIdleCallback
            setTimeout(() => resolve(), 0);
        }
    });
}
/**
 * Parses OBJ file text asynchronously by yielding control before parsing
 *
 * Note: The webgl-obj-loader library is synchronous, so parsing itself still
 * happens on the main thread. However, we yield control before parsing to
 * allow the browser to handle other tasks (like UI updates) first.
 *
 * For truly non-blocking parsing, consider:
 * - Using a Web Worker with a custom OBJ parser
 * - Optimizing the OBJ file (reduce polygon count)
 * - Using a binary format like GLTF instead
 */
async function parseObjAsync(text) {
    // Yield control before parsing to allow browser to handle other tasks
    await yieldToBrowser();
    // Parse the OBJ file (synchronous operation)
    // This will still block, but we've given the browser a chance to update first
    const obj = new OBJ.Mesh(text);
    // Yield again after parsing to allow UI updates
    await yieldToBrowser();
    return {
        vertices: obj.vertices || [],
        vertexNormals: obj.vertexNormals || [],
        textures: obj.textures || [],
        indices: obj.indices || []
    };
}
//# sourceMappingURL=obj-parser.js.map