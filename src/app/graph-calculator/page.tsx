"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Download,
  Eye,
  EyeOff,
  ChevronLeft,
  Calculator,
  Table2,
  Crosshair,
  RotateCcw,
  Palette,
  LineChart,
  Sigma,
  Grid3x3,
  Info,
  ExternalLink,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────

interface Expression {
  id: string;
  text: string;
  color: string;
  visible: boolean;
  error: string | null;
}

interface Point {
  x: number;
  y: number;
}

interface ViewPort {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

interface TableRow {
  x: number;
  y: number | null;
}

interface IntersectionPoint extends Point {
  expr1: number;
  expr2: number;
}

type CalcMode = "graph" | "scientific" | "matrix" | "about";

// ── Math Parser ───────────────────────────────────────────────────────

const COLORS = [
  "#6366f1", "#ef4444", "#22c55e", "#f59e0b", "#06b6d4",
  "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#3b82f6",
];

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if (/[0-9.]/.test(expr[i])) {
      let num = "";
      while (i < expr.length && /[0-9.eE]/.test(expr[i])) { num += expr[i]; i++; }
      tokens.push(num);
    } else if (/[a-zA-Z]/.test(expr[i])) {
      let id = "";
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) { id += expr[i]; i++; }
      tokens.push(id);
    } else {
      tokens.push(expr[i]);
      i++;
    }
  }
  return tokens;
}

function parseExpr(tokens: string[], pos: { i: number }): (x: number) => number {
  return parseAddSub(tokens, pos);
}

function parseAddSub(tokens: string[], pos: { i: number }): (x: number) => number {
  let left = parseMulDiv(tokens, pos);
  while (pos.i < tokens.length && (tokens[pos.i] === "+" || tokens[pos.i] === "-")) {
    const op = tokens[pos.i]; pos.i++;
    const right = parseMulDiv(tokens, pos);
    const l = left, r = right;
    left = op === "+" ? (x: number) => l(x) + r(x) : (x: number) => l(x) - r(x);
  }
  return left;
}

function parseMulDiv(tokens: string[], pos: { i: number }): (x: number) => number {
  let left = parsePower(tokens, pos);
  while (pos.i < tokens.length && (tokens[pos.i] === "*" || tokens[pos.i] === "/" || tokens[pos.i] === "%")) {
    const op = tokens[pos.i]; pos.i++;
    const right = parsePower(tokens, pos);
    const l = left, r = right;
    if (op === "*") left = (x: number) => l(x) * r(x);
    else if (op === "/") left = (x: number) => l(x) / r(x);
    else left = (x: number) => l(x) % r(x);
  }
  return left;
}

function parsePower(tokens: string[], pos: { i: number }): (x: number) => number {
  let base = parseUnary(tokens, pos);
  if (pos.i < tokens.length && tokens[pos.i] === "^") {
    pos.i++;
    const exp = parsePower(tokens, pos);
    const b = base;
    base = (x: number) => Math.pow(b(x), exp(x));
  }
  return base;
}

function parseUnary(tokens: string[], pos: { i: number }): (x: number) => number {
  if (pos.i < tokens.length && tokens[pos.i] === "-") {
    pos.i++;
    const inner = parseUnary(tokens, pos);
    return (x: number) => -inner(x);
  }
  if (pos.i < tokens.length && tokens[pos.i] === "+") {
    pos.i++;
    return parseUnary(tokens, pos);
  }
  return parseAtom(tokens, pos);
}

function parseAtom(tokens: string[], pos: { i: number }): (x: number) => number {
  const tok = tokens[pos.i];
  if (!tok) throw new Error("Unexpected end");

  if (tok === "(") {
    pos.i++;
    const inner = parseExpr(tokens, pos);
    if (tokens[pos.i] !== ")") throw new Error("Missing )");
    pos.i++;
    return inner;
  }

  if (tok === "|") {
    pos.i++;
    const inner = parseExpr(tokens, pos);
    if (tokens[pos.i] !== "|") throw new Error("Missing |");
    pos.i++;
    return (x: number) => Math.abs(inner(x));
  }

  if (/^[0-9.]/.test(tok)) {
    pos.i++;
    const val = parseFloat(tok);
    if (isNaN(val)) throw new Error(`Invalid number: ${tok}`);
    const fn = (_x: number) => val;
    if (pos.i < tokens.length && tokens[pos.i] === "x") {
      pos.i++;
      return (x: number) => val * x;
    }
    return fn;
  }

  const builtins: Record<string, (v: number) => number> = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh,
    sqrt: Math.sqrt, cbrt: Math.cbrt,
    ln: Math.log, log: Math.log10, log2: Math.log2,
    abs: Math.abs, sign: Math.sign,
    floor: Math.floor, ceil: Math.ceil, round: Math.round,
    exp: Math.exp,
  };

  if (tok in builtins) {
    pos.i++;
    if (tokens[pos.i] !== "(") throw new Error(`Expected ( after ${tok}`);
    pos.i++;
    const arg = parseExpr(tokens, pos);
    if (tokens[pos.i] !== ")") throw new Error("Missing )");
    pos.i++;
    const fn = builtins[tok];
    return (x: number) => fn(arg(x));
  }

  const constants: Record<string, number> = {
    pi: Math.PI, PI: Math.PI, e: Math.E, E: Math.E,
    tau: Math.PI * 2, phi: (1 + Math.sqrt(5)) / 2,
  };

  if (tok in constants) {
    pos.i++;
    const val = constants[tok];
    return (_x: number) => val;
  }

  if (tok === "x") {
    pos.i++;
    return (x: number) => x;
  }

  throw new Error(`Unknown: ${tok}`);
}

