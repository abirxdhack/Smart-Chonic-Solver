import { useEffect, useMemo, useRef, useState } from "react";
import { CONIC_COLORS, niceStep } from "./Shared";
import { toBn } from "@/lib/conics/format";

export type Marker = {
  x: number;
  y: number;
  color: string;
  label?: string;
  name?: string;
  placement?: "above-right" | "above-left" | "below-right" | "below-left";
};

export type Guide =
  | { kind: "vline"; x: number; color: string; dash?: string; width?: number }
  | { kind: "hline"; y: number; color: string; dash?: string; width?: number }
  | { kind: "segment"; x1: number; y1: number; x2: number; y2: number; color: string; width?: number; dash?: string }
  | { kind: "line"; a: number; b: number; c: number; color: string; width?: number; dash?: string };

export type Bounds = { xmin: number; xmax: number; ymin: number; ymax: number };

export type CurveSpec = {
  type: "parametric";
  sample: (t: number) => [number, number];
  tStart: number;
  tEnd: number;
  n?: number;
} | {
  type: "yOfX";
  fn: (x: number) => number | null;
} | {
  type: "xOfY";
  fn: (y: number) => number | null;
};

type Rect = { x: number; y: number; w: number; h: number };

const rectsOverlap = (a: Rect, b: Rect) =>
  !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);

