import { trt } from "@/i18n";
import { analyzeConic, type ParseResult } from "./parser";

export type HyperbolaParsed = {
  alpha: number;
  beta: number;
  a: number;
  b: number;
  orientation: "horizontal" | "vertical";
};

export function parseHyperbola(raw: string): HyperbolaParsed | null {
  const r = analyzeConic(raw);
  if (!r.ok || r.conic.type !== "hyperbola") return null;
  const { alpha, beta, a, b, orientation } = r.conic;
  return { alpha, beta, a, b, orientation };
}

export function parseHyperbolaDetailed(raw: string): ParseResult {
  return analyzeConic(raw);
}

export type HyperbolaGeo = {
  center: [number, number];
  a: number;
  b: number;
  e: number;
  c: number;
  transverseLen: number;
  conjugateLen: number;
  transverseAxisEq: string;
  conjugateAxisEq: string;
  vertices: [[number, number], [number, number]];
  foci: [[number, number], [number, number]];
  fociDist: number;
  directrixFeet: [[number, number], [number, number]];
  directricesDist: number;
  directrixEqs: [string, string];
  latusRectumLen: number;
  latusRectumEqs: [string, string];
  asymptotes: [string, string];
  directorCircleEq: string;
};

export function hyperbolaGeometry(p: HyperbolaParsed): HyperbolaGeo {
  const { alpha, beta, a, b, orientation } = p;
  const c = Math.sqrt(a * a + b * b);
  const e = c / a;
  const horiz = orientation === "horizontal";
  const n = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(4));
  const vertices: [[number, number], [number, number]] = horiz
    ? [
        [alpha - a, beta],
        [alpha + a, beta],
      ]
    : [
        [alpha, beta - a],
        [alpha, beta + a],
      ];
  const foci: [[number, number], [number, number]] = horiz
    ? [
        [alpha - c, beta],
        [alpha + c, beta],
      ]
    : [
        [alpha, beta - c],
        [alpha, beta + c],
      ];
  const directrixFeet: [[number, number], [number, number]] = horiz
    ? [
        [alpha - a / e, beta],
        [alpha + a / e, beta],
      ]
    : [
        [alpha, beta - a / e],
        [alpha, beta + a / e],
      ];
  const transverseAxisEq = horiz ? `y = ${n(beta)}` : `x = ${n(alpha)}`;
  const conjugateAxisEq = horiz ? `x = ${n(alpha)}` : `y = ${n(beta)}`;
  const directrixEqs: [string, string] = horiz
    ? [`x = ${n(alpha - a / e)}`, `x = ${n(alpha + a / e)}`]
    : [`y = ${n(beta - a / e)}`, `y = ${n(beta + a / e)}`];
  const latusRectumEqs: [string, string] = horiz
    ? [`x = ${n(alpha - c)}`, `x = ${n(alpha + c)}`]
    : [`y = ${n(beta - c)}`, `y = ${n(beta + c)}`];
  const slope = horiz ? b / a : a / b;
  const asymptotes: [string, string] = [
    `y − ${n(beta)} = ${n(slope)}(x − ${n(alpha)})`,
    `y − ${n(beta)} = −${n(slope)}(x − ${n(alpha)})`,
  ];
  const rSq = a * a - b * b;
  const directorCircleEq =
    rSq > 0 ? `(x − ${n(alpha)})² + (y − ${n(beta)})² = ${n(rSq)}` : trt`নেই (a² ≤ b²)`;
  return {
    center: [alpha, beta],
    a,
    b,
    e,
    c,
    transverseLen: 2 * a,
    conjugateLen: 2 * b,
    transverseAxisEq,
    conjugateAxisEq,
    vertices,
    foci,
    fociDist: 2 * c,
    directrixFeet,
    directricesDist: (2 * a) / e,
    directrixEqs,
    latusRectumLen: (2 * b * b) / a,
    latusRectumEqs,
    asymptotes,
    directorCircleEq,
  };
}

export function focalDistancesHyperbola(p: HyperbolaParsed, x1: number, y1: number) {
  const geo = hyperbolaGeometry(p);
  const [f1, f2] = geo.foci;
  const d1 = Math.hypot(x1 - f1[0], y1 - f1[1]);
  const d2 = Math.hypot(x1 - f2[0], y1 - f2[1]);
  return { d1, d2, diff: Math.abs(d1 - d2) };
}

export function pointPositionHyperbola(
  p: HyperbolaParsed,
  x1: number,
  y1: number,
): "inside" | "on" | "outside" {
  const { alpha, beta, a, b, orientation } = p;
  const horiz = orientation === "horizontal";
  const v = horiz
    ? (x1 - alpha) ** 2 / (a * a) - (y1 - beta) ** 2 / (b * b) - 1
    : (y1 - beta) ** 2 / (a * a) - (x1 - alpha) ** 2 / (b * b) - 1;
  if (Math.abs(v) < 1e-9) return "on";
  return v > 0 ? "inside" : "outside";
}
