import { analyzeConic, type ParseResult } from "./parser";

export type ParabolaParsed = {
  h: number;
  k: number;
  a: number;
  orientation: "x" | "y";
};

export function parseParabola(raw: string): ParabolaParsed | null {
  const r = analyzeConic(raw);
  if (!r.ok || r.conic.type !== "parabola") return null;
  const { h, k, a, orientation } = r.conic;
  return { h, k, a, orientation };
}

export function parseParabolaDetailed(raw: string): ParseResult {
  return analyzeConic(raw);
}

export function parabolaGeometry(p: ParabolaParsed) {
  const { h, k, a, orientation } = p;
  const vertex: [number, number] = [h, k];
  const focus: [number, number] = orientation === "x" ? [h + a, k] : [h, k + a];
  const dirFoot: [number, number] = orientation === "x" ? [h - a, k] : [h, k - a];
  const latusEnds: [[number, number], [number, number]] =
    orientation === "x"
      ? [
          [h + a, k + 2 * Math.abs(a)],
          [h + a, k - 2 * Math.abs(a)],
        ]
      : [
          [h + 2 * Math.abs(a), k + a],
          [h - 2 * Math.abs(a), k + a],
        ];
  return { vertex, focus, dirFoot, latusEnds };
}

export function focalDistanceParabola(p: ParabolaParsed, x1: number, y1: number) {
  const { h, k, a, orientation } = p;
  if (orientation === "x") return Math.abs(x1 - (h - a));
  return Math.abs(y1 - (k - a));
}
