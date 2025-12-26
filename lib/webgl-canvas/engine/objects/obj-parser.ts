/**
 * Async OBJ parser that yields control to prevent blocking the main thread
 * 
 * Note: Since webgl-obj-loader is synchronous, we can't make parsing truly async
 * without rewriting the parser or using a Web Worker. This implementation yields
 * control before and after parsing to allow the browser to handle other tasks.
 */

import * as OBJ from "webgl-obj-loader";

export interface ParseResult {
    vertices: number[];
    vertexNormals: number[];
    textures: number[];
    indices: number[];
}

/**
 * Yields control to the browser to prevent blocking the main thread
 */
function yieldToBrowser(): Promise<void> {
    return new Promise<void>((resolve) => {
        if (typeof requestIdleCallback !== 'undefined') {
            requestIdleCallback(() => resolve(), { timeout: 0 });
        } else {
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
export async function parseObjAsync(text: string): Promise<ParseResult> {
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

