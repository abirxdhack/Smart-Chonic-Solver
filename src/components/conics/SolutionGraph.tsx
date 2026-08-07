import { trs } from "@/i18n";
import { useMemo } from "react";
import { ConicGraph, type Guide, type Marker } from "@/components/conics/ConicGraph";
import { ADV_COLORS } from "@/components/conics/ParabolaGraph";
import type { CentralSolution, ParabolaSolution } from "@/lib/conics/general-solver";

const f = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));
const pt = (x: number, y: number) => `(${f(x)}, ${f(y)})`;

export function SolutionGraph({ solution }: { solution: ParabolaSolution | CentralSolution }) {
  const model = useMemo(() => {
    const guides: Guide[] = [];
    const markers: Marker[] = [];

    if (solution.kind === "parabola") {
      const { orientation, A, alpha, beta } = solution;
      const abs = Math.abs(A);
      const focus: [number, number] = orientation === "x" ? [alpha + A, beta] : [alpha, beta + A];
      const dirFoot: [number, number] = orientation === "x" ? [alpha - A, beta] : [alpha, beta - A];
      const l1: [number, number] =
        orientation === "x" ? [alpha + A, beta + 2 * abs] : [alpha + 2 * abs, beta + A];
      const l2: [number, number] =
        orientation === "x" ? [alpha + A, beta - 2 * abs] : [alpha - 2 * abs, beta + A];
      const span = Math.max(6 * abs, 6);
      const bounds = {
        xmin: alpha - span,
        xmax: alpha + span,
        ymin: beta - span,
        ymax: beta + span,
      };
      if (orientation === "x") {
        guides.push({ kind: "hline", y: beta, color: ADV_COLORS.axis, dash: "3 5", width: 1.8 });
        guides.push({
          kind: "vline",
          x: alpha - A,
          color: ADV_COLORS.directrix,
          dash: "9 6",
          width: 2.4,
        });
      } else {
        guides.push({ kind: "vline", x: alpha, color: ADV_COLORS.axis, dash: "3 5", width: 1.8 });
        guides.push({
          kind: "hline",
          y: beta - A,
          color: ADV_COLORS.directrix,
          dash: "9 6",
          width: 2.4,
        });
      }
      guides.push({
        kind: "segment",
        x1: l1[0],
        y1: l1[1],
        x2: l2[0],
        y2: l2[1],
        color: ADV_COLORS.latus,
        width: 3,
      });
      markers.push({
        x: alpha,
        y: beta,
        color: ADV_COLORS.vertex,
        name: trs("শীর্ষ"),
        label: pt(alpha, beta),
        placement: "above-left",
      });
      markers.push({
        x: focus[0],
        y: focus[1],
        color: ADV_COLORS.focus,
        name: trs("উপকেন্দ্র"),
        label: pt(focus[0], focus[1]),
        placement: "below-right",
      });
      markers.push({
        x: dirFoot[0],
        y: dirFoot[1],
        color: ADV_COLORS.directrix,
        name: trs("নিয়ামক পাদবিন্দু"),
        label: pt(dirFoot[0], dirFoot[1]),
        placement: "below-left",
      });
      markers.push({
        x: l1[0],
        y: l1[1],
        color: ADV_COLORS.latus,
        name: trs("লম্বের প্রান্ত"),
        label: pt(l1[0], l1[1]),
        placement: "above-right",
      });
      markers.push({
        x: l2[0],
        y: l2[1],
        color: ADV_COLORS.latus,
        name: trs("লম্বের প্রান্ত"),
        label: pt(l2[0], l2[1]),
        placement: "below-right",
      });
      const T = Math.sqrt(Math.max(span / Math.max(abs, 1e-6), 1)) * 2 + 4;
      const sample = (t: number): [number, number] =>
        orientation === "x"
          ? [alpha + A * t * t, beta + 2 * A * t]
          : [alpha + 2 * A * t, beta + A * t * t];
      return {
        bounds,
        guides,
        markers,
        curves: [{ type: "parametric" as const, sample, tStart: -T, tEnd: T, n: 600 }],
      };
    }

    const { orientation, a, b, c, e, alpha, beta } = solution;
    const horiz = orientation === "horizontal";
    const isEllipse = solution.kind === "ellipse";
    const span = Math.max(a, b, c) * 2.1;
    const bounds = { xmin: alpha - span, xmax: alpha + span, ymin: beta - span, ymax: beta + span };
    const f1: [number, number] = horiz ? [alpha - c, beta] : [alpha, beta - c];
    const f2: [number, number] = horiz ? [alpha + c, beta] : [alpha, beta + c];
    const vA = isEllipse ? a : a;
    const v1: [number, number] = horiz ? [alpha - vA, beta] : [alpha, beta - vA];
    const v2: [number, number] = horiz ? [alpha + vA, beta] : [alpha, beta + vA];

    if (horiz) {
      guides.push({ kind: "hline", y: beta, color: ADV_COLORS.axis, dash: "3 5", width: 1.6 });
      guides.push({ kind: "vline", x: alpha, color: ADV_COLORS.axis, dash: "2 6", width: 1.2 });
      guides.push({
        kind: "vline",
        x: alpha - vA / e,
        color: ADV_COLORS.directrix,
        dash: "9 6",
        width: 2,
      });
      guides.push({
        kind: "vline",
        x: alpha + vA / e,
        color: ADV_COLORS.directrix,
        dash: "9 6",
        width: 2,
      });
    } else {
      guides.push({ kind: "vline", x: alpha, color: ADV_COLORS.axis, dash: "3 5", width: 1.6 });
      guides.push({ kind: "hline", y: beta, color: ADV_COLORS.axis, dash: "2 6", width: 1.2 });
      guides.push({
        kind: "hline",
        y: beta - vA / e,
        color: ADV_COLORS.directrix,
        dash: "9 6",
        width: 2,
      });
      guides.push({
        kind: "hline",
        y: beta + vA / e,
        color: ADV_COLORS.directrix,
        dash: "9 6",
        width: 2,
      });
    }
    if (!isEllipse) {
      const m = horiz ? b / a : a / b;
      guides.push({
        kind: "line",
        a: m,
        b: -1,
        c: beta - m * alpha,
        color: ADV_COLORS.axis,
        dash: "6 6",
        width: 1.6,
      });
      guides.push({
        kind: "line",
        a: -m,
        b: -1,
        c: beta + m * alpha,
        color: ADV_COLORS.axis,
        dash: "6 6",
        width: 1.6,
      });
    }
    markers.push({
      x: alpha,
      y: beta,
      color: ADV_COLORS.vertex,
      name: trs("কেন্দ্র"),
      label: pt(alpha, beta),
      placement: "above-left",
    });
    markers.push({
      x: v1[0],
      y: v1[1],
      color: ADV_COLORS.curve,
      name: trs("শীর্ষ"),
      label: pt(v1[0], v1[1]),
      placement: "below-left",
    });
    markers.push({
      x: v2[0],
      y: v2[1],
      color: ADV_COLORS.curve,
      name: trs("শীর্ষ"),
      label: pt(v2[0], v2[1]),
      placement: "above-right",
    });
    markers.push({
      x: f1[0],
      y: f1[1],
      color: ADV_COLORS.focus,
      name: trs("ফোকাস"),
      label: pt(f1[0], f1[1]),
      placement: "below-right",
    });
    markers.push({
      x: f2[0],
      y: f2[1],
      color: ADV_COLORS.focus,
      name: trs("ফোকাস"),
      label: pt(f2[0], f2[1]),
      placement: "above-right",
    });

    if (isEllipse) {
      const rx = horiz ? a : b;
      const ry = horiz ? b : a;
      return {
        bounds,
        guides,
        markers,
        curves: [
          {
            type: "parametric" as const,
            sample: (t: number): [number, number] => [
              alpha + rx * Math.cos(t),
              beta + ry * Math.sin(t),
            ],
            tStart: 0,
            tEnd: Math.PI * 2,
            n: 720,
          },
        ],
      };
    }

    const T = 2.2;
    const curves = [
      {
        type: "parametric" as const,
        sample: (t: number): [number, number] =>
          horiz
            ? [alpha + a * Math.cosh(t), beta + b * Math.sinh(t)]
            : [alpha + b * Math.sinh(t), beta + a * Math.cosh(t)],
        tStart: -T,
        tEnd: T,
        n: 500,
      },
      {
        type: "parametric" as const,
        sample: (t: number): [number, number] =>
          horiz
            ? [alpha - a * Math.cosh(t), beta + b * Math.sinh(t)]
            : [alpha + b * Math.sinh(t), beta - a * Math.cosh(t)],
        tStart: -T,
        tEnd: T,
        n: 500,
      },
    ];
    return { bounds, guides, markers, curves };
  }, [solution]);

  return (
    <ConicGraph
      bounds={model.bounds}
      curves={model.curves}
      guides={model.guides}
      markers={model.markers}
      curveColor={ADV_COLORS.curve}
      ariaLabel={trs("সমাধানের লেখচিত্র")}
    />
  );
}