export function ConicGraph({
  bounds,
  curves,
  guides = [],
  markers = [],
  ariaLabel = "গ্রাফ",
  showOrigin = true,
  curveColor,
}: {
  bounds: Bounds;
  curves: CurveSpec[];
  guides?: Guide[];
  markers?: Marker[];
  ariaLabel?: string;
  showOrigin?: boolean;
  curveColor?: string;
}) {
  const W = 820;
  const H = 720;
  const pad = 44;
  const innerW = W - 2 * pad;
  const innerH = H - 2 * pad;

  const sx = (x: number) => pad + ((x - bounds.xmin) / (bounds.xmax - bounds.xmin)) * innerW;
  const sy = (y: number) => H - pad - ((y - bounds.ymin) / (bounds.ymax - bounds.ymin)) * innerH;

  const step = niceStep((bounds.xmax - bounds.xmin) / 10);
  const minor = step / 5;
  const majorX: number[] = [];
  const majorY: number[] = [];
  const minorX: number[] = [];
  const minorY: number[] = [];
  for (let x = Math.ceil(bounds.xmin / step) * step; x <= bounds.xmax + 1e-9; x += step) majorX.push(+x.toFixed(4));
  for (let y = Math.ceil(bounds.ymin / step) * step; y <= bounds.ymax + 1e-9; y += step) majorY.push(+y.toFixed(4));
  for (let x = Math.ceil(bounds.xmin / minor) * minor; x <= bounds.xmax + 1e-9; x += minor) {
    const v = +x.toFixed(4);
    if (majorX.every((m) => Math.abs(m - v) > 1e-6)) minorX.push(v);
  }
  for (let y = Math.ceil(bounds.ymin / minor) * minor; y <= bounds.ymax + 1e-9; y += minor) {
    const v = +y.toFixed(4);
    if (majorY.every((m) => Math.abs(m - v) > 1e-6)) minorY.push(v);
  }

  const paths = useMemo(() => {
    return curves.map((c) => {
      const pts: [number, number][] = [];
      const N = 400;
      if (c.type === "parametric") {
        const nn = c.n ?? N;
        for (let i = 0; i <= nn; i++) {
          const t = c.tStart + (i / nn) * (c.tEnd - c.tStart);
          const p = c.sample(t);
          if (isFinite(p[0]) && isFinite(p[1])) pts.push(p);
        }
      } else if (c.type === "yOfX") {
        for (let i = 0; i <= N; i++) {
          const x = bounds.xmin + (i / N) * (bounds.xmax - bounds.xmin);
          const y = c.fn(x);
          if (y != null && isFinite(y)) pts.push([x, y]);
        }
      } else {
        for (let i = 0; i <= N; i++) {
          const y = bounds.ymin + (i / N) * (bounds.ymax - bounds.ymin);
          const x = c.fn(y);
          if (x != null && isFinite(x)) pts.push([x, y]);
        }
      }
      let d = "";
      let started = false;
      for (const p of pts) {
        const px = sx(p[0]);
        const py = sy(p[1]);
        if (p[0] < bounds.xmin || p[0] > bounds.xmax || p[1] < bounds.ymin || p[1] > bounds.ymax) {
          started = false;
          continue;
        }
        d += started ? `L${px.toFixed(2)},${py.toFixed(2)} ` : `M${px.toFixed(2)},${py.toFixed(2)} `;
        started = true;
      }
      return d;
    });
  }, [curves, bounds]);

  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const [drawKey, setDrawKey] = useState(0);
  useEffect(() => setDrawKey((k) => k + 1), [paths.join("|")]);

  const originInView =
    showOrigin &&
    bounds.xmin <= 0 && bounds.xmax >= 0 && bounds.ymin <= 0 && bounds.ymax >= 0;
  const hasOriginMarker = markers.some((m) => Math.abs(m.x) < 1e-9 && Math.abs(m.y) < 1e-9);
  const fullMarkers: Marker[] =
    originInView && !hasOriginMarker
      ? [
          ...markers,
          {
            x: 0,
            y: 0,
            color: CONIC_COLORS.origin ?? "#0f172a",
            name: "মূলবিন্দু",
            label: "(০, ০)",
            placement: "below-left",
          },
        ]
      : markers;

  const labelPlan = useMemo(() => {
    const placements: Array<"above-right" | "above-left" | "below-right" | "below-left"> = [
      "above-right",
      "above-left",
      "below-right",
      "below-left",
    ];
    const offsets = [12, 26, 44, 64];
    const dotClearance = 10;
    const boxH = 22;
    const placed: Rect[] = [];
    const results: Array<{
      show: boolean;
      tx: number;
      ty: number;
      rectX: number;
      rectY: number;
      w: number;
      lines: string[];
    }> = [];

    for (const m of fullMarkers) {
      const px = sx(m.x);
      const py = sy(m.y);
      const lines: string[] = [];
      if (m.name) lines.push(m.name);
      if (m.label) lines.push(m.label);
      if (!lines.length) {
        results.push({ show: false, tx: px, ty: py, rectX: px, rectY: py, w: 0, lines: [] });
        continue;
      }
      const maxChars = Math.max(...lines.map((l) => Array.from(l).length));
      const w = Math.max(56, maxChars * 8 + 18);
      const h = lines.length * 15 + 10;

      const preferred = m.placement ?? "above-right";
      const ordered = [preferred, ...placements.filter((p) => p !== preferred)];

      let chosen: { tx: number; ty: number; rx: number; ry: number } | null = null;
      for (const off of offsets) {
        for (const p of ordered) {
          const left = p.endsWith("left");
          const below = p.startsWith("below");
          const tx = left ? px - w - off : px + off;
          const ty = below ? py + off : py - off;
          const rx = tx - 3;
          const ry = ty - boxH + 6;
          if (rx < pad + 2 || rx + w > W - pad - 2 || ry < pad + 2 || ry + h > H - pad - 2) continue;
          const rect: Rect = { x: rx, y: ry, w, h };
          const dotRect: Rect = { x: px - dotClearance, y: py - dotClearance, w: dotClearance * 2, h: dotClearance * 2 };
          if (rectsOverlap(rect, dotRect)) continue;
          if (placed.some((r) => rectsOverlap(r, rect))) continue;
          chosen = { tx, ty, rx, ry };
          placed.push(rect);
          break;
        }
        if (chosen) break;
      }
      if (!chosen) {
        results.push({ show: false, tx: px, ty: py, rectX: px, rectY: py, w, lines });
      } else {
        results.push({ show: true, tx: chosen.tx, ty: chosen.ty, rectX: chosen.rx, rectY: chosen.ry, w, lines });
      }
    }
    return results;
  }, [fullMarkers, bounds]);

  return (
    <div className="graph-wrap">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        className="graph-svg"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id="paperGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbfaf5" />
            <stop offset="100%" stopColor="#f5f2e6" />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={W} height={H} fill={CONIC_COLORS.paperBg} rx={18} />
        <rect
          x={pad}
          y={pad}
          width={innerW}
          height={innerH}
          fill="url(#paperGrad)"
          stroke={CONIC_COLORS.paperBorder}
          strokeWidth={1.2}
          rx={10}
        />

        {minorX.map((x) => (
          <line
            key={`mnx${x}`}
            x1={sx(x)}
            x2={sx(x)}
            y1={pad}
            y2={H - pad}
            stroke="#e6dfc7"
            strokeWidth={0.6}
          />
        ))}
        {minorY.map((y) => (
          <line
            key={`mny${y}`}
            y1={sy(y)}
            y2={sy(y)}
            x1={pad}
            x2={W - pad}
            stroke="#e6dfc7"
            strokeWidth={0.6}
          />
        ))}
        {majorX.map((x) => (
          <line
            key={`vx${x}`}
            x1={sx(x)}
            x2={sx(x)}
            y1={pad}
            y2={H - pad}
            stroke={x === 0 ? CONIC_COLORS.axisLine : "#cabf94"}
            strokeWidth={x === 0 ? 1.8 : 0.9}
          />
        ))}
        {majorY.map((y) => (
          <line
            key={`hy${y}`}
            y1={sy(y)}
            y2={sy(y)}
            x1={pad}
            x2={W - pad}
            stroke={y === 0 ? CONIC_COLORS.axisLine : "#cabf94"}
            strokeWidth={y === 0 ? 1.8 : 0.9}
          />
        ))}

        {majorX.map((x) =>
          x !== 0 && bounds.ymin <= 0 && bounds.ymax >= 0 ? (
            <text key={`tx${x}`} x={sx(x)} y={sy(0) + 16} className="axis-tick" textAnchor="middle">
              {toBn(x)}
            </text>
          ) : null,
        )}
        {majorY.map((y) =>
          y !== 0 && bounds.xmin <= 0 && bounds.xmax >= 0 ? (
            <text key={`ty${y}`} x={sx(0) - 8} y={sy(y) + 4} className="axis-tick" textAnchor="end">
              {toBn(y)}
            </text>
          ) : null,
        )}
        <text x={W - pad - 6} y={(bounds.ymin <= 0 && bounds.ymax >= 0 ? sy(0) : pad + 16) - 8} className="axis-name" textAnchor="end">
          x
        </text>
        <text x={(bounds.xmin <= 0 && bounds.xmax >= 0 ? sx(0) : W - pad - 16) + 8} y={pad + 14} className="axis-name">
          y
        </text>

        {guides.map((g, i) => {
          if (g.kind === "vline")
            return (
              <line
                key={`g${i}`}
                x1={sx(g.x)}
                x2={sx(g.x)}
                y1={pad}
                y2={H - pad}
                stroke={g.color}
                strokeWidth={g.width ?? 2}
                strokeDasharray={g.dash ?? "6 5"}
              />
            );
          if (g.kind === "hline")
            return (
              <line
                key={`g${i}`}
                y1={sy(g.y)}
                y2={sy(g.y)}
                x1={pad}
                x2={W - pad}
                stroke={g.color}
                strokeWidth={g.width ?? 2}
                strokeDasharray={g.dash ?? "6 5"}
              />
            );
          if (g.kind === "line") {
            const hits: [number, number][] = [];
            const inX = (x: number) => x >= bounds.xmin - 1e-9 && x <= bounds.xmax + 1e-9;
            const inY = (y: number) => y >= bounds.ymin - 1e-9 && y <= bounds.ymax + 1e-9;
            if (Math.abs(g.b) > 1e-12) {
              const y1 = (-g.c - g.a * bounds.xmin) / g.b;
              const y2 = (-g.c - g.a * bounds.xmax) / g.b;
              if (inY(y1)) hits.push([bounds.xmin, y1]);
              if (inY(y2)) hits.push([bounds.xmax, y2]);
            }
            if (Math.abs(g.a) > 1e-12) {
              const x1 = (-g.c - g.b * bounds.ymin) / g.a;
              const x2 = (-g.c - g.b * bounds.ymax) / g.a;
              if (inX(x1)) hits.push([x1, bounds.ymin]);
              if (inX(x2)) hits.push([x2, bounds.ymax]);
            }
            if (hits.length < 2) return null;
            const p1 = hits[0];
            const p2 = hits[hits.length - 1];
            return (
              <line
                key={`g${i}`}
                x1={sx(p1[0])}
                y1={sy(p1[1])}
                x2={sx(p2[0])}
                y2={sy(p2[1])}
                stroke={g.color}
                strokeWidth={g.width ?? 2}
                strokeDasharray={g.dash ?? "6 5"}
                strokeLinecap="round"
              />
            );
          }
          return (
            <line
              key={`g${i}`}
              x1={sx(g.x1)}
              y1={sy(g.y1)}
              x2={sx(g.x2)}
              y2={sy(g.y2)}
              stroke={g.color}
              strokeWidth={g.width ?? 2}
              strokeDasharray={g.dash ?? ""}
            />
          );
        })}

        {paths.map((d, i) => (
          <path
            key={`p${drawKey}-${i}`}
            ref={(el) => {
              pathRefs.current[i] = el;
            }}
            d={d}
            pathLength={1000}
            fill="none"
            stroke={curveColor ?? CONIC_COLORS.curve}
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 1000,
              strokeDashoffset: 1000,
              animation: "draw 1400ms cubic-bezier(.7,.05,.2,1) forwards",
              filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.08))",
            }}
          />
        ))}

        {fullMarkers.map((m, i) => {
          const px = sx(m.x);
          const py = sy(m.y);
          const plan = labelPlan[i];
          return (
            <g key={`m${i}`} className="point-group" style={{ animationDelay: `${700 + i * 90}ms` }}>
              <circle cx={px} cy={py} r={10} fill={m.color} opacity={0.14} />
              <circle cx={px} cy={py} r={6.5} fill="white" stroke={m.color} strokeWidth={2.4} />
              <circle cx={px} cy={py} r={3} fill={m.color} />
              {plan?.show && plan.lines.length > 0 && (
                <g transform={`translate(${plan.tx}, ${plan.ty})`}>
                  <line
                    x1={m.placement?.endsWith("left") ? plan.w : 0}
                    y1={m.placement?.startsWith("below") ? -6 : 6}
                    x2={px - plan.tx}
                    y2={py - plan.ty}
                    stroke={m.color}
                    strokeWidth={1}
                    strokeDasharray="2 3"
                    opacity={0.55}
                  />
                  <rect
                    x={-3}
                    y={-15}
                    rx={7}
                    ry={7}
                    width={plan.w}
                    height={plan.lines.length * 15 + 8}
                    fill="white"
                    stroke={m.color}
                    strokeWidth={1.2}
                    opacity={0.97}
                  />
                  {plan.lines.map((ln, k) => (
                    <text
                      key={k}
                      x={7}
                      y={-1 + k * 15}
                      fontSize={k === 0 ? 12 : 11}
                      fontWeight={k === 0 ? 700 : 500}
                      fill={m.color}
                      className="pt-label"
                    >
                      {ln}
                    </text>
                  ))}
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
