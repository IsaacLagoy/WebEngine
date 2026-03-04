"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback, KeyboardEvent, ChangeEvent } from "react";

const INITIAL_CODE = `# Matrix stack pushes to the right

push
  drawSquare()
  scale(0.5, 0.5)

  for i in range(4)
    push
      translate(6 * cos(pi / 4 * i), 6 * sin(pi / 4 * i))
      rotate(pi / 4 * i)
      scale(0.85, 0.85)
      drawSquare()
    pop
  end
pop
`;

// ─── Types ────────────────────────────────────────────────────────────────────
type Mat3 = [
  number, number, number,
  number, number, number,
  number, number, number,
];

interface Shape {
  matrix: Mat3;
  color: string;
}

interface InterpretResult {
  shapes: Shape[];
}

type VarMap = Record<string, number>;

// ─── Matrix helpers (column-major 2D affine) ─────────────────────────────────
function identityMatrix(): Mat3 {
  return [1, 0, 0, 0, 1, 0, 0, 0, 1];
}

function multiplyMatrix(A: Mat3, B: Mat3): Mat3 {
  return [
    A[0]*B[0] + A[3]*B[1] + A[6]*B[2],  A[1]*B[0] + A[4]*B[1] + A[7]*B[2],  A[2]*B[0] + A[5]*B[1] + A[8]*B[2],
    A[0]*B[3] + A[3]*B[4] + A[6]*B[5],  A[1]*B[3] + A[4]*B[4] + A[7]*B[5],  A[2]*B[3] + A[5]*B[4] + A[8]*B[5],
    A[0]*B[6] + A[3]*B[7] + A[6]*B[8],  A[1]*B[6] + A[4]*B[7] + A[7]*B[8],  A[2]*B[6] + A[5]*B[7] + A[8]*B[8],
  ];
}

function translationMatrix(tx: number, ty: number): Mat3 {
  return [1, 0, 0, 0, 1, 0, tx, ty, 1];
}

function scaleMatrix(sx: number, sy: number): Mat3 {
  return [sx, 0, 0, 0, sy, 0, 0, 0, 1];
}

function rotationMatrix(r: number): Mat3 {
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [c, s, 0, -s, c, 0, 0, 0, 1];
}

function applyMatrix(m: Mat3, x: number, y: number): [number, number] {
  return [
    m[0]*x + m[3]*y + m[6],
    m[1]*x + m[4]*y + m[7],
  ];
}

// ─── Tokenizer / Parser ───────────────────────────────────────────────────────
function tokenizeLine(line: string): string {
  return line.replace(/#.*$/, "").trim();
}

// ─── Expression Parser (recursive descent) ───────────────────────────────────
// Supports: numbers, variables, pi, sin(x), cos(x), +, -, *, /, unary minus, parens

function parseExpression(expr: string, vars: VarMap): number {
  const allVars: VarMap = { pi: Math.PI, ...vars };
  const src = expr.trim();
  let pos = 0;

  function peek(): string { return src[pos] ?? ""; }
  function consume(): string { return src[pos++] ?? ""; }
  function skipWS(): void { while (pos < src.length && src[pos] === " ") pos++; }

  function parseNum(): number {
    skipWS();
    // Unary minus
    if (peek() === "-") { consume(); return -parseNum(); }
    // Unary plus
    if (peek() === "+") { consume(); return parseNum(); }
    // Parenthesised sub-expression
    if (peek() === "(") {
      consume(); // "("
      const val = parseAddSub();
      skipWS();
      if (peek() !== ")") throw new Error(`Expected ')' in "${expr}"`);
      consume(); // ")"
      return val;
    }
    // Named token: variable, constant, or function call
    if (/[a-zA-Z_]/.test(peek())) {
      let name = "";
      while (/[a-zA-Z_0-9]/.test(peek())) name += consume();
      skipWS();
      if (peek() === "(") {
        // Function call
        consume(); // "("
        const arg = parseAddSub();
        skipWS();
        if (peek() !== ")") throw new Error(`Expected ')' after ${name}(...) in "${expr}"`);
        consume(); // ")"
        if (name === "sin") return Math.sin(arg);
        if (name === "cos") return Math.cos(arg);
        throw new Error(`Unknown function "${name}" in "${expr}"`);
      }
      // Variable / constant
      if (name in allVars) return allVars[name];
      throw new Error(`Unknown variable "${name}" in "${expr}"`);
    }
    // Numeric literal
    let numStr = "";
    while (/[\d.]/.test(peek())) numStr += consume();
    if (numStr === "") throw new Error(`Unexpected character '${peek()}' in "${expr}"`);
    return parseFloat(numStr);
  }

  function parseMulDiv(): number {
    let left = parseNum();
    while (true) {
      skipWS();
      const op = peek();
      if (op !== "*" && op !== "/") break;
      consume();
      const right = parseNum();
      left = op === "*" ? left * right : left / right;
    }
    return left;
  }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (true) {
      skipWS();
      const op = peek();
      if (op !== "+" && op !== "-") break;
      consume();
      const right = parseMulDiv();
      left = op === "+" ? left + right : left - right;
    }
    return left;
  }

  const result = parseAddSub();
  skipWS();
  if (pos !== src.length) throw new Error(`Unexpected token '${src.slice(pos)}' in "${expr}"`);
  if (!isFinite(result)) throw new Error(`Expression "${expr}" evaluated to non-finite: ${result}`);
  return result;
}

