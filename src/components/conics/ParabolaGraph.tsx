import { useMemo } from "react";
import {
  footOnDirectrix,
  pointOnParabola,
  fmt,
  type AdvResult,
  type Pt,
} from "@/lib/conics/adv-parabola";
import { ConicGraph, type Guide, type Marker } from "@/components/conics/ConicGraph";

export const ADV_COLORS = {
  curve: "#4338ca",
  focus: "#f59e0b",
  vertex: "#dc2626",
  directrix: "#16a34a",
  axis: "#7c3aed",
  latus: "#db2777",
  focal: "#0891b2",
};

const pt = (p: Pt) => `(${fmt(p[0])}, ${fmt(p[1])})`;

export function ParabolaGraph({ res }: { res: AdvResult }) {
  const model = useMemo(() => {
    const P = pointOnParabola(res, 2.6 * res.a);
    const M = footOnDirectrix(P, res.directrix);
    const dirFoot = footOnDirectrix(res.vertex, res.directrix);
    const key: Pt[] = [
      res.focus,
      res.vertex,
      res.latusEnds[0],
      res.latusEnds[1],
      dirFoot,
      P,
      M,
      [0, 0],
    ];
    const xs = key.map((p) => p[0]);
    const ys = key.map((p) => p[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    const span =
      Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys), 2 * res.a, 4) *
      0.85;
    const bounds = { xmin: cx - span, xmax: cx + span, ymin: cy - span, ymax: cy + span };

    const guides: Guide[] = [
      { kind: "line", a: res.directrix.a, b: res.directrix.b, c: res.directrix.c, color: ADV_COLORS.directrix, dash: "9 6", width: 2.4 },
      { kind: "line", a: res.axis.a, b: res.axis.b, c: res.axis.c, color: ADV_COLORS.axis, dash: "3 5", width: 1.8 },
      {
        kind: "segment",
        x1: res.latusEnds[0][0],
        y1: res.latusEnds[0][1],
        x2: res.latusEnds[1][0],
        y2: res.latusEnds[1][1],
        color: ADV_COLORS.latus,
        width: 3,
      },
      { kind: "segment", x1: res.focus[0], y1: res.focus[1], x2: P[0], y2: P[1], color: ADV_COLORS.focal, width: 2.4 },
      { kind: "segment", x1: P[0], y1: P[1], x2: M[0], y2: M[1], color: ADV_COLORS.focal, width: 2, dash: "5 4" },
    ];

    const markers: Marker[] = [
      { x: res.vertex[0], y: res.vertex[1], color: ADV_COLORS.vertex, name: "শীর্ষ A", label: pt(res.vertex), placement: "above-left" },
      { x: res.focus[0], y: res.focus[1], color: ADV_COLORS.focus, name: "উপকেন্দ্র S", label: pt(res.focus), placement: "below-right" },
      { x: dirFoot[0], y: dirFoot[1], color: ADV_COLORS.directrix, name: "নিয়ামক পাদবিন্দু", label: pt(dirFoot), placement: "below-left" },
      { x: res.latusEnds[0][0], y: res.latusEnds[0][1], color: ADV_COLORS.latus, name: "লম্বের প্রান্ত", label: pt(res.latusEnds[0]), placement: "above-right" },
      { x: res.latusEnds[1][0], y: res.latusEnds[1][1], color: ADV_COLORS.latus, name: "লম্বের প্রান্ত", label: pt(res.latusEnds[1]), placement: "below-right" },
      { x: P[0], y: P[1], color: ADV_COLORS.focal, name: `P · SP = PM = ${fmt(Math.hypot(P[0] - res.focus[0], P[1] - res.focus[1]))}`, label: pt(P), placement: "above-right" },
      { x: M[0], y: M[1], color: ADV_COLORS.focal, name: "M", label: pt(M), placement: "below-left" },
    ];

    const reach = span * 3;
    const T = 2 * Math.sqrt(Math.max(res.a, 1e-6) * reach) + 4 * res.a;

    return { bounds, guides, markers, T };
  }, [res]);

  return (
    <ConicGraph
      bounds={model.bounds}
      curves={[
        {
          type: "parametric",
          sample: (t: number) => pointOnParabola(res, t),
          tStart: -model.T,
          tEnd: model.T,
          n: 600,
        },
      ]}
      guides={model.guides}
      markers={model.markers}
      curveColor={ADV_COLORS.curve}
      ariaLabel="পরাবৃত্তের লেখচিত্র"
    />
  );
}
