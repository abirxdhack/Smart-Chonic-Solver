import { analyzeConic, type ParseResult } from "./parser";

export type EllipseParsed = {
  alpha: number;
  beta: number;
  a: number;
  b: number;
  orientation: "horizontal" | "vertical";
};

export function parseEllipse(raw: string): EllipseParsed | null {
  const r = analyzeConic(raw);
  if (!r.ok || r.conic.type !== "ellipse") return null;
  const { alpha, beta, a, b, orientation } = r.conic;
  return { alpha, beta, a, b, orientation };
}

export function parseEllipseDetailed(raw: string): ParseResult {
  return analyzeConic(raw);
}

export type EllipseGeo = {
  center: [number, number];
  a: number;
  b: number;
  e: number;
  c: number;
  majorLen: number;
  minorLen: number;
  majorAxisEq: string;
  minorAxisEq: string;
  vertices: [[number, number], [number, number]];
  minorVertices: [[number, number], [number, number]];
  foci: [[number, number], [number, number]];
  fociDist: number;
  directrixFeet: [[number, number], [number, number]];
  directricesDist: number;
  directrixEqs: [string, string];
  latusRectumLen: number;
  latusRectumEqs: [string, string];
};

export function ellipseGeometry(p: EllipseParsed): EllipseGeo {
  const { alpha, beta, a, b, orientation } = p;
  const c = Math.sqrt(Math.max(0, a * a - b * b));
  const e = c / a;
  const horiz = orientation === "horizontal";
  const vertices: [[number, number], [number, number]] = horiz
    ? [
        [alpha - a, beta],
        [alpha + a, beta],
      ]
    : [
        [alpha, beta - a],
        [alpha, beta + a],
      ];
  const minorVertices: [[number, number], [number, number]] = horiz
    ? [
        [alpha, beta - b],
        [alpha, beta + b],
      ]
    : [
        [alpha - b, beta],
        [alpha + b, beta],
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
  const bnNumStr = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(4));
  const majorAxisEq = horiz ? `y = ${bnNumStr(beta)}` : `x = ${bnNumStr(alpha)}`;
  const minorAxisEq = horiz ? `x = ${bnNumStr(alpha)}` : `y = ${bnNumStr(beta)}`;
  const directrixEqs: [string, string] = horiz
    ? [`x = ${bnNumStr(alpha - a / e)}`, `x = ${bnNumStr(alpha + a / e)}`]
    : [`y = ${bnNumStr(beta - a / e)}`, `y = ${bnNumStr(beta + a / e)}`];
  const latusRectumEqs: [string, string] = horiz
    ? [`x = ${bnNumStr(alpha - c)}`, `x = ${bnNumStr(alpha + c)}`]
    : [`y = ${bnNumStr(beta - c)}`, `y = ${bnNumStr(beta + c)}`];
  return {
    center: [alpha, beta],
    a,
    b,
    e,
    c,
    majorLen: 2 * a,
    minorLen: 2 * b,
    majorAxisEq,
    minorAxisEq,
    vertices,
    minorVertices,
    foci,
    fociDist: 2 * c,
    directrixFeet,
    directricesDist: (2 * a) / e,
    directrixEqs,
    latusRectumLen: (2 * b * b) / a,
    latusRectumEqs,
  };
}

export function focalDistancesEllipse(
  p: EllipseParsed,
  x1: number,
  y1: number,
): { d1: number; d2: number; sum: number } {
  const geo = ellipseGeometry(p);
  const [f1, f2] = geo.foci;
  const d1 = Math.hypot(x1 - f1[0], y1 - f1[1]);
  const d2 = Math.hypot(x1 - f2[0], y1 - f2[1]);
  return { d1, d2, sum: d1 + d2 };
}

export function pointPositionEllipse(
  p: EllipseParsed,
  x1: number,
  y1: number,
): "inside" | "on" | "outside" {
  const { alpha, beta, a, b, orientation } = p;
  const axSq = orientation === "horizontal" ? a * a : b * b;
  const bySq = orientation === "horizontal" ? b * b : a * a;
  const v = (x1 - alpha) ** 2 / axSq + (y1 - beta) ** 2 / bySq - 1;
  if (Math.abs(v) < 1e-9) return "on";
  return v < 0 ? "inside" : "outside";
}
