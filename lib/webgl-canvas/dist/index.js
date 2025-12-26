"use strict";
/**
 * Main entry point for webgl-canvas package
 *
 * @example
 * ```tsx
 * import { WebGLCanvas } from '@isaaclagoy/webgl-canvas';
 * import { createMyScene } from './scenes'; // User-defined scene
 *
 * function App() {
 *   return <WebGLCanvas sceneFactory={createMyScene} />;
 * }
 * ```
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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quad = exports.FrameBuffer = exports.Tree = exports.Terrain = exports.Skybox = exports.PointLight = exports.Node = exports.Material = exports.Mesh = exports.Shader = exports.Camera = exports.Scene = exports.Engine = exports.WebGLCanvas = void 0;
// Export main component
var WebGLCanvas_1 = require("./WebGLCanvas");
Object.defineProperty(exports, "WebGLCanvas", { enumerable: true, get: function () { return __importDefault(WebGLCanvas_1).default; } });
// Export engine classes and types that users need to create scenes
var engine_1 = require("./engine/objects/engine");
Object.defineProperty(exports, "Engine", { enumerable: true, get: function () { return engine_1.Engine; } });
var scene_1 = require("./engine/objects/scene");
Object.defineProperty(exports, "Scene", { enumerable: true, get: function () { return scene_1.Scene; } });
var camera_1 = require("./engine/core/camera");
Object.defineProperty(exports, "Camera", { enumerable: true, get: function () { return camera_1.Camera; } });
var shader_1 = require("./engine/core/shader");
Object.defineProperty(exports, "Shader", { enumerable: true, get: function () { return shader_1.Shader; } });
var mesh_1 = require("./engine/objects/mesh");
Object.defineProperty(exports, "Mesh", { enumerable: true, get: function () { return mesh_1.Mesh; } });
var material_1 = require("./engine/objects/material");
Object.defineProperty(exports, "Material", { enumerable: true, get: function () { return material_1.Material; } });
var node_1 = require("./engine/objects/node");
Object.defineProperty(exports, "Node", { enumerable: true, get: function () { return node_1.Node; } });
var pointLight_1 = require("./engine/objects/pointLight");
Object.defineProperty(exports, "PointLight", { enumerable: true, get: function () { return pointLight_1.PointLight; } });
var skybox_1 = require("./engine/objects/skybox");
Object.defineProperty(exports, "Skybox", { enumerable: true, get: function () { return skybox_1.Skybox; } });
var terrain_1 = require("./engine/objects/terrain");
Object.defineProperty(exports, "Terrain", { enumerable: true, get: function () { return terrain_1.Terrain; } });
var tree_1 = require("./engine/objects/tree");
Object.defineProperty(exports, "Tree", { enumerable: true, get: function () { return tree_1.Tree; } });
var frameBuffer_1 = require("./engine/core/frameBuffer");
Object.defineProperty(exports, "FrameBuffer", { enumerable: true, get: function () { return frameBuffer_1.FrameBuffer; } });
var quad_1 = require("./engine/core/quad");
Object.defineProperty(exports, "Quad", { enumerable: true, get: function () { return quad_1.Quad; } });
// Export math utilities
__exportStar(require("./math/random"), exports);
__exportStar(require("./math/tangents"), exports);
__exportStar(require("./math/glConstants"), exports);
//# sourceMappingURL=index.js.map