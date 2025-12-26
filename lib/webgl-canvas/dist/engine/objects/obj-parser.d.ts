/**
 * Async OBJ parser that yields control to prevent blocking the main thread
 *
 * Note: Since webgl-obj-loader is synchronous, we can't make parsing truly async
 * without rewriting the parser or using a Web Worker. This implementation yields
 * control before and after parsing to allow the browser to handle other tasks.
 */
export interface ParseResult {
    vertices: number[];
    vertexNormals: number[];
    textures: number[];
    indices: number[];
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
export declare function parseObjAsync(text: string): Promise<ParseResult>;
//# sourceMappingURL=obj-parser.d.ts.map