"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = WebGLCanvas;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function WebGLCanvas({ sceneFactory, resolutionScale = 1.0 }) {
    const containerRef = (0, react_1.useRef)(null);
    const canvasRef = (0, react_1.useRef)(null);
    const fpsRef = (0, react_1.useRef)(null);
    const [isLoading, setIsLoading] = (0, react_1.useState)(true);
    const renderFunctionRef = (0, react_1.useRef)(null);
    const renderLoopRef = (0, react_1.useRef)(null);
    const isPausedRef = (0, react_1.useRef)(false);
    // Handle canvas resize to match container with throttling
    // The Engine's resizeCanvas() method will handle the actual resizing
    // We just need to trigger it when the container resizes
    (0, react_1.useEffect)(() => {
        const container = containerRef.current;
        if (!container)
            return;
        let resizeTimeout;
        const handleResize = () => {
            // Throttle resize events - wait 100ms after resize stops
            clearTimeout(resizeTimeout);
            resizeTimeout = window.setTimeout(() => {
                // Call resize method on render function if available
                // This allows the Engine to handle resizing properly
                if (renderFunctionRef.current?.resize) {
                    renderFunctionRef.current.resize();
                }
            }, 100);
        };
        // Use ResizeObserver to watch container size changes
        // Note: ResizeObserver may fire on transforms, but our throttling and caching will prevent unnecessary work
        const resizeObserver = new ResizeObserver(handleResize);
        resizeObserver.observe(container);
        // Also listen to window resize as fallback
        window.addEventListener("resize", handleResize);
        return () => {
            clearTimeout(resizeTimeout);
            resizeObserver.disconnect();
            window.removeEventListener("resize", handleResize);
        };
    }, []);
    (0, react_1.useEffect)(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const gl = canvas.getContext("webgl2");
        if (!gl) {
            console.error("WebGL 2.0 not supported.");
            return;
        }
        const init = async () => {
            // Store resolution scale on the canvas so Engine.create can read it
            canvas.__resolutionScale = resolutionScale;
            // Create scene and get render function from factory
            const render = await sceneFactory(gl);
            renderFunctionRef.current = render;
            // Enable camera controls if the render function supports it
            if (render.enableControls && canvas) {
                render.enableControls(canvas);
            }
            // Start render loop
            let lastTime = performance.now();
            let frameCount = 0;
            let fpsLastTime = performance.now();
            const fpsUpdateInterval = 500;
            const animate = (time) => {
                if (!renderFunctionRef.current)
                    return;
                // Pause rendering when canvas is not visible
                if (isPausedRef.current) {
                    renderLoopRef.current = requestAnimationFrame(animate);
                    return;
                }
                const dt = Math.min((time - lastTime) / 1000, 0.1);
                lastTime = time;
                // Call render function from factory
                renderFunctionRef.current(dt);
                // Update FPS display
                frameCount++;
                const fpsElapsed = time - fpsLastTime;
                if (fpsElapsed >= fpsUpdateInterval && fpsRef.current) {
                    const fps = Math.round((frameCount * 1000) / fpsElapsed);
                    fpsRef.current.textContent = `FPS: ${fps}`;
                    frameCount = 0;
                    fpsLastTime = time;
                }
                renderLoopRef.current = requestAnimationFrame(animate);
            };
            renderLoopRef.current = requestAnimationFrame(animate);
            setIsLoading(false);
        };
        init().catch((error) => {
            console.error(error);
            setIsLoading(false);
        });
        // Cleanup on unmount
        return () => {
            if (renderFunctionRef.current?.cleanup) {
                renderFunctionRef.current.cleanup();
            }
            if (renderLoopRef.current !== null) {
                cancelAnimationFrame(renderLoopRef.current);
                renderLoopRef.current = null;
            }
        };
    }, [sceneFactory]);
    // Use Intersection Observer to pause rendering when canvas is off-screen
    (0, react_1.useEffect)(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // Pause rendering when less than 1% visible
                isPausedRef.current = !entry.isIntersecting || entry.intersectionRatio < 0.01;
            });
        }, { threshold: 0.01 } // Start/stop when 1% visible
        );
        observer.observe(canvas);
        return () => {
            observer.disconnect();
        };
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { ref: containerRef, style: { position: "relative", width: "100%", height: "100%" }, children: [(0, jsx_runtime_1.jsx)("canvas", { ref: canvasRef, tabIndex: 0, style: {
                    display: "block",
                    width: "100%",
                    height: "100%",
                    willChange: "transform", // Hint to browser for optimization
                } }), (0, jsx_runtime_1.jsx)("div", { ref: fpsRef, style: {
                    position: "absolute",
                    top: "10px",
                    left: "10px",
                    color: "white",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    padding: "8px 12px",
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    fontSize: "14px",
                    fontWeight: "bold",
                    zIndex: 10,
                    pointerEvents: "none",
                }, children: "FPS: --" }), (0, jsx_runtime_1.jsx)("div", { className: `absolute inset-0 bg-black transition-opacity duration-1000 ${isLoading ? "opacity-100" : "opacity-0 pointer-events-none"}`, style: { zIndex: 1 } })] }));
}
//# sourceMappingURL=WebGLCanvas.js.map