function compileExpression(text: string): { fn: ((x: number) => number) | null; error: string | null } {
  const cleaned = text.trim().toLowerCase()
    .replace(/\u00b2/g, "^2").replace(/\u00b3/g, "^3")
    .replace(/(\d)([a-zA-Z(])/g, "$1*$2")
    .replace(/\)(\d)/g, ")*$1")
    .replace(/\)\(/g, ")*(")
    .replace(/([a-zA-Z)])(\()/g, "$1$2");

  if (!cleaned) return { fn: null, error: null };

  let expression = cleaned;
  if (cleaned.startsWith("y=") || cleaned.startsWith("y =")) {
    expression = cleaned.replace(/^y\s*=\s*/, "");
  } else if (cleaned.startsWith("f(x)=") || cleaned.startsWith("f(x) =")) {
    expression = cleaned.replace(/^f\(x\)\s*=\s*/, "");
  }

  try {
    const tokens = tokenize(expression);
    if (tokens.length === 0) return { fn: null, error: null };
    const pos = { i: 0 };
    const fn = parseExpr(tokens, pos);
    if (pos.i < tokens.length) {
      const leftover = tokens.slice(pos.i).join("");
      if (leftover === "x") {
        const outer = fn;
        return { fn: (x: number) => outer(x) * x, error: null };
      }
      throw new Error(`Unexpected token: ${tokens[pos.i]}`);
    }
    fn(0);
    fn(1);
    return { fn, error: null };
  } catch (e) {
    return { fn: null, error: (e as Error).message };
  }
}

function evaluateAt(expr: string, xVal: number): { value: number | null; error: string | null } {
  const { fn, error } = compileExpression(expr);
  if (error) return { value: null, error };
  if (!fn) return { value: null, error: "Empty expression" };
  try {
    const v = fn(xVal);
    if (isNaN(v) || !isFinite(v)) return { value: null, error: "Result is not a finite real number" };
    return { value: v, error: null };
  } catch {
    return { value: null, error: "Evaluation failed" };
  }
}

// ── Matrix algebra (2×2 / 3×3) ─────────────────────────────────────────

type Matrix = number[][];

function parseMatrixCells(cells: string[][], n: number): { matrix: Matrix | null; error: string | null } {
  const m: Matrix = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      const raw = (cells[i]?.[j] ?? "").trim();
      if (raw === "") row.push(0);
      else {
        const v = Number(raw);
        if (Number.isNaN(v)) return { matrix: null, error: `Invalid number at row ${i + 1}, col ${j + 1}` };
        row.push(v);
      }
    }
    m.push(row);
  }
  return { matrix: m, error: null };
}

function matAdd(a: Matrix, b: Matrix): Matrix {
  return a.map((row, i) => row.map((v, j) => v + b[i][j]));
}

function matSub(a: Matrix, b: Matrix): Matrix {
  return a.map((row, i) => row.map((v, j) => v - b[i][j]));
}

function matMul(a: Matrix, b: Matrix): Matrix {
  const n = a.length;
  const m = b[0].length;
  const p = b.length;
  const out: Matrix = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < p; k++) {
      const aik = a[i][k];
      for (let j = 0; j < m; j++) out[i][j] += aik * b[k][j];
    }
  }
  return out;
}

function matDet(a: Matrix): number {
  const n = a.length;
  if (n === 2) return a[0][0] * a[1][1] - a[0][1] * a[1][0];
  if (n === 3) {
    const [r0, r1, r2] = a;
    return (
      r0[0] * (r1[1] * r2[2] - r1[2] * r2[1]) -
      r0[1] * (r1[0] * r2[2] - r1[2] * r2[0]) +
      r0[2] * (r1[0] * r2[1] - r1[1] * r2[0])
    );
  }
  throw new Error("Unsupported matrix size");
}

function matTranspose(a: Matrix): Matrix {
  return a[0].map((_, j) => a.map((row) => row[j]));
}

function matScalarMul(a: Matrix, k: number): Matrix {
  return a.map((row) => row.map((v) => v * k));
}

function matInv(a: Matrix): Matrix | null {
  const n = a.length;
  const aug: number[][] = a.map((row, i) => {
    const id = new Array(n).fill(0);
    id[i] = 1;
    return [...row.map((x) => x), ...id];
  });
  for (let c = 0; c < n; c++) {
    let piv = aug[c][c];
    let pr = c;
    for (let r = c + 1; r < n; r++) {
      if (Math.abs(aug[r][c]) > Math.abs(piv)) {
        piv = aug[r][c];
        pr = r;
      }
    }
    if (Math.abs(piv) < 1e-14) return null;
    if (pr !== c) [aug[c], aug[pr]] = [aug[pr], aug[c]];
    for (let j = 0; j < 2 * n; j++) aug[c][j] /= piv;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = aug[r][c];
      if (Math.abs(f) < 1e-15) continue;
      for (let j = 0; j < 2 * n; j++) aug[r][j] -= f * aug[c][j];
    }
  }
  return aug.map((row) => row.slice(n));
}