function parseArgs(argsStr: string, vars: VarMap): number[] {
  // Split on commas that are outside any parentheses
  const args: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i <= argsStr.length; i++) {
    const ch = argsStr[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if ((ch === "," || i === argsStr.length) && depth === 0) {
      args.push(argsStr.slice(start, i).trim());
      start = i + 1;
    }
  }
  return args.map((a) => parseExpression(a, vars));
}

// ─── Interpreter ─────────────────────────────────────────────────────────────
const MAX_ITERATIONS = 1000;
const MAX_SHAPES = 500;

const COLORS: readonly string[] = [
  "#60a5fa", "#34d399", "#f472b6", "#fbbf24", "#a78bfa",
  "#38bdf8", "#fb923c", "#4ade80", "#e879f9", "#facc15",
];

function interpret(code: string): InterpretResult {
  const lines = code.split("\n");
  const shapes: Shape[] = [];
  const mvStack: Mat3[] = [identityMatrix()];

  const currentMV = (): Mat3 => mvStack[mvStack.length - 1];
  const setMV = (m: Mat3): void => { mvStack[mvStack.length - 1] = m; };

  let iterCount = 0;
  let colorIndex = 0;

  function executeLines(lineList: string[], vars: VarMap, depth: number = 0): void {
    if (depth > 20) throw new Error("Too many nested loops (max 20)");
    let i = 0;
    while (i < lineList.length) {
      iterCount++;
      if (iterCount > MAX_ITERATIONS * 10) throw new Error("Execution limit exceeded");

      const raw = tokenizeLine(lineList[i]);
      if (!raw) { i++; continue; }

      // for i in range(n)
      const forMatch = raw.match(/^for\s+(\w+)\s+in\s+range\s*\((.+)\)\s*$/);
      if (forMatch) {
        const varName: string = forMatch[1];
        const rangeVal = Math.floor(parseExpression(forMatch[2], vars));
        if (!Number.isFinite(rangeVal) || rangeVal < 0) {
          throw new Error(`range() must be non-negative, got ${rangeVal}`);
        }
        if (rangeVal > MAX_ITERATIONS) {
          throw new Error(`range(${rangeVal}) exceeds max iterations (${MAX_ITERATIONS})`);
        }

        // Find matching "end"
        let depth2 = 1;
        let j = i + 1;
        while (j < lineList.length && depth2 > 0) {
          const t = tokenizeLine(lineList[j]);
          if (/^for\s+/.test(t)) depth2++;
          if (/^end\b/.test(t)) depth2--;
          j++;
        }
        if (depth2 !== 0) throw new Error("'for' without matching 'end'");

        const body = lineList.slice(i + 1, j - 1);
        for (let loopVar = 0; loopVar < rangeVal; loopVar++) {
          executeLines(body, { ...vars, [varName]: loopVar }, depth + 1);
        }
        i = j;
        continue;
      }

      if (/^end\b/.test(raw)) { i++; continue; }

      // push / pop
      if (raw === "push") {
        mvStack.push([...currentMV()] as Mat3);
        i++; continue;
      }
      if (raw === "pop") {
        if (mvStack.length <= 1) throw new Error("pop() called on empty stack");
        mvStack.pop();
        i++; continue;
      }

      // Commands with parentheses — extract args with balanced paren matching
      // so that sin(...), cos(...) inside args are handled correctly.
      const cmdName = raw.match(/^(\w+)\s*\(/);
      if (!cmdName) throw new Error(`Unrecognized statement: "${raw}"`);
      const cmd: string = cmdName[1];
      const openIdx = raw.indexOf("(");
      let parenDepth = 0;
      let closeIdx = -1;
      for (let ci = openIdx; ci < raw.length; ci++) {
        if (raw[ci] === "(") parenDepth++;
        else if (raw[ci] === ")") { parenDepth--; if (parenDepth === 0) { closeIdx = ci; break; } }
      }
      if (closeIdx === -1 || raw.slice(closeIdx + 1).trim() !== "") {
        throw new Error(`Unrecognized statement: "${raw}"`);
      }
      const argsRaw: string = raw.slice(openIdx + 1, closeIdx).trim();

      if (cmd === "translate") {
        const [tx, ty] = parseArgs(argsRaw, vars);
        setMV(multiplyMatrix(currentMV(), translationMatrix(tx, ty)));
      } else if (cmd === "scale") {
        const [sx, sy] = parseArgs(argsRaw, vars);
        setMV(multiplyMatrix(currentMV(), scaleMatrix(sx, sy)));
      } else if (cmd === "rotate") {
        const [r] = parseArgs(argsRaw, vars);
        setMV(multiplyMatrix(currentMV(), rotationMatrix(r)));
      } else if (cmd === "drawSquare") {
        if (shapes.length >= MAX_SHAPES) throw new Error(`Too many shapes (max ${MAX_SHAPES})`);
        shapes.push({ matrix: [...currentMV()] as Mat3, color: COLORS[colorIndex % COLORS.length] });
        colorIndex++;
      } else {
        throw new Error(`Unknown command: "${cmd}"`);
      }
      i++;
    }
  }

  executeLines(lines, {});
  return { shapes };
}

// ─── Canvas Renderer ─────────────────────────────────────────────────────────

function renderShapes(
  ctx: CanvasRenderingContext2D,
  shapes: Shape[],
  W: number,
  H: number,
  panX: number,
  panY: number,
): void {
  ctx.clearRect(0, 0, W, H);

  // Base transform (never accessible to user):
  //   1. Flip Y so +Y is up
  //   2. Translate origin to canvas centre + pan offset
  //   3. Scale so 1 world unit = WORLD_SCALE pixels
  ctx.save();
  ctx.transform(1, 0, 0, -1, 0, H);              // Y-flip
  ctx.translate(W / 2 + panX, H / 2 - panY);     // origin → centre + pan (panY flipped)
  ctx.scale(WORLD_SCALE, WORLD_SCALE);            // world units

  // ── Grid: fixed boundary of ±UNITS_VISIBLE*2 from the world origin ──
  const GRID_LIMIT = UNITS_VISIBLE * 2;

  const startX = -GRID_LIMIT;
  const endX   =  GRID_LIMIT;
  const startY = -GRID_LIMIT;
  const endY   =  GRID_LIMIT;

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1 / WORLD_SCALE;
  for (let u = startX; u <= endX; u++) {
    if (u === 0) continue;
    ctx.beginPath(); ctx.moveTo(u, startY); ctx.lineTo(u, endY); ctx.stroke();
  }
  for (let u = startY; u <= endY; u++) {
    if (u === 0) continue;
    ctx.beginPath(); ctx.moveTo(startX, u); ctx.lineTo(endX, u); ctx.stroke();
  }

  // ── Axes (span full grid) ──
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1.5 / WORLD_SCALE;
  ctx.beginPath(); ctx.moveTo(startX, 0); ctx.lineTo(endX, 0); ctx.stroke(); // X
  ctx.beginPath(); ctx.moveTo(0, startY); ctx.lineTo(0, endY); ctx.stroke(); // Y

  // ── Unit tick labels (un-flipped) ──
  ctx.save();
  ctx.scale(1 / WORLD_SCALE, -1 / WORLD_SCALE);
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let u = startX; u <= endX; u++) {
    if (u === 0) continue;
    ctx.fillText(String(u), u * WORLD_SCALE, 10);
  }
  ctx.textAlign = "right";
  for (let u = startY; u <= endY; u++) {
    if (u === 0) continue;
    ctx.fillText(String(u), -6, -u * WORLD_SCALE);
  }
  ctx.restore();

  // ── Shapes ──
  const SIZE = 1; // square is 1×1 world unit
  const corners: [number, number][] = [
    [-SIZE / 2, -SIZE / 2],
    [ SIZE / 2, -SIZE / 2],
    [ SIZE / 2,  SIZE / 2],
    [-SIZE / 2,  SIZE / 2],
  ];

  shapes.forEach(({ matrix: m, color }: Shape, idx: number) => {
    const pts = corners.map(([x, y]) => applyMatrix(m, x, y));
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();

    ctx.fillStyle = color + "33";
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5 / WORLD_SCALE;
    ctx.stroke();

    // Label: un-flip and un-scale so text is always readable
    const cx = pts.reduce((s, p) => s + p[0], 0) / 4;
    const cy = pts.reduce((s, p) => s + p[1], 0) / 4;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 / WORLD_SCALE, -1 / WORLD_SCALE);
    ctx.fillStyle = color;
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(idx + 1), 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

// ─── Syntax Highlighter ──────────────────────────────────────────────────────
function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tokenizeSyntax(text: string): string {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\b(for|in|range|end|push|pop)\b/g, `<span style="color:#c084fc">$1</span>`)
    .replace(/\b(translate|scale|rotate|drawSquare|sin|cos)\b/g, `<span style="color:#38bdf8">$1</span>`)
    .replace(/\bpi\b/g, `<span style="color:#fbbf24">pi</span>`)
    .replace(/\b(\d+\.?\d*)\b/g, `<span style="color:#fbbf24">$1</span>`)
    .replace(/\b([a-z_]\w*)\s*(?=\()/gi, (_m: string, n: string) => `<span style="color:#38bdf8">${n}</span>`);
}

function highlight(code: string): string {
  return code.split("\n").map((line: string, li: number) => {
    const comment = line.match(/#.*/);
    let html: string;
    if (comment && comment.index !== undefined) {
      const pre = line.slice(0, comment.index);
      const commentHtml = `<span style="color:#6b7280;font-style:italic">${escHtml(comment[0])}</span>`;
      html = tokenizeSyntax(pre) + commentHtml;
    } else {
      html = tokenizeSyntax(line);
    }
    return `<div class="code-line" key="${li}">${html || " "}</div>`;
  }).join("");
}

// Fixed internal resolution of the canvas
const CANVAS_RES = 512;

// How many canvas pixels equal one world unit.
// With CANVAS_RES=512 and ±5 units visible, one unit = 512/10 = ~51px.
const UNITS_VISIBLE = 5; // world units from center to each edge
const WORLD_SCALE = CANVAS_RES / (UNITS_VISIBLE * 2);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TransformVisualizer(): JSX.Element {
  const [code, setCode] = useState<string>(INITIAL_CODE);
  const [error, setError] = useState<string | null>(null);
  const [shapeCount, setShapeCount] = useState<number>(0);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState<number>(512);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ mx: number; my: number; px: number; py: number } | null>(null);

  // Keep canvas a square fitted to the available viewport space
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setCanvasDisplaySize(Math.floor(Math.max(width, height)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shapesRef = useRef<Shape[]>([]);

  const redraw = useCallback((pan: { x: number; y: number }): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    renderShapes(ctx, shapesRef.current, CANVAS_RES, CANVAS_RES, pan.x, pan.y);
  }, []);

  const run = useCallback((src: string, pan: { x: number; y: number }): void => {
    try {
      const { shapes } = interpret(src);
      shapesRef.current = shapes;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderShapes(ctx, shapes, CANVAS_RES, CANVAS_RES, pan.x, pan.y);
      setShapeCount(shapes.length);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => { run(code, panOffset); }, [code, run]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { redraw(panOffset); }, [panOffset, redraw]);

  // ── Drag to pan ──
  const handleMouseDown = (e: React.MouseEvent): void => {
    setIsDragging(true);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: panOffset.x, py: panOffset.y };
  };

  const handleMouseMove = (e: React.MouseEvent): void => {
    if (!dragStart.current) return;
    const scale = canvasDisplaySize / CANVAS_RES; // CSS px per canvas px
    const dx = (e.clientX - dragStart.current.mx) / scale;
    const dy = (e.clientY - dragStart.current.my) / scale;
    setPanOffset({
      x: dragStart.current.px + dx,
      y: dragStart.current.py + dy,
    });
  };

  const handleMouseUp = (): void => {
    setIsDragging(false);
    dragStart.current = null;
  };

  const [splitPct, setSplitPct] = useState<number>(46);
  const isSplitting = useRef<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSplitterMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    isSplitting.current = true;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent): void => {
      if (!isSplitting.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(80, Math.max(20, pct)));
    };
    const onUp = (): void => { isSplitting.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const syncScroll = (): void => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = code.substring(0, start) + "  " + code.substring(end);
      setCode(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  };

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>): void => {
    setCode(e.target.value);
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{
          display: "flex", height: "100vh", width: "100%",
          background: "#0d1117", color: "#e2e8f0",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
          overflow: "hidden",
          cursor: isSplitting.current ? "col-resize" : "default",
        }}>
      {/* ── Left: Editor ── */}
      <div style={{
        width: `${splitPct}%`, display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: "12px 18px", background: "#0d1117",
          borderBottom: "1px solid #1e2a3a",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Link
            href="/games"
            className="back-button"
            style={{
              fontSize: 12,
              letterSpacing: 1,
              padding: "4px 8px",
              margin: "-5px",
              border: "1px solid #1e2a3a",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ fontSize: 12 }}>←</span>
            <span>Back to games</span>
          </Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, fontSize: 11, color: "#4b6280" }}>
            <span style={{ color: error ? "#f87171" : "#34d399" }}>
              {error ? "● ERR" : `● OK  ${shapeCount} shape${shapeCount !== 1 ? "s" : ""}`}
            </span>
          </div>
        </div>

        {/* Quick reference */}
        <div style={{
          padding: "8px 18px", background: "#0a0f16",
          borderBottom: "1px solid #1e2a3a",
          fontSize: 10, color: "#3d5268", lineHeight: 1.8,
          display: "flex", gap: 16, flexWrap: "wrap",
        }}>
          {(["push", "pop", "translate(x,y)", "scale(x,y)", "rotate(rad)", "drawSquare()", "for i in range(n)", "end", "pi", "sin(x)", "cos(x)"] as const).map((k) => (
            <code
              key={k}
              style={{
                color: k.startsWith("for") || k === "end" || k === "push" || k === "pop"
                  ? "#a78bfa"
                  : k === "pi"
                    ? "#fbbf24"
                    : "#38bdf8",
              }}
            >{k}</code>
          ))}
        </div>

        {/* Editor */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {/* Line numbers */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 40,
            background: "#0a0f16", borderRight: "1px solid #1e2a3a",
            display: "flex", flexDirection: "column", alignItems: "flex-end",
            padding: "12px 8px 12px 0", gap: 0, overflowY: "hidden",
            zIndex: 2, pointerEvents: "none",
          }}>
            {code.split("\n").map((_: string, i: number) => (
              <div key={i} style={{
                fontSize: 12, lineHeight: "20px", color: "#2d4a60",
                minHeight: 20, userSelect: "none",
              }}>{i + 1}</div>
            ))}
          </div>

          {/* Syntax highlight layer */}
          <div
            ref={highlightRef}
            aria-hidden="true"
            style={{
              position: "absolute", left: 40, right: 0, top: 0, bottom: 0,
              padding: "12px 16px",
              fontSize: 12, lineHeight: "20px",
              whiteSpace: "pre", overflowX: "auto", overflowY: "auto",
              pointerEvents: "none", zIndex: 1,
              color: "#e2e8f0",
            }}
            dangerouslySetInnerHTML={{ __html: highlight(code) }}
          />

          {/* Editable textarea */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onScroll={syncScroll}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            style={{
              position: "absolute", left: 40, right: 0, top: 0, bottom: 0,
              padding: "12px 16px",
              fontSize: 12, lineHeight: "20px",
              background: "transparent", color: "transparent",
              caretColor: "#60a5fa",
              border: "none", outline: "none", resize: "none",
              whiteSpace: "pre", overflowX: "auto", overflowY: "auto",
              zIndex: 3, fontFamily: "inherit",
            }}
          />
        </div>
      </div>

      {/* ── Splitter handle ── */}
      <div
        onMouseDown={handleSplitterMouseDown}
        style={{
          width: 5, flexShrink: 0,
          background: "#1e2a3a",
          cursor: "col-resize",
          position: "relative",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "#2d4a60")}
        onMouseLeave={e => (e.currentTarget.style.background = "#1e2a3a")}
      >
        {/* Grip dots */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex", flexDirection: "column", gap: 3,
          pointerEvents: "none",
        }}>
          {[0,1,2].map(n => (
            <div key={n} style={{ width: 3, height: 3, borderRadius: "50%", background: "#4b6280" }} />
          ))}
        </div>
      </div>

      {/* ── Right: Canvas ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{
          padding: "12px 18px", background: "#0d1117",
          borderBottom: "1px solid #1e2a3a",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 12, color: "#4b6280", letterSpacing: 1 }}>VIEWPORT</span>
          <span style={{ marginLeft: "auto", fontSize: 11, color: "#4b6280" }}>
            {CANVAS_RES}×{CANVAS_RES}px · MV stack · 2D canvas
          </span>
        </div>

        {/* Viewport container — square canvas centred inside */}
        <div
          ref={viewportRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            flex: 1, position: "relative",
            background: "#060b10", overflow: "hidden",
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
          }}
        >
          <div style={{
            position: "absolute",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: canvasDisplaySize, height: canvasDisplaySize,
            flexShrink: 0,
          }}>
            <canvas
              ref={canvasRef}
              width={CANVAS_RES}
              height={CANVAS_RES}
              style={{
                width: canvasDisplaySize,
                height: canvasDisplaySize,
                display: error ? "none" : "block",
                imageRendering: "pixelated",
              }}
            />
            {error && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: 40, gap: 16,
              }}>
                <div style={{ fontSize: 28, color: "#f87171", marginBottom: 4 }}>⚠</div>
                <div style={{
                  fontSize: 13, color: "#f87171", fontWeight: "bold",
                  letterSpacing: 2, textTransform: "uppercase", marginBottom: 8,
                }}>Runtime Error</div>
                <div style={{
                  fontSize: 12, color: "#fca5a5",
                  background: "#1a0808", border: "1px solid #7f1d1d",
                  borderRadius: 6, padding: "12px 20px",
                  maxWidth: 360, textAlign: "center", lineHeight: 1.7,
                }}>{error}</div>
                <div style={{ fontSize: 11, color: "#4b6280", marginTop: 8 }}>
                  Fix the code on the left to resume rendering
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>
      <style>{`
        .back-button {
          font-size: 12px;
          letter-spacing: 1px;
          padding: 4px 8px;
          margin: -5px;
          border: 1px solid #1e2a3a;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #4b6280;
          background: transparent;
          color: #e2e8f0;
        }

        .back-button:hover {
          background: #020617;
        }
      `}</style>
    </>
  );
}