function findZeros(fn: (x: number) => number, xMin: number, xMax: number): number[] {
  const zeros: number[] = [];
  const steps = 500;
  const dx = (xMax - xMin) / steps;
  for (let i = 0; i < steps; i++) {
    const x1 = xMin + i * dx;
    const x2 = x1 + dx;
    const y1 = fn(x1);
    const y2 = fn(x2);
    if (isNaN(y1) || isNaN(y2) || !isFinite(y1) || !isFinite(y2)) continue;
    if (y1 * y2 <= 0) {
      let lo = x1, hi = x2;
      for (let j = 0; j < 50; j++) {
        const mid = (lo + hi) / 2;
        const ym = fn(mid);
        if (isNaN(ym) || !isFinite(ym)) break;
        if (fn(lo) * ym <= 0) hi = mid; else lo = mid;
      }
      const zero = (lo + hi) / 2;
      if (zeros.length === 0 || Math.abs(zero - zeros[zeros.length - 1]) > dx * 2) {
        zeros.push(zero);
      }
    }
  }
  return zeros;
}

function findIntersections(fns: { fn: (x: number) => number; idx: number }[], view: ViewPort): IntersectionPoint[] {
  const pts: IntersectionPoint[] = [];
  const steps = 300;
  const dx = (view.xMax - view.xMin) / steps;
  for (let a = 0; a < fns.length; a++) {
    for (let b = a + 1; b < fns.length; b++) {
      const diff = (x: number) => fns[a].fn(x) - fns[b].fn(x);
      for (let i = 0; i < steps; i++) {
        const x1 = view.xMin + i * dx;
        const x2 = x1 + dx;
        const d1 = diff(x1), d2 = diff(x2);
        if (isNaN(d1) || isNaN(d2) || !isFinite(d1) || !isFinite(d2)) continue;
        if (d1 * d2 <= 0) {
          let lo = x1, hi = x2;
          for (let j = 0; j < 40; j++) {
            const mid = (lo + hi) / 2;
            const dm = diff(mid);
            if (isNaN(dm) || !isFinite(dm)) break;
            if (diff(lo) * dm <= 0) hi = mid; else lo = mid;
          }
          const x = (lo + hi) / 2;
          const y = fns[a].fn(x);
          if (!isNaN(y) && isFinite(y) && y >= view.yMin && y <= view.yMax) {
            pts.push({ x, y, expr1: fns[a].idx, expr2: fns[b].idx });
          }
        }
      }
    }
  }
  return pts;
}

// ── Canvas Renderer ───────────────────────────────────────────────────

function drawGraph(
  canvas: HTMLCanvasElement,
  expressions: Expression[],
  compiledFns: (((x: number) => number) | null)[],
  view: ViewPort,
  cursor: Point | null,
  showGrid: boolean,
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const isDark = document.documentElement.classList.contains("dark");
  const bg = isDark ? "#09090b" : "#fafafa";
  const gridColor = isDark ? "#27272a" : "#e5e7eb";
  const axisColor = isDark ? "#52525b" : "#9ca3af";
  const textColor = isDark ? "#a1a1aa" : "#6b7280";

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const toCanvasX = (x: number) => ((x - view.xMin) / (view.xMax - view.xMin)) * w;
  const toCanvasY = (y: number) => ((view.yMax - y) / (view.yMax - view.yMin)) * h;
  const toMathX = (px: number) => view.xMin + (px / w) * (view.xMax - view.xMin);
  const toMathY = (py: number) => view.yMax - (py / h) * (view.yMax - view.yMin);

  if (showGrid) {
    const xRange = view.xMax - view.xMin;
    const yRange = view.yMax - view.yMin;
    const xStep = Math.pow(10, Math.floor(Math.log10(xRange / 5)));
    const yStep = Math.pow(10, Math.floor(Math.log10(yRange / 5)));

    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    ctx.font = `${Math.max(10, Math.min(12, w / 60))}px ui-monospace, monospace`;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (let x = Math.ceil(view.xMin / xStep) * xStep; x <= view.xMax; x += xStep) {
      const cx = toCanvasX(x);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
      if (Math.abs(x) > xStep * 0.1) {
        const label = Math.abs(x) >= 1000 || (Math.abs(x) < 0.01 && x !== 0) ? x.toExponential(1) : +x.toFixed(6);
        ctx.fillText(String(label), cx, toCanvasY(0) + 4);
      }
    }

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    for (let y = Math.ceil(view.yMin / yStep) * yStep; y <= view.yMax; y += yStep) {
      const cy = toCanvasY(y);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
      if (Math.abs(y) > yStep * 0.1) {
        const label = Math.abs(y) >= 1000 || (Math.abs(y) < 0.01 && y !== 0) ? y.toExponential(1) : +y.toFixed(6);
        ctx.fillText(String(label), toCanvasX(0) - 4, cy);
      }
    }
  }

  // Axes
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;
  const yAxisX = toCanvasX(0);
  const xAxisY = toCanvasY(0);
  if (yAxisX >= 0 && yAxisX <= w) {
    ctx.beginPath(); ctx.moveTo(yAxisX, 0); ctx.lineTo(yAxisX, h); ctx.stroke();
  }
  if (xAxisY >= 0 && xAxisY <= h) {
    ctx.beginPath(); ctx.moveTo(0, xAxisY); ctx.lineTo(w, xAxisY); ctx.stroke();
  }

  // Origin label
  if (yAxisX >= 0 && yAxisX <= w && xAxisY >= 0 && xAxisY <= h) {
    ctx.fillStyle = textColor;
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText("0", yAxisX - 4, xAxisY + 4);
  }

  // Curves
  const pixelStep = 1;
  for (let i = 0; i < expressions.length; i++) {
    const expr = expressions[i];
    const fn = compiledFns[i];
    if (!expr.visible || !fn) continue;

    ctx.strokeStyle = expr.color;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    let drawing = false;

    for (let px = 0; px <= w; px += pixelStep) {
      const mathX = toMathX(px);
      const mathY = fn(mathX);
      if (mathY === null || isNaN(mathY) || !isFinite(mathY) || mathY > view.yMax * 10 || mathY < view.yMin * 10) {
        drawing = false;
        continue;
      }
      const cy = toCanvasY(mathY);
      if (!drawing) {
        ctx.moveTo(px, cy);
        drawing = true;
      } else {
        ctx.lineTo(px, cy);
      }
    }
    ctx.stroke();
  }

  // Cursor crosshair + values
  if (cursor) {
    const cx = toCanvasX(cursor.x);
    const cy = toCanvasY(cursor.y);

    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.setLineDash([]);

    // Snap to nearest curve
    for (let i = 0; i < expressions.length; i++) {
      const fn = compiledFns[i];
      if (!fn || !expressions[i].visible) continue;
      const fy = fn(cursor.x);
      if (isNaN(fy) || !isFinite(fy)) continue;
      const snapY = toCanvasY(fy);
      if (Math.abs(snapY - cy) < 30) {
        ctx.fillStyle = expressions[i].color;
        ctx.beginPath();
        ctx.arc(cx, snapY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isDark ? "#fafafa" : "#111";
        ctx.font = "bold 11px ui-monospace, monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.fillText(`(${cursor.x.toFixed(3)}, ${fy.toFixed(3)})`, cx + 10, snapY - 6);
      }
    }
  }
}

// ── Main Component ────────────────────────────────────────────────────

const DEFAULT_VIEW: ViewPort = { xMin: -10, xMax: 10, yMin: -7, yMax: 7 };

export default function GraphCalculatorPage() {
  const [expressions, setExpressions] = useState<Expression[]>([
    { id: "1", text: "sin(x)", color: COLORS[0], visible: true, error: null },
  ]);
  const [view, setView] = useState<ViewPort>(DEFAULT_VIEW);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showTable, setShowTable] = useState(false);
  const [selectedExpr, setSelectedExpr] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mode, setMode] = useState<CalcMode>("graph");

  const [sciExpr, setSciExpr] = useState("sin(pi/2)+sqrt(2)");
  const [sciX, setSciX] = useState("0");

  const [matrixSize, setMatrixSize] = useState<2 | 3>(2);
  const [matrixOp, setMatrixOp] = useState<
    "add" | "sub" | "mul" | "detA" | "detB" | "invA" | "invB" | "transA" | "transB" | "scalar"
  >("add");
  const [matrixScalar, setMatrixScalar] = useState("2");
  const [cellsA, setCellsA] = useState<string[][]>([
    ["1", "0"],
    ["0", "1"],
  ]);
  const [cellsB, setCellsB] = useState<string[][]>([
    ["1", "1"],
    ["0", "1"],
  ]);

  useEffect(() => {
    const n = matrixSize;
    setCellsA((prev) =>
      Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? (i === j ? "1" : "0"))
      )
    );
    setCellsB((prev) =>
      Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => prev[i]?.[j] ?? (i === j ? "1" : "0"))
      )
    );
  }, [matrixSize]);

  const sciEval = useMemo(() => {
    const xv = Number(sciX);
    if (sciX.trim() !== "" && Number.isNaN(xv)) return { value: null as number | null, error: "x must be a valid number" };
    return evaluateAt(sciExpr, Number.isNaN(xv) ? 0 : xv);
  }, [sciExpr, sciX]);

  const matrixComputation = useMemo(() => {
    const n = matrixSize;
    const pa = parseMatrixCells(cellsA, n);
    const pb = parseMatrixCells(cellsB, n);
    if (pa.error) return { kind: "error" as const, message: pa.error };
    if (pb.error) return { kind: "error" as const, message: pb.error };
    const A = pa.matrix!;
    const B = pb.matrix!;
    const k = Number(matrixScalar);
    try {
      switch (matrixOp) {
        case "add":
          return { kind: "matrix" as const, data: matAdd(A, B) };
        case "sub":
          return { kind: "matrix" as const, data: matSub(A, B) };
        case "mul":
          return { kind: "matrix" as const, data: matMul(A, B) };
        case "detA":
          return { kind: "scalar" as const, data: matDet(A) };
        case "detB":
          return { kind: "scalar" as const, data: matDet(B) };
        case "invA": {
          const inv = matInv(A);
          if (!inv) return { kind: "error" as const, message: "A is singular — no inverse" };
          return { kind: "matrix" as const, data: inv };
        }
        case "invB": {
          const inv = matInv(B);
          if (!inv) return { kind: "error" as const, message: "B is singular — no inverse" };
          return { kind: "matrix" as const, data: inv };
        }
        case "transA":
          return { kind: "matrix" as const, data: matTranspose(A) };
        case "transB":
          return { kind: "matrix" as const, data: matTranspose(B) };
        case "scalar":
          if (matrixScalar.trim() === "" || Number.isNaN(k)) return { kind: "error" as const, message: "Enter a valid scalar k" };
          return { kind: "matrix" as const, data: matScalarMul(A, k) };
        default:
          return { kind: "error" as const, message: "Unknown operation" };
      }
    } catch (e) {
      return { kind: "error" as const, message: (e as Error).message };
    }
  }, [cellsA, cellsB, matrixSize, matrixOp, matrixScalar]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panStart = useRef<{ x: number; y: number; view: ViewPort } | null>(null);
  const nextId = useRef(2);

  const compiled = useMemo(() => {
    return expressions.map((e) => {
      const result = compileExpression(e.text);
      return result;
    });
  }, [expressions]);

  useEffect(() => {
    setExpressions((prev) =>
      prev.map((e, i) => ({ ...e, error: compiled[i]?.error ?? null }))
    );
  }, [compiled]);

  const compiledFns = useMemo(() => compiled.map((c) => c.fn), [compiled]);

  // Draw
  useEffect(() => {
    if (mode !== "graph") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawGraph(canvas, expressions, compiledFns, view, cursor, showGrid);
  }, [mode, expressions, compiledFns, view, cursor, showGrid]);

  // Resize observer
  useEffect(() => {
    if (mode !== "graph") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      drawGraph(canvas, expressions, compiledFns, view, cursor, showGrid);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [mode, expressions, compiledFns, view, cursor, showGrid]);

  // Mouse handlers for pan/zoom/cursor
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    if (panStart.current) {
      const dx = (e.clientX - panStart.current.x) / w * (panStart.current.view.xMax - panStart.current.view.xMin);
      const dy = (e.clientY - panStart.current.y) / h * (panStart.current.view.yMax - panStart.current.view.yMin);
      setView({
        xMin: panStart.current.view.xMin - dx,
        xMax: panStart.current.view.xMax - dx,
        yMin: panStart.current.view.yMin + dy,
        yMax: panStart.current.view.yMax + dy,
      });
    } else {
      const mathX = view.xMin + (px / w) * (view.xMax - view.xMin);
      const mathY = view.yMax - (py / h) * (view.yMax - view.yMin);
      setCursor({ x: mathX, y: mathY });
    }
  }, [view]);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    panStart.current = { x: e.clientX, y: e.clientY, view: { ...view } };
    setCursor(null);
  }, [view]);

  const handleCanvasMouseUp = useCallback(() => {
    panStart.current = null;
  }, []);

  const handleCanvasMouseLeave = useCallback(() => {
    panStart.current = null;
    setCursor(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const cx = view.xMin + px * (view.xMax - view.xMin);
    const cy = view.yMax - py * (view.yMax - view.yMin);
    setView({
      xMin: cx - (cx - view.xMin) * factor,
      xMax: cx + (view.xMax - cx) * factor,
      yMin: cy - (cy - view.yMin) * factor,
      yMax: cy + (view.yMax - cy) * factor,
    });
  }, [view]);

  const zoom = useCallback((factor: number) => {
    const cx = (view.xMin + view.xMax) / 2;
    const cy = (view.yMin + view.yMax) / 2;
    const xRange = (view.xMax - view.xMin) * factor / 2;
    const yRange = (view.yMax - view.yMin) * factor / 2;
    setView({ xMin: cx - xRange, xMax: cx + xRange, yMin: cy - yRange, yMax: cy + yRange });
  }, [view]);

  const resetView = useCallback(() => setView(DEFAULT_VIEW), []);

  const addExpression = useCallback(() => {
    const id = String(nextId.current++);
    setExpressions((prev) => [
      ...prev,
      { id, text: "", color: COLORS[prev.length % COLORS.length], visible: true, error: null },
    ]);
  }, []);

  const updateExpression = useCallback((id: string, text: string) => {
    setExpressions((prev) => prev.map((e) => (e.id === id ? { ...e, text } : e)));
  }, []);

  const removeExpression = useCallback((id: string) => {
    setExpressions((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setExpressions((prev) => prev.map((e) => (e.id === id ? { ...e, visible: !e.visible } : e)));
  }, []);

  const updateColor = useCallback((id: string, color: string) => {
    setExpressions((prev) => prev.map((e) => (e.id === id ? { ...e, color } : e)));
  }, []);

  const downloadPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "graph.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  // Table data
  const tableData: TableRow[] = useMemo(() => {
    const fn = compiledFns[selectedExpr];
    if (!fn) return [];
    const rows: TableRow[] = [];
    const step = (view.xMax - view.xMin) / 20;
    for (let x = view.xMin; x <= view.xMax; x += step) {
      const y = fn(x);
      rows.push({ x: +x.toFixed(6), y: y !== null && isFinite(y) && !isNaN(y) ? +y.toFixed(6) : null });
    }
    return rows;
  }, [compiledFns, selectedExpr, view]);

  // Points of interest
  const pointsOfInterest = useMemo(() => {
    const poi: { label: string; x: number; y: number; color: string }[] = [];
    const activeFns: { fn: (x: number) => number; idx: number }[] = [];

    compiledFns.forEach((fn, i) => {
      if (!fn || !expressions[i]?.visible) return;
      activeFns.push({ fn, idx: i });

      // X-intercepts
      const zeros = findZeros(fn, view.xMin, view.xMax);
      zeros.forEach((z) => {
        poi.push({ label: `x-int`, x: +z.toFixed(4), y: 0, color: expressions[i].color });
      });

      // Y-intercept
      const y0 = fn(0);
      if (isFinite(y0) && !isNaN(y0) && 0 >= view.xMin && 0 <= view.xMax) {
        poi.push({ label: "y-int", x: 0, y: +y0.toFixed(4), color: expressions[i].color });
      }
    });

    // Intersections
    const ints = findIntersections(activeFns, view);
    ints.forEach((p) => {
      poi.push({ label: "intersect", x: +p.x.toFixed(4), y: +p.y.toFixed(4), color: "#fff" });
    });

    return poi;
  }, [compiledFns, expressions, view]);

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border bg-card shrink-0">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
              <Calculator size={22} className="text-accent" />
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-foreground tracking-tight leading-tight">Math Suite</h1>
                <p className="text-[11px] text-muted-foreground truncate">Inspired by Desmos · client-side</p>
              </div>
            </a>
            <span className="text-xs text-muted-foreground hidden lg:inline shrink-0">DevForge</span>
          </div>
          {mode === "graph" && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button type="button" onClick={() => zoom(0.7)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Zoom In"><ZoomIn size={16} /></button>
              <button type="button" onClick={() => zoom(1.4)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Zoom Out"><ZoomOut size={16} /></button>
              <button type="button" onClick={resetView} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Reset View"><RotateCcw size={16} /></button>
              <button type="button" onClick={() => setShowGrid(!showGrid)} className={`p-1.5 rounded-lg transition-colors ${showGrid ? "bg-accent-light text-accent" : "hover:bg-muted text-muted-foreground"}`} title="Toggle Grid"><Crosshair size={16} /></button>
              <button type="button" onClick={() => setShowTable(!showTable)} className={`p-1.5 rounded-lg transition-colors ${showTable ? "bg-accent-light text-accent" : "hover:bg-muted text-muted-foreground"}`} title="Toggle Table"><Table2 size={16} /></button>
              <button type="button" onClick={downloadPng} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" title="Download PNG"><Download size={16} /></button>
            </div>
          )}
        </div>
        <nav className="flex gap-1 px-4 pb-2 overflow-x-auto border-t border-border/60 bg-card/50" role="tablist" aria-label="Calculator mode">
          {([
            { id: "graph" as const, label: "Graph", Icon: LineChart },
            { id: "scientific" as const, label: "Scientific", Icon: Sigma },
            { id: "matrix" as const, label: "Matrix", Icon: Grid3x3 },
            { id: "about" as const, label: "About", Icon: Info },
          ]).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                mode === id ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>
      </header>

      {mode === "graph" && (
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — expression list */}
        {sidebarOpen && (
          <div className="w-80 border-r border-border bg-card flex flex-col shrink-0 overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">EXPRESSIONS</span>
              <button onClick={addExpression} className="flex items-center gap-1 text-xs text-accent hover:underline"><Plus size={12} /> Add</button>
            </div>
            <div className="flex-1 overflow-auto scrollbar-thin">
              {expressions.map((expr, idx) => (
                <div
                  key={expr.id}
                  className={`border-b border-border px-3 py-2.5 group transition-colors ${selectedExpr === idx ? "bg-muted/50" : "hover:bg-muted/30"}`}
                  onClick={() => setSelectedExpr(idx)}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: expr.color }}>
                        {idx + 1}
                      </span>
                      <label className="relative cursor-pointer">
                        <input
                          type="color"
                          value={expr.color}
                          onChange={(e) => updateColor(expr.id, e.target.value)}
                          className="sr-only"
                        />
                        <Palette size={12} className="text-muted-foreground hover:text-foreground" />
                      </label>
                    </div>
                    <input
                      type="text"
                      value={expr.text}
                      onChange={(e) => updateExpression(expr.id, e.target.value)}
                      placeholder={`y = f(x)…`}
                      spellCheck={false}
                      className="flex-1 min-w-0 px-2 py-1 text-sm font-mono rounded border border-border bg-background text-foreground outline-none focus:ring-1 focus:ring-ring/40 placeholder:text-muted-foreground/40"
                    />
                    <button onClick={() => toggleVisibility(expr.id)} className="text-muted-foreground hover:text-foreground p-0.5" title={expr.visible ? "Hide" : "Show"}>
                      {expr.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    {expressions.length > 1 && (
                      <button onClick={() => removeExpression(expr.id)} className="text-muted-foreground hover:text-destructive p-0.5" title="Remove">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  {expr.error && (
                    <p className="text-xs text-destructive mt-1 pl-7">{expr.error}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Points of interest */}
            {pointsOfInterest.length > 0 && (
              <div className="border-t border-border px-3 py-2 max-h-40 overflow-auto scrollbar-thin">
                <span className="text-xs font-medium text-muted-foreground block mb-1">POINTS OF INTEREST</span>
                {pointsOfInterest.slice(0, 20).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground">{p.label}:</span>
                    <span className="font-mono text-foreground">({p.x}, {p.y})</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick functions */}
            <div className="border-t border-border px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground block mb-1.5">QUICK ADD</span>
              <div className="flex flex-wrap gap-1">
                {["x^2", "sin(x)", "cos(x)", "tan(x)", "sqrt(x)", "abs(x)", "ln(x)", "e^x", "1/x", "x^3-x"].map((fn) => (
                  <button
                    key={fn}
                    onClick={() => {
                      const id = String(nextId.current++);
                      setExpressions((prev) => [
                        ...prev,
                        { id, text: fn, color: COLORS[(prev.length) % COLORS.length], visible: true, error: null },
                      ]);
                    }}
                    className="px-2 py-0.5 text-xs font-mono rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {fn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toggle sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-5 flex items-center justify-center border-r border-border bg-card hover:bg-muted text-muted-foreground shrink-0"
          title={sidebarOpen ? "Collapse" : "Expand"}
        >
          <ChevronLeft size={12} className={`transition-transform ${sidebarOpen ? "" : "rotate-180"}`} />
        </button>

        {/* Canvas + Table */}
        <div className="flex-1 flex flex-col min-h-0" ref={containerRef}>
          <div className="flex-1 min-h-0 relative">
            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-crosshair"
              onMouseMove={handleCanvasMouseMove}
              onMouseDown={handleCanvasMouseDown}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseLeave}
              onWheel={handleWheel}
            />
            {/* Cursor readout */}
            {cursor && (
              <div className="absolute bottom-3 left-3 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground shadow-sm">
                x: {cursor.x.toFixed(4)}, y: {cursor.y.toFixed(4)}
              </div>
            )}
            {/* View range */}
            <div className="absolute bottom-3 right-3 bg-card/90 backdrop-blur border border-border rounded-lg px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              [{view.xMin.toFixed(1)}, {view.xMax.toFixed(1)}] × [{view.yMin.toFixed(1)}, {view.yMax.toFixed(1)}]
            </div>
          </div>

          {/* Table */}
          {showTable && (
            <div className="h-48 border-t border-border overflow-auto scrollbar-thin bg-card">
              <table className="w-full text-xs font-mono border-collapse">
                <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                  <tr>
                    <th className="px-3 py-1.5 text-left font-medium text-muted-foreground border-b border-r border-border">x</th>
                    <th className="px-3 py-1.5 text-left font-medium border-b border-border" style={{ color: expressions[selectedExpr]?.color }}>
                      y = {expressions[selectedExpr]?.text || "?"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-3 py-1 border-b border-r border-border text-foreground">{row.x}</td>
                      <td className="px-3 py-1 border-b border-border" style={{ color: row.y !== null ? expressions[selectedExpr]?.color : undefined }}>
                        {row.y !== null ? row.y : <span className="text-muted-foreground italic">undefined</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      )}

      {mode === "scientific" && (
        <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full space-y-6">
          <p className="text-sm text-muted-foreground">
            Same syntax as Graph mode. Use{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">x</code> as a variable, or constants only (e.g.{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">sin(pi/2)</code>).
          </p>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Expression</label>
            <textarea
              value={sciExpr}
              onChange={(e) => setSciExpr(e.target.value)}
              rows={3}
              spellCheck={false}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {["pi", "e", "sin(", "cos(", "tan(", "sqrt(", "ln(", "abs(", "x", "^2"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSciExpr((s) => s + t)}
                className="px-2 py-1 text-xs font-mono rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Value of x</label>
              <input
                value={sciX}
                onChange={(e) => setSciX(e.target.value)}
                className="w-32 px-3 py-2 rounded-lg border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>
            <div className="flex-1 min-w-[200px] rounded-xl border border-border bg-card p-4">
              <span className="text-xs text-muted-foreground">Result</span>
              {sciEval.error ? (
                <p className="text-destructive text-sm mt-1">{sciEval.error}</p>
              ) : (
                <p className="text-2xl font-mono font-semibold text-accent mt-1 tabular-nums">
                  {sciEval.value !== null ? sciEval.value : "—"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "matrix" && (
        <div className="flex-1 overflow-auto p-6 max-w-5xl mx-auto w-full space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
            <label className="text-sm text-muted-foreground">Size</label>
            <select
              value={matrixSize}
              onChange={(e) => setMatrixSize(Number(e.target.value) as 2 | 3)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value={2}>2 × 2</option>
              <option value={3}>3 × 3</option>
            </select>
            <label className="text-sm text-muted-foreground ml-2">Operation</label>
            <select
              value={matrixOp}
              onChange={(e) => setMatrixOp(e.target.value as typeof matrixOp)}
              className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm max-w-[240px] focus:outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="add">A + B</option>
              <option value="sub">A − B</option>
              <option value="mul">A × B (matrix product)</option>
              <option value="detA">det(A)</option>
              <option value="detB">det(B)</option>
              <option value="invA">A⁻¹</option>
              <option value="invB">B⁻¹</option>
              <option value="transA">Aᵀ</option>
              <option value="transB">Bᵀ</option>
              <option value="scalar">k · A</option>
            </select>
            {matrixOp === "scalar" && (
              <input
                value={matrixScalar}
                onChange={(e) => setMatrixScalar(e.target.value)}
                placeholder="k"
                className="w-24 px-2 py-1.5 rounded-lg border border-border bg-background font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-sm font-medium mb-2 text-foreground">Matrix A</h3>
              <div
                className="inline-grid gap-1"
                style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 4rem))` }}
              >
                {Array.from({ length: matrixSize * matrixSize }, (_, k) => {
                  const i = Math.floor(k / matrixSize);
                  const j = k % matrixSize;
                  return (
                    <input
                      key={`a-${i}-${j}`}
                      value={cellsA[i]?.[j] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCellsA((prev) => {
                          const c = prev.map((row) => [...row]);
                          if (!c[i]) c[i] = [];
                          c[i][j] = v;
                          return c;
                        });
                      }}
                      className="w-16 px-2 py-1.5 rounded border border-border bg-background font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2 text-foreground">Matrix B</h3>
              <div
                className="inline-grid gap-1"
                style={{ gridTemplateColumns: `repeat(${matrixSize}, minmax(0, 4rem))` }}
              >
                {Array.from({ length: matrixSize * matrixSize }, (_, k) => {
                  const i = Math.floor(k / matrixSize);
                  const j = k % matrixSize;
                  return (
                    <input
                      key={`b-${i}-${j}`}
                      value={cellsB[i]?.[j] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCellsB((prev) => {
                          const c = prev.map((row) => [...row]);
                          if (!c[i]) c[i] = [];
                          c[i][j] = v;
                          return c;
                        });
                      }}
                      className="w-16 px-2 py-1.5 rounded border border-border bg-background font-mono text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring/40"
                    />
                  );
                })}
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Output</h3>
            {matrixComputation.kind === "error" && (
              <p className="text-destructive text-sm">{matrixComputation.message}</p>
            )}
            {matrixComputation.kind === "scalar" && (
              <p className="text-2xl font-mono font-semibold text-accent tabular-nums">{matrixComputation.data}</p>
            )}
            {matrixComputation.kind === "matrix" && matrixComputation.data[0] && (
              <div
                className="inline-grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${matrixComputation.data[0].length}, minmax(0, 5rem))`,
                }}
              >
                {matrixComputation.data.flatMap((row, i) =>
                  row.map((v, j) => (
                    <div
                      key={`o-${i}-${j}`}
                      className="px-2 py-1.5 rounded bg-muted/50 font-mono text-sm text-center tabular-nums text-foreground"
                    >
                      {+v.toPrecision(8)}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {mode === "about" && (
        <div className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full space-y-5 text-sm">
          <h2 className="text-lg font-semibold text-foreground">What this covers</h2>
          <p className="text-muted-foreground leading-relaxed">
            DevForge <span className="text-foreground font-medium">Math Suite</span> includes{" "}
            <span className="text-foreground font-medium">2D graphing</span> (multiple functions, zoom/pan, value tables, intersections), a{" "}
            <span className="text-foreground font-medium">scientific evaluator</span>, and{" "}
            <span className="text-foreground font-medium">matrix algebra</span> for 2×2 and 3×3 matrices. All computation stays in your browser.
          </p>
          <h3 className="text-base font-semibold text-foreground pt-1">What full Desmos adds</h3>
          <p className="text-muted-foreground leading-relaxed">
            <a href="https://www.desmos.com/" className="text-accent hover:underline font-medium">
              Desmos
            </a>{" "}
            offers dedicated apps for geometry constructions, 3D graphing, deeper statistics/regressions, and classroom features. Those require specialized engines and are not replicated in this lightweight tool.
          </p>
          <ul className="space-y-2 text-muted-foreground list-none pl-0">
            <li>
              <a href="https://www.desmos.com/calculator" className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <ExternalLink size={14} /> Graphing Calculator
              </a>
            </li>
            <li>
              <a href="https://www.desmos.com/scientific" className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <ExternalLink size={14} /> Scientific Calculator
              </a>
            </li>
            <li>
              <a href="https://www.desmos.com/matrix" className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <ExternalLink size={14} /> Matrix Calculator
              </a>
            </li>
            <li>
              <a href="https://www.desmos.com/geometry" className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <ExternalLink size={14} /> Geometry
              </a>
            </li>
            <li>
              <a href="https://www.desmos.com/3d" className="inline-flex items-center gap-1.5 text-accent hover:underline">
                <ExternalLink size={14} /> 3D Graphing
              </a>
            </li>
          </ul>
        </div>
      )}

      {mode === "graph" ? (
      <div className="border-t border-border bg-card px-4 py-1.5 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span>{expressions.filter((e) => e.visible && compiledFns[expressions.indexOf(e)]).length} active curve{expressions.length !== 1 ? "s" : ""}</span>
        <span>{pointsOfInterest.length} point{pointsOfInterest.length !== 1 ? "s" : ""} of interest</span>
        <span className="ml-auto">Scroll to zoom · Drag to pan · Hover to trace</span>
      </div>
      ) : (
      <div className="border-t border-border bg-card px-4 py-1.5 flex items-center text-xs text-muted-foreground shrink-0">
        <span className="ml-auto">Client-side math · Not affiliated with Desmos</span>
      </div>
      )}
    </div>
  );
}
