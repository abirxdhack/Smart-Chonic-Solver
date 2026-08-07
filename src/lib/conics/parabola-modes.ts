import { trs, trt } from "@/i18n";
import { coefsFromEquation } from "./general-solver";
import {
  fmt,
  lineTex,
  parseLine,
  renumber,
  solveAdvanced,
  type AdvResult,
  type Fact,
  type Line,
  type Pt,
  type StepBlock,
} from "./adv-parabola";

export type FieldDef = {
  key: string;
  label: string;
  kind: "number" | "text" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  init?: string;
  samples?: string[];
};

export type ModeDef = {
  id: string;
  group: string;
  label: string;
  hint: string;
  fields: FieldDef[];
};

export type Extra =
  | { kind: "point"; p: Pt; name: string; color: string }
  | { kind: "line"; line: Line; name: string; color: string; dash?: string }
  | { kind: "segment"; from: Pt; to: Pt; name: string; color: string; dash?: string };

export type ModeSolution = {
  res: AdvResult;
  extras: Extra[];
  steps: StepBlock[];
  facts: Fact[];
};

export type Values = Record<string, string>;

const EPS = 1e-9;
const COLOR = {
  given: "#0ea5e9",
  tangent: "#f97316",
  normal: "#8b5cf6",
  alt: "#14b8a6",
  contact: "#e11d48",
};

function signed(n: number): string {
  return n < 0 ? `- ${fmt(Math.abs(n))}` : `+ ${fmt(n)}`;
}

const P = (p: Pt) => `(${fmt(p[0])},\\; ${fmt(p[1])})`;

function num(v: Values, key: string, label: string): number {
  const raw = (v[key] ?? "").trim();
  const parsed = Number(raw.replace(/−/g, "-"));
  if (!raw || !isFinite(parsed)) throw new Error(trt`${label} সঠিকভাবে লিখুন`);
  return parsed;
}

function point(v: Values, kx: string, ky: string, label: string): Pt {
  return [num(v, kx, trt`${label} এর x`), num(v, ky, trt`${label} এর y`)];
}

function line(v: Values, key: string, label: string): Line {
  const raw = (v[key] ?? "").trim();
  if (!raw) throw new Error(trt`${label} লিখুন`);
  return parseLine(raw);
}

function unit(p: Pt): Pt {
  const n = Math.hypot(p[0], p[1]);
  if (n < EPS) throw new Error(trs("দিক নির্ণয় করা যায়নি"));
  return [p[0] / n, p[1] / n];
}

function lineThrough(p: Pt, normal: Pt): Line {
  return { a: normal[0], b: normal[1], c: -(normal[0] * p[0] + normal[1] * p[1]) };
}

function intersect(l1: Line, l2: Line): Pt {
  const det = l1.a * l2.b - l2.a * l1.b;
  if (Math.abs(det) < 1e-12) throw new Error(trs("রেখা দুটি ছেদ করে না (সমান্তরাল)"));
  return [(l1.b * l2.c - l2.b * l1.c) / det, (l2.a * l1.c - l1.a * l2.c) / det];
}

function footOnLine(p: Pt, l: Line): Pt {
  const k = l.a * l.a + l.b * l.b;
  const t = (l.a * p[0] + l.b * p[1] + l.c) / k;
  return [p[0] - l.a * t, p[1] - l.b * t];
}

function solve3(m: number[][], r: number[]): number[] {
  const a = m.map((row, i) => [...row, r[i]]);
  for (let i = 0; i < 3; i++) {
    let piv = i;
    for (let j = i + 1; j < 3; j++) if (Math.abs(a[j][i]) > Math.abs(a[piv][i])) piv = j;
    if (Math.abs(a[piv][i]) < 1e-12)
      throw new Error(trs("প্রদত্ত বিন্দুগুলো থেকে অদ্বিতীয় সমাধান পাওয়া যায় না"));
    [a[i], a[piv]] = [a[piv], a[i]];
    for (let j = 0; j < 3; j++) {
      if (j === i) continue;
      const f = a[j][i] / a[i][i];
      for (let c = i; c < 4; c++) a[j][c] -= f * a[i][c];
    }
  }
  return [a[0][3] / a[0][0], a[1][3] / a[1][1], a[2][3] / a[2][2]];
}

function quadRoots(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return [];
    return [-c / b];
  }
  const d = b * b - 4 * a * c;
  if (d < -1e-9) return [];
  const s = Math.sqrt(Math.max(d, 0));
  return d < 1e-9 ? [-b / (2 * a)] : [(-b + s) / (2 * a), (-b - s) / (2 * a)];
}

function polyRoots(coefs: number[]): number[] {
  const c = [...coefs];
  while (c.length > 1 && Math.abs(c[0]) < 1e-12) c.shift();
  const n = c.length - 1;
  if (n < 1) return [];
  const norm = c.map((v) => v / c[0]);
  let re = Array.from({ length: n }, (_, i) => Math.cos((2 * Math.PI * i) / n + 0.4) * 0.9);
  let im = Array.from({ length: n }, (_, i) => Math.sin((2 * Math.PI * i) / n + 0.4) * 0.9);
  for (let iter = 0; iter < 600; iter++) {
    const nre = [...re];
    const nim = [...im];
    for (let i = 0; i < n; i++) {
      let pr = 1;
      let pi = 0;
      for (let k = 1; k <= n; k++) {
        const t = pr * re[i] - pi * im[i] + norm[k];
        pi = pr * im[i] + pi * re[i];
        pr = t;
      }
      let dr = 1;
      let di = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const ar = re[i] - re[j];
        const ai = im[i] - im[j];
        const t = dr * ar - di * ai;
        di = dr * ai + di * ar;
        dr = t;
      }
      const den = dr * dr + di * di;
      if (den < 1e-18) continue;
      nre[i] = re[i] - (pr * dr + pi * di) / den;
      nim[i] = im[i] - (pi * dr - pr * di) / den;
    }
    re = nre;
    im = nim;
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (Math.abs(im[i]) > 1e-5) continue;
    if (out.every((v) => Math.abs(v - re[i]) > 1e-5)) out.push(re[i]);
  }
  return out.sort((a, b) => a - b);
}

function fromFocusDirectrix(focus: Pt, directrix: Line): AdvResult {
  return solveAdvanced({ kind: "B", focus, directrix });
}

function fromVertexFocus(vertex: Pt, focus: Pt): AdvResult {
  return solveAdvanced({ kind: "D", vertex, focus });
}

function pack(res: AdvResult, pre: StepBlock[], extras: Extra[], facts: Fact[]): ModeSolution {
  const merged = renumber([...pre, ...res.steps]);
  return { res: { ...res, steps: merged }, extras, steps: merged, facts: [...facts, ...res.facts] };
}

function givenPoints(pts: { p: Pt; name: string }[]): Extra[] {
  return pts.map((g) => ({ kind: "point" as const, p: g.p, name: g.name, color: COLOR.given }));
}

function axisAlignedLocal(res: AdvResult) {
  const horizontal = Math.abs(res.u[1]) < 1e-7;
  const vertical = Math.abs(res.u[0]) < 1e-7;
  if (!horizontal && !vertical)
    throw new Error(trs("এই মোডে অক্ষ-সমান্তরাল পরাবৃত্ত প্রয়োজন (ঘূর্ণিত পরাবৃত্ত সমর্থিত নয়)"));
  const s = horizontal ? Math.sign(res.u[0]) : Math.sign(res.u[1]);
  return { horizontal, s, h: res.vertex[0], k: res.vertex[1], a: res.a };
}

export const MODES: ModeDef[] = [
  {
    id: "A",
    group: "মৌলিক",
    label: "আদর্শ / সাধারণ সমীকরণ",
    hint: "যেমন y² = 32x অথবা y = x² − 4x + 7",
    fields: [
      {
        key: "eq",
        label: "পরাবৃত্তের সমীকরণ",
        kind: "text",
        placeholder: "y^2 = 32x",
        samples: ["y^2 = 32x", "x^2 = 12y", "(y-3)^2 = 8(x+1)", "y = x^2 - 4x + 7"],
      },
    ],
  },
  {
    id: "B",
    group: "মৌলিক",
    label: "উপকেন্দ্র + নিয়ামক",
    hint: "S(x₁, y₁) এবং ax + by + c = 0",
    fields: [
      { key: "fx", label: "উপকেন্দ্র S এর x", kind: "number", placeholder: "x₁" },
      { key: "fy", label: "উপকেন্দ্র S এর y", kind: "number", placeholder: "y₁" },
      {
        key: "dir",
        label: "নিয়ামক রেখা",
        kind: "text",
        placeholder: "3x - 4y = 1",
        samples: ["3x - 4y = 1", "x + y = 2", "x = -3", "y = 4"],
      },
    ],
  },
  {
    id: "C",
    group: "মৌলিক",
    label: "শীর্ষ + নিয়ামক",
    hint: "A(h, k) এবং ax + by + c = 0",
    fields: [
      { key: "vx", label: "শীর্ষ A এর h", kind: "number", placeholder: "h" },
      { key: "vy", label: "শীর্ষ A এর k", kind: "number", placeholder: "k" },
      {
        key: "dir",
        label: "নিয়ামক রেখা",
        kind: "text",
        placeholder: "x = -3",
        samples: ["x = -3", "y = 4", "x + y = 2"],
      },
    ],
  },
  {
    id: "D",
    group: "মৌলিক",
    label: "উপকেন্দ্র + শীর্ষ",
    hint: "S(x₁, y₁) এবং A(h, k)",
    fields: [
      { key: "fx", label: "উপকেন্দ্র S এর x", kind: "number", placeholder: "x₁" },
      { key: "fy", label: "উপকেন্দ্র S এর y", kind: "number", placeholder: "y₁" },
      { key: "vx", label: "শীর্ষ A এর h", kind: "number", placeholder: "h" },
      { key: "vy", label: "শীর্ষ A এর k", kind: "number", placeholder: "k" },
    ],
  },
  {
    id: "VP_DIRX",
    group: "শীর্ষভিত্তিক",
    label: "শীর্ষ + গমনকারী বিন্দু (নিয়ামক X-অক্ষের সমান্তরাল)",
    hint: "(x − h)² = 4a(y − k) আকার",
    fields: [
      { key: "vx", label: "শীর্ষ h", kind: "number", placeholder: "h" },
      { key: "vy", label: "শীর্ষ k", kind: "number", placeholder: "k" },
      { key: "px", label: "বিন্দুর x₁", kind: "number", placeholder: "x₁" },
      { key: "py", label: "বিন্দুর y₁", kind: "number", placeholder: "y₁" },
    ],
  },
  {
    id: "VZ",
    group: "শীর্ষভিত্তিক",
    label: "শীর্ষ + অক্ষ ও নিয়ামকের ছেদবিন্দু Z",
    hint: "A(h, k) এবং Z(x_z, y_z)",
    fields: [
      { key: "vx", label: "শীর্ষ h", kind: "number", placeholder: "h" },
      { key: "vy", label: "শীর্ষ k", kind: "number", placeholder: "k" },
      { key: "zx", label: "Z এর x", kind: "number", placeholder: "x_z" },
      { key: "zy", label: "Z এর y", kind: "number", placeholder: "y_z" },
    ],
  },
  {
    id: "VLR",
    group: "শীর্ষভিত্তিক",
    label: "শীর্ষ + উপকেন্দ্রিক লম্বের দৈর্ঘ্য",
    hint: "4a এবং দিক নির্বাচন",
    fields: [
      { key: "vx", label: "শীর্ষ h", kind: "number", placeholder: "h" },
      { key: "vy", label: "শীর্ষ k", kind: "number", placeholder: "k" },
      { key: "lr", label: "উপকেন্দ্রিক লম্ব 4a", kind: "number", placeholder: "4a" },
      {
        key: "orient",
        label: "দিক",
        kind: "select",
        init: "right",
        options: [
          { value: "right", label: "ডানে (অক্ষ X-অক্ষের সমান্তরাল)" },
          { value: "left", label: "বামে (অক্ষ X-অক্ষের সমান্তরাল)" },
          { value: "up", label: "উপরে (অক্ষ Y-অক্ষের সমান্তরাল)" },
          { value: "down", label: "নিচে (অক্ষ Y-অক্ষের সমান্তরাল)" },
        ],
      },
    ],
  },
  {
    id: "VP_YAXIS",
    group: "শীর্ষভিত্তিক",
    label: "শীর্ষ (0, k) + গমনকারী বিন্দু (অক্ষ Y-অক্ষে)",
    hint: "x² = 4a(y − k) আকার",
    fields: [
      { key: "vy", label: "শীর্ষ k", kind: "number", placeholder: "k" },
      { key: "px", label: "বিন্দুর x₁", kind: "number", placeholder: "x₁" },
      { key: "py", label: "বিন্দুর y₁", kind: "number", placeholder: "y₁" },
    ],
  },
  {
    id: "P3_X",
    group: "বিন্দুভিত্তিক",
    label: "তিনটি বিন্দু (অক্ষ X-অক্ষের সমান্তরাল)",
    hint: "x = ay² + by + c",
    fields: [
      { key: "x1", label: "x₁", kind: "number" },
      { key: "y1", label: "y₁", kind: "number" },
      { key: "x2", label: "x₂", kind: "number" },
      { key: "y2", label: "y₂", kind: "number" },
      { key: "x3", label: "x₃", kind: "number" },
      { key: "y3", label: "y₃", kind: "number" },
    ],
  },
  {
    id: "P3_Y",
    group: "বিন্দুভিত্তিক",
    label: "তিনটি বিন্দু (অক্ষ Y-অক্ষের সমান্তরাল)",
    hint: "y = ax² + bx + c",
    fields: [
      { key: "x1", label: "x₁", kind: "number" },
      { key: "y1", label: "y₁", kind: "number" },
      { key: "x2", label: "x₂", kind: "number" },
      { key: "y2", label: "y₂", kind: "number" },
      { key: "x3", label: "x₃", kind: "number" },
      { key: "y3", label: "y₃", kind: "number" },
    ],
  },
  {
    id: "P2_VONY",
    group: "বিন্দুভিত্তিক",
    label: "অক্ষ X-অক্ষের সমান্তরাল + শীর্ষ Y-অক্ষে + দুই বিন্দু",
    hint: "(y − k)² = 4a x",
    fields: [
      { key: "x1", label: "x₁", kind: "number" },
      { key: "y1", label: "y₁", kind: "number" },
      { key: "x2", label: "x₂", kind: "number" },
      { key: "y2", label: "y₂", kind: "number" },
      {
        key: "branch",
        label: "সমাধান নির্বাচন",
        kind: "select",
        init: "1",
        options: [
          { value: "1", label: "প্রথম সম্ভাব্য মান" },
          { value: "2", label: "দ্বিতীয় সম্ভাব্য মান" },
        ],
      },
    ],
  },
  {
    id: "P2_AXISX",
    group: "বিন্দুভিত্তিক",
    label: "অক্ষ X-অক্ষের উপর + দুই বিন্দু",
    hint: "y² = 4a(x − h)",
    fields: [
      { key: "x1", label: "x₁", kind: "number" },
      { key: "y1", label: "y₁", kind: "number" },
      { key: "x2", label: "x₂", kind: "number" },
      { key: "y2", label: "y₂", kind: "number" },
    ],
  },
  {
    id: "LR_EQ",
    group: "উপকেন্দ্রিক লম্ব",
    label: "উপকেন্দ্রিক লম্বের প্রান্তবিন্দু → পরাবৃত্তের সমীকরণ",
    hint: "দুইটি সম্ভাব্য পরাবৃত্ত",
    fields: [
      { key: "x1", label: "L₁ এর x", kind: "number" },
      { key: "y1", label: "L₁ এর y", kind: "number" },
      { key: "x2", label: "L₂ এর x", kind: "number" },
      { key: "y2", label: "L₂ এর y", kind: "number" },
      {
        key: "branch",
        label: "খোলার দিক",
        kind: "select",
        init: "1",
        options: [
          { value: "1", label: "প্রথম দিক" },
          { value: "2", label: "বিপরীত দিক" },
        ],
      },
    ],
  },
  {
    id: "LR_DIR",
    group: "উপকেন্দ্রিক লম্ব",
    label: "উপকেন্দ্রিক লম্বের প্রান্তবিন্দু → নিয়ামকের সমীকরণ",
    hint: "নিয়ামক, উপকেন্দ্র ও অক্ষরেখা",
    fields: [
      { key: "x1", label: "L₁ এর x", kind: "number" },
      { key: "y1", label: "L₁ এর y", kind: "number" },
      { key: "x2", label: "L₂ এর x", kind: "number" },
      { key: "y2", label: "L₂ এর y", kind: "number" },
      {
        key: "branch",
        label: "খোলার দিক",
        kind: "select",
        init: "1",
        options: [
          { value: "1", label: "প্রথম দিক" },
          { value: "2", label: "বিপরীত দিক" },
        ],
      },
    ],
  },
  {
    id: "AXIS_DIR_DIST",
    group: "রেখাভিত্তিক",
    label: "অক্ষরেখা + নিয়ামক + উপকেন্দ্র-নিয়ামক দূরত্ব 2a",
    hint: "Ax + By + C = 0 ও Dx + Ey + F = 0",
    fields: [
      {
        key: "axis",
        label: "অক্ষরেখা",
        kind: "text",
        placeholder: "y = 2",
        samples: ["y = 2", "x = 1", "x - y = 0"],
      },
      {
        key: "dir",
        label: "নিয়ামক রেখা",
        kind: "text",
        placeholder: "x = -1",
        samples: ["x = -1", "y = -3"],
      },
      { key: "dist", label: "দূরত্ব 2a", kind: "number", placeholder: "2a" },
      {
        key: "branch",
        label: "উপকেন্দ্রের দিক",
        kind: "select",
        init: "1",
        options: [
          { value: "1", label: "ধনাত্মক দিক" },
          { value: "2", label: "ঋণাত্মক দিক" },
        ],
      },
    ],
  },
  {
    id: "AXIS_FOCUS_DIST",
    group: "রেখাভিত্তিক",
    label: "অক্ষরেখা + উপকেন্দ্র + শীর্ষ-উপকেন্দ্র দূরত্ব a",
    hint: "Ax + By + C = 0, S(x_s, y_s), a",
    fields: [
      {
        key: "axis",
        label: "অক্ষরেখা",
        kind: "text",
        placeholder: "y = 0",
        samples: ["y = 0", "x = 2", "x + y = 1"],
      },
      { key: "fx", label: "উপকেন্দ্র S এর x", kind: "number" },
      { key: "fy", label: "উপকেন্দ্র S এর y", kind: "number" },
      { key: "dist", label: "দূরত্ব a", kind: "number", placeholder: "a" },
      {
        key: "branch",
        label: "শীর্ষের দিক",
        kind: "select",
        init: "1",
        options: [
          { value: "1", label: "ধনাত্মক দিকে শীর্ষ" },
          { value: "2", label: "ঋণাত্মক দিকে শীর্ষ" },
        ],
      },
    ],
  },
  {
    id: "POLY",
    group: "বহুপদী রূপ",
    label: "বহুপদী সহগ a, b, c নির্ণয়",
    hint: "y = ax² + bx + c অথবা x = ay² + by + c",
    fields: [
      {
        key: "form",
        label: "রূপ",
        kind: "select",
        init: "y",
        options: [
          { value: "y", label: "y = ax² + bx + c" },
          { value: "x", label: "x = ay² + by + c" },
        ],
      },
      { key: "vx", label: "শীর্ষ h", kind: "number" },
      { key: "vy", label: "শীর্ষ k", kind: "number" },
      { key: "px", label: "বিন্দুর x₁", kind: "number" },
      { key: "py", label: "বিন্দুর y₁", kind: "number" },
    ],
  },
  {
    id: "TAN_PERP",
    group: "স্পর্শক ও অভিলম্ব",
    label: "প্রদত্ত রেখার উপর লম্ব স্পর্শক",
    hint: "y² = 4ax বা x² = 4ay এবং একটি রেখা",
    fields: [
      {
        key: "eq",
        label: "পরাবৃত্তের সমীকরণ",
        kind: "text",
        placeholder: "y^2 = 8x",
        samples: ["y^2 = 8x", "x^2 = 12y"],
      },
      {
        key: "ln",
        label: "রেখার সমীকরণ",
        kind: "text",
        placeholder: "2x + y = 5",
        samples: ["2x + y = 5", "x - 3y = 4"],
      },
    ],
  },
  {
    id: "TAN_NORM",
    group: "স্পর্শক ও অভিলম্ব",
    label: "নির্দিষ্ট বিন্দুতে স্পর্শক ও অভিলম্ব",
    hint: "পরাবৃত্তের উপরস্থ বিন্দু (x₁, y₁)",
    fields: [
      {
        key: "eq",
        label: "পরাবৃত্তের সমীকরণ",
        kind: "text",
        placeholder: "y^2 = 16x",
        samples: ["y^2 = 16x", "x^2 = 8y"],
      },
      { key: "px", label: "বিন্দুর x₁", kind: "number" },
      { key: "py", label: "বিন্দুর y₁", kind: "number" },
    ],
  },
  {
    id: "FOCUS_TANV",
    group: "স্পর্শক ও অভিলম্ব",
    label: "উপকেন্দ্র + শীর্ষবিন্দুর স্পর্শক",
    hint: "S(x_s, y_s) এবং শীর্ষে স্পর্শক Ax + By + C = 0",
    fields: [
      { key: "fx", label: "উপকেন্দ্র S এর x", kind: "number" },
      { key: "fy", label: "উপকেন্দ্র S এর y", kind: "number" },
      {
        key: "tan",
        label: "শীর্ষে স্পর্শক",
        kind: "text",
        placeholder: "x = 0",
        samples: ["x = 0", "y = 1", "x + y = 2"],
      },
    ],
  },
  {
    id: "TANGENCY",
    group: "স্পর্শক ও অভিলম্ব",
    label: "স্পর্শকতার শর্ত যাচাই (ln = am²)",
    hint: "lx + my + n = 0 এবং y² = 4ax — যেকোনো একটি ঘর ফাঁকা রাখলে তা নির্ণয় হবে",
    fields: [
      { key: "l", label: "l", kind: "number" },
      { key: "m", label: "m", kind: "number" },
      { key: "n", label: "n", kind: "number" },
      { key: "a", label: "a", kind: "number" },
    ],
  },
  {
    id: "COMMON_TAN",
    group: "স্পর্শক ও অভিলম্ব",
    label: "পরাবৃত্ত ও বৃত্তের সাধারণ স্পর্শক",
    hint: "y² = 4ax এবং (x − h)² + (y − k)² = r²",
    fields: [
      { key: "a", label: "পরাবৃত্তের a", kind: "number", placeholder: "a" },
      { key: "h", label: "বৃত্তের কেন্দ্র h", kind: "number" },
      { key: "k", label: "বৃত্তের কেন্দ্র k", kind: "number" },
      { key: "r", label: "ব্যাসার্ধ r", kind: "number" },
    ],
  },
];

export const MODE_IDS = MODES.map((m) => m.id);

export function modeById(id: string): ModeDef {
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

export function initialValues(mode: ModeDef, from: Values = {}): Values {
  const out: Values = {};
  for (const f of mode.fields) out[f.key] = from[f.key] ?? f.init ?? "";
  return out;
}

function tangentFromCoefs(c: ReturnType<typeof coefsFromEquation>, p: Pt): Line {
  const a = c.A * p[0] + (c.B * p[1]) / 2 + c.D / 2;
  const b = (c.B * p[0]) / 2 + c.C * p[1] + c.E / 2;
  const cc = (c.D * p[0]) / 2 + (c.E * p[1]) / 2 + c.F;
  if (Math.abs(a) < EPS && Math.abs(b) < EPS)
    throw new Error(trs("এই বিন্দুতে স্পর্শক নির্ণয় করা যায় না"));
  return { a, b, c: cc };
}

function solveVertexPointDirX(v: Values): ModeSolution {
  const vertex = point(v, "vx", "vy", trs("শীর্ষ"));
  const p = point(v, "px", "py", trs("বিন্দু"));
  const dy = p[1] - vertex[1];
  const dx = p[0] - vertex[0];
  if (Math.abs(dy) < EPS) throw new Error(trs("বিন্দুটি শীর্ষের সমান y মানে থাকতে পারে না"));
  const four = (dx * dx) / dy;
  if (Math.abs(four) < EPS) throw new Error(trs("বিন্দুটি শীর্ষবিন্দু থেকে ভিন্ন হতে হবে"));
  const a = Math.abs(four) / 4;
  const s = four > 0 ? 1 : -1;
  const focus: Pt = [vertex[0], vertex[1] + s * a];
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — উপযুক্ত আদর্শ রূপ নির্বাচন"),
      note: trs("নিয়ামক X-অক্ষের সমান্তরাল হলে অক্ষ Y-অক্ষের সমান্তরাল হয়।"),
      lines: [`(x - h)^2 = 4a(y - k)`, `h = ${fmt(vertex[0])},\\; k = ${fmt(vertex[1])}`],
    },
    {
      title: trs("ধাপ ২ — গমনকারী বিন্দু বসিয়ে 4a নির্ণয়"),
      lines: [
        `(${fmt(p[0])} ${signed(-vertex[0])})^2 = 4a(${fmt(p[1])} ${signed(-vertex[1])})`,
        `${fmt(dx * dx)} = 4a \\times ${fmt(dy)}`,
        `4a = \\dfrac{${fmt(dx * dx)}}{${fmt(dy)}} = ${fmt(four)} \\Rightarrow a = ${fmt(a)}`,
      ],
    },
    {
      title: trs("ধাপ ৩ — উপকেন্দ্র ও নিয়ামক"),
      lines: [
        `S = (h,\\; k ${signed(s * a)}) = ${P(focus)}`,
        trt`\\text{নিয়ামক}: y = ${fmt(vertex[1] - s * a)}`,
        trt`\\text{উপকেন্দ্রিক লম্ব} = |4a| = ${fmt(Math.abs(four))}`,
      ],
    },
  ];
  return pack(res, pre, givenPoints([{ p, name: trs("প্রদত্ত বিন্দু") }]), []);
}

function solveVertexZ(v: Values): ModeSolution {
  const vertex = point(v, "vx", "vy", trs("শীর্ষ"));
  const z = point(v, "zx", "zy", trs("ছেদবিন্দু Z"));
  const d: Pt = [vertex[0] - z[0], vertex[1] - z[1]];
  const a = Math.hypot(d[0], d[1]);
  if (a < EPS) throw new Error(trs("শীর্ষ ও Z একই বিন্দু হতে পারে না"));
  const u = unit(d);
  const focus: Pt = [vertex[0] + a * u[0], vertex[1] + a * u[1]];
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — অক্ষরেখার দিক"),
      note: trs("Z হলো অক্ষ ও নিয়ামকের ছেদবিন্দু, তাই AZ বরাবরই অক্ষরেখা।"),
      lines: [
        `A = ${P(vertex)},\\quad Z = ${P(z)}`,
        `\\vec{ZA} = (${fmt(d[0])},\\; ${fmt(d[1])}), \\quad |ZA| = a = ${fmt(a)}`,
        `\\hat{u} = (${fmt(u[0])},\\; ${fmt(u[1])})`,
      ],
    },
    {
      title: trs("ধাপ ২ — উপকেন্দ্র নির্ণয়"),
      note: trs("শীর্ষ, Z ও উপকেন্দ্র সমদূরত্বে থাকে: AZ = AS = a।"),
      lines: [`S = A + a\\hat{u} = ${P(focus)}`],
    },
    {
      title: trs("ধাপ ৩ — নিয়ামক ও অক্ষরেখা"),
      lines: [
        trt`\\text{নিয়ামক}: Z \\text{ বিন্দুগামী এবং } \\hat{u} \\text{ এর উপর লম্ব} \\Rightarrow ${lineTex(res.directrix)}`,
        trt`\\text{অক্ষরেখা}: ${lineTex(res.axis)}`,
      ],
    },
  ];
  return pack(res, pre, givenPoints([{ p: z, name: "Z" }]), []);
}

function solveVertexLR(v: Values): ModeSolution {
  const vertex = point(v, "vx", "vy", trs("শীর্ষ"));
  const lr = num(v, "lr", trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"));
  if (Math.abs(lr) < EPS) throw new Error(trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য শূন্য হতে পারে না"));
  const a = Math.abs(lr) / 4;
  const orient = v.orient || "right";
  const dirs: Record<string, Pt> = {
    right: [1, 0],
    left: [-1, 0],
    up: [0, 1],
    down: [0, -1],
  };
  const u = dirs[orient] ?? dirs.right;
  const focus: Pt = [vertex[0] + a * u[0], vertex[1] + a * u[1]];
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — 4a থেকে a নির্ণয়"),
      lines: [
        `4a = ${fmt(Math.abs(lr))} \\Rightarrow a = \\dfrac{${fmt(Math.abs(lr))}}{4} = ${fmt(a)}`,
      ],
    },
    {
      title: trs("ধাপ ২ — নির্বাচিত দিক অনুযায়ী উপকেন্দ্র"),
      note: trs("শীর্ষ থেকে a দূরত্বে অক্ষ বরাবর উপকেন্দ্র অবস্থিত।"),
      lines: [`\\hat{u} = (${fmt(u[0])},\\; ${fmt(u[1])})`, `S = A + a\\hat{u} = ${P(focus)}`],
    },
    {
      title: trs("ধাপ ৩ — আদর্শ সমীকরণ"),
      lines: [res.standardTex, trt`\\text{নিয়ামক}: ${lineTex(res.directrix)}`],
    },
  ];
  return pack(res, pre, [], []);
}

function solveVertexPointYAxis(v: Values): ModeSolution {
  const k = num(v, "vy", trs("শীর্ষ k"));
  const p = point(v, "px", "py", trs("বিন্দু"));
  const vertex: Pt = [0, k];
  if (Math.abs(p[1] - k) < EPS)
    throw new Error(trs("বিন্দুটির y মান শীর্ষের k এর সমান হতে পারে না"));
  const four = (p[0] * p[0]) / (p[1] - k);
  if (Math.abs(four) < EPS) throw new Error(trs("বিন্দুটি অক্ষের উপর থাকতে পারে না"));
  const a = Math.abs(four) / 4;
  const s = four > 0 ? 1 : -1;
  const focus: Pt = [0, k + s * a];
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — আদর্শ রূপ"),
      note: trs("অক্ষ Y-অক্ষে এবং শীর্ষ (0, k) হলে সমীকরণ x² = 4a(y − k)।"),
      lines: [`x^2 = 4a(y ${signed(-k)})`],
    },
    {
      title: trs("ধাপ ২ — বিন্দু বসানো"),
      lines: [
        `(${fmt(p[0])})^2 = 4a(${fmt(p[1])} ${signed(-k)})`,
        `4a = \\dfrac{${fmt(p[0] * p[0])}}{${fmt(p[1] - k)}} = ${fmt(four)} \\Rightarrow a = ${fmt(a)}`,
      ],
    },
    {
      title: trs("ধাপ ৩ — উপকেন্দ্র ও নিয়ামক"),
      lines: [`S = ${P(focus)}`, trt`\\text{নিয়ামক}: y = ${fmt(k - s * a)}`],
    },
  ];
  return pack(res, pre, givenPoints([{ p, name: trs("প্রদত্ত বিন্দু") }]), []);
}

function solveThreePoints(v: Values, horizontal: boolean): ModeSolution {
  const pts: Pt[] = [
    point(v, "x1", "y1", trs("প্রথম বিন্দু")),
    point(v, "x2", "y2", trs("দ্বিতীয় বিন্দু")),
    point(v, "x3", "y3", trs("তৃতীয় বিন্দু")),
  ];
  const t = pts.map((p) => (horizontal ? p[1] : p[0]));
  const w = pts.map((p) => (horizontal ? p[0] : p[1]));
  const [a, b, c] = solve3(
    [
      [t[0] * t[0], t[0], 1],
      [t[1] * t[1], t[1], 1],
      [t[2] * t[2], t[2], 1],
    ],
    w,
  );
  if (Math.abs(a) < 1e-10) throw new Error(trs("বিন্দু তিনটি সমরেখ — পরাবৃত্ত গঠিত হয় না"));
  const tv = -b / (2 * a);
  const wv = c - (b * b) / (4 * a);
  const vertex: Pt = horizontal ? [wv, tv] : [tv, wv];
  const focalLen = 1 / (4 * a);
  const focus: Pt = horizontal ? [wv + focalLen, tv] : [tv, wv + focalLen];
  const res = fromVertexFocus(vertex, focus);
  const varT = horizontal ? "y" : "x";
  const varW = horizontal ? "x" : "y";
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — উপযুক্ত রূপ ধরা"),
      lines: [`${varW} = a${varT}^2 + b${varT} + c`],
    },
    {
      title: trs("ধাপ ২ — তিনটি বিন্দু বসিয়ে সমীকরণ জোট"),
      lines: pts.map(
        (p, i) =>
          `${fmt(w[i])} = a(${fmt(t[i])})^2 + b(${fmt(t[i])}) + c = ${fmt(t[i] * t[i])}a ${signed(t[i])}b + c`,
      ),
    },
    {
      title: trs("ধাপ ৩ — সমীকরণ জোট সমাধান"),
      note: trs("নির্ণায়ক পদ্ধতিতে (গাউস অপনয়ন) সহগ নির্ণয় করা হলো।"),
      lines: [
        `a = ${fmt(a)},\\quad b = ${fmt(b)},\\quad c = ${fmt(c)}`,
        `${varW} = ${fmt(a)}${varT}^2 ${signed(b)}${varT} ${signed(c)}`,
      ],
    },
    {
      title: trs("ধাপ ৪ — শীর্ষ ও উপকেন্দ্র"),
      lines: [
        `${varT}_{v} = -\\dfrac{b}{2a} = ${fmt(tv)}`,
        `${varW}_{v} = c - \\dfrac{b^2}{4a} = ${fmt(wv)}`,
        `A = ${P(vertex)}, \\quad \\dfrac{1}{4a} = ${fmt(focalLen)}`,
        `S = ${P(focus)}`,
      ],
    },
  ];
  return pack(res, pre, givenPoints(pts.map((p, i) => ({ p, name: `P${i + 1}` }))), [
    {
      label: trs("বহুপদী সহগ"),
      tex: `a = ${fmt(a)},\\; b = ${fmt(b)},\\; c = ${fmt(c)}`,
      color: COLOR.given,
    },
  ]);
}

function solveTwoPointsVertexOnY(v: Values): ModeSolution {
  const p1 = point(v, "x1", "y1", trs("প্রথম বিন্দু"));
  const p2 = point(v, "x2", "y2", trs("দ্বিতীয় বিন্দু"));
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const roots = quadRoots(x2 - x1, -2 * y1 * x2 + 2 * y2 * x1, x2 * y1 * y1 - x1 * y2 * y2);
  const valid = roots
    .map((k) => {
      const base = Math.abs(x1) > EPS ? [(y1 - k) ** 2, x1] : [(y2 - k) ** 2, x2];
      return { k, four: base[0] / base[1] };
    })
    .filter((r) => isFinite(r.four) && Math.abs(r.four) > EPS);
  if (!valid.length) throw new Error(trs("এই দুই বিন্দু থেকে সমাধান পাওয়া যায়নি"));
  const pick = valid[v.branch === "2" && valid.length > 1 ? 1 : 0];
  const a = Math.abs(pick.four) / 4;
  const s = pick.four > 0 ? 1 : -1;
  const vertex: Pt = [0, pick.k];
  const focus: Pt = [s * a, pick.k];
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — রূপ ধরা"),
      note: trs("শীর্ষ Y-অক্ষে থাকায় শীর্ষ (0, k) এবং অক্ষ X-অক্ষের সমান্তরাল।"),
      lines: [`(y - k)^2 = 4a\\,x`],
    },
    {
      title: trs("ধাপ ২ — দুই বিন্দু বসানো"),
      lines: [
        `(${fmt(y1)} - k)^2 = 4a(${fmt(x1)})`,
        `(${fmt(y2)} - k)^2 = 4a(${fmt(x2)})`,
        `\\dfrac{(${fmt(y1)} - k)^2}{(${fmt(y2)} - k)^2} = \\dfrac{${fmt(x1)}}{${fmt(x2)}}`,
      ],
    },
    {
      title: trs("ধাপ ৩ — k এর দ্বিঘাত সমীকরণ"),
      lines: [
        `${fmt(x2 - x1)}k^2 ${signed(-2 * y1 * x2 + 2 * y2 * x1)}k ${signed(x2 * y1 * y1 - x1 * y2 * y2)} = 0`,
        `k = ${valid.map((r) => fmt(r.k)).join(",\\; ")}`,
        trt`\\text{নির্বাচিত } k = ${fmt(pick.k)}`,
      ],
    },
    {
      title: trs("ধাপ ৪ — 4a ও উপকেন্দ্র"),
      lines: [
        `4a = ${fmt(pick.four)} \\Rightarrow a = ${fmt(a)}`,
        `A = ${P(vertex)},\\quad S = ${P(focus)}`,
      ],
    },
  ];
  return pack(
    res,
    pre,
    givenPoints([
      { p: p1, name: "P₁" },
      { p: p2, name: "P₂" },
    ]),
    [],
  );
}

function solveTwoPointsAxisX(v: Values): ModeSolution {
  const p1 = point(v, "x1", "y1", trs("প্রথম বিন্দু"));
  const p2 = point(v, "x2", "y2", trs("দ্বিতীয় বিন্দু"));
  if (Math.abs(p1[0] - p2[0]) < EPS) throw new Error(trs("বিন্দু দুটির x মান ভিন্ন হতে হবে"));
  const four = (p1[1] * p1[1] - p2[1] * p2[1]) / (p1[0] - p2[0]);
  if (Math.abs(four) < EPS)
    throw new Error(trs("এই বিন্দু দুটি থেকে পরাবৃত্ত নির্ণয় করা যায় না"));
  const h = p1[0] - (p1[1] * p1[1]) / four;
  const a = Math.abs(four) / 4;
  const s = four > 0 ? 1 : -1;
  const vertex: Pt = [h, 0];
  const focus: Pt = [h + s * a, 0];
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — রূপ ধরা"),
      note: trs("অক্ষ X-অক্ষের উপর থাকলে শীর্ষ (h, 0)।"),
      lines: [`y^2 = 4a(x - h)`],
    },
    {
      title: trs("ধাপ ২ — দুই বিন্দু বসিয়ে বিয়োগ"),
      lines: [
        `${fmt(p1[1] * p1[1])} = 4a(${fmt(p1[0])} - h)`,
        `${fmt(p2[1] * p2[1])} = 4a(${fmt(p2[0])} - h)`,
        `${fmt(p1[1] * p1[1] - p2[1] * p2[1])} = 4a(${fmt(p1[0] - p2[0])})`,
        `4a = ${fmt(four)} \\Rightarrow a = ${fmt(a)}`,
      ],
    },
    {
      title: trs("ধাপ ৩ — শীর্ষ ও উপকেন্দ্র"),
      lines: [
        `h = ${fmt(p1[0])} - \\dfrac{${fmt(p1[1] * p1[1])}}{${fmt(four)}} = ${fmt(h)}`,
        `A = ${P(vertex)},\\quad S = ${P(focus)}`,
      ],
    },
  ];
  return pack(
    res,
    pre,
    givenPoints([
      { p: p1, name: "P₁" },
      { p: p2, name: "P₂" },
    ]),
    [],
  );
}

function latusCore(v: Values) {
  const l1 = point(v, "x1", "y1", trs("প্রথম প্রান্তবিন্দু"));
  const l2 = point(v, "x2", "y2", trs("দ্বিতীয় প্রান্তবিন্দু"));
  const len = Math.hypot(l2[0] - l1[0], l2[1] - l1[1]);
  if (len < EPS) throw new Error(trs("প্রান্তবিন্দু দুটি ভিন্ন হতে হবে"));
  const focus: Pt = [(l1[0] + l2[0]) / 2, (l1[1] + l2[1]) / 2];
  const a = len / 4;
  const along = unit([l2[0] - l1[0], l2[1] - l1[1]]);
  const sgn = v.branch === "2" ? -1 : 1;
  const u: Pt = [-along[1] * sgn, along[0] * sgn];
  const vertex: Pt = [focus[0] - a * u[0], focus[1] - a * u[1]];
  return { l1, l2, len, focus, a, u, vertex };
}

function solveLatusEquation(v: Values): ModeSolution {
  const { l1, l2, len, focus, a, u, vertex } = latusCore(v);
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — উপকেন্দ্র নির্ণয়"),
      note: trs("উপকেন্দ্রিক লম্ব উপকেন্দ্রগামী, তাই প্রান্তবিন্দু দুটির মধ্যবিন্দুই উপকেন্দ্র।"),
      lines: [
        `L_1 = ${P(l1)},\\quad L_2 = ${P(l2)}`,
        `S = \\left(\\dfrac{${fmt(l1[0])} ${signed(l2[0])}}{2},\\; \\dfrac{${fmt(l1[1])} ${signed(l2[1])}}{2}\\right) = ${P(focus)}`,
      ],
    },
    {
      title: trs("ধাপ ২ — a নির্ণয়"),
      lines: [`|L_1L_2| = 4a = ${fmt(len)} \\Rightarrow a = ${fmt(a)}`],
    },
    {
      title: trs("ধাপ ৩ — অক্ষের দিক ও শীর্ষ"),
      note: trs("অক্ষ উপকেন্দ্রিক লম্বের উপর লম্ব; দুই দিকেই একটি করে পরাবৃত্ত সম্ভব।"),
      lines: [`\\hat{u} = (${fmt(u[0])},\\; ${fmt(u[1])})`, `A = S - a\\hat{u} = ${P(vertex)}`],
    },
    {
      title: trs("ধাপ ৪ — সম্ভাব্য সমীকরণ"),
      lines: [
        res.standardTex,
        res.generalTex,
        trt`\\text{বিপরীত দিকের পরাবৃত্তটিও একইভাবে পাওয়া যায় (দিক বদলে দেখুন)}`,
      ],
    },
  ];
  return pack(
    res,
    pre,
    givenPoints([
      { p: l1, name: "L₁" },
      { p: l2, name: "L₂" },
    ]),
    [],
  );
}

function solveLatusDirectrix(v: Values): ModeSolution {
  const { l1, l2, len, focus, a, u, vertex } = latusCore(v);
  const res = fromVertexFocus(vertex, focus);
  const foot: Pt = [focus[0] - 2 * a * u[0], focus[1] - 2 * a * u[1]];
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — উপকেন্দ্র ও a"),
      lines: [`S = ${P(focus)}`, `4a = |L_1L_2| = ${fmt(len)} \\Rightarrow a = ${fmt(a)}`],
    },
    {
      title: trs("ধাপ ২ — অক্ষরেখা"),
      note: trs("অক্ষরেখা উপকেন্দ্রগামী এবং উপকেন্দ্রিক লম্বের উপর লম্ব।"),
      lines: [trt`\\text{অক্ষরেখা}: ${lineTex(res.axis)}`],
    },
    {
      title: trs("ধাপ ৩ — নিয়ামকের সমীকরণ"),
      note: trs("নিয়ামক উপকেন্দ্র থেকে 2a দূরত্বে, অক্ষের উপর লম্ব।"),
      lines: [
        `Z = S - 2a\\hat{u} = ${P(foot)}`,
        trt`\\text{নিয়ামক}: ${lineTex(res.directrix)}`,
        trt`\\text{বিপরীত দিকের জন্য নিয়ামক}: ${lineTex({ a: res.directrix.a, b: res.directrix.b, c: -(res.directrix.a * (focus[0] + 2 * a * u[0]) + res.directrix.b * (focus[1] + 2 * a * u[1])) })}`,
      ],
    },
  ];
  return pack(
    res,
    pre,
    [
      ...givenPoints([
        { p: l1, name: "L₁" },
        { p: l2, name: "L₂" },
      ]),
      { kind: "point", p: foot, name: "Z", color: COLOR.alt },
    ],
    [],
  );
}

function solveAxisDirectrixDist(v: Values): ModeSolution {
  const axis = line(v, "axis", trs("অক্ষরেখা"));
  const dir = line(v, "dir", trs("নিয়ামক রেখা"));
  const two = num(v, "dist", trs("দূরত্ব 2a"));
  if (Math.abs(two) < EPS) throw new Error(trs("দূরত্ব শূন্য হতে পারে না"));
  const z = intersect(axis, dir);
  const base = unit([-axis.b, axis.a]);
  const along: Pt = base[0] * dir.a + base[1] * dir.b >= 0 ? base : [-base[0], -base[1]];
  const sgn = v.branch === "2" ? -1 : 1;
  const focus: Pt = [z[0] + sgn * Math.abs(two) * along[0], z[1] + sgn * Math.abs(two) * along[1]];
  const res = fromFocusDirectrix(focus, dir);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — অক্ষ ও নিয়ামকের ছেদবিন্দু"),
      lines: [
        trt`\\text{অক্ষ}: ${lineTex(axis)}, \\quad \\text{নিয়ামক}: ${lineTex(dir)}`,
        `Z = ${P(z)}`,
      ],
    },
    {
      title: trs("ধাপ ২ — অক্ষ বরাবর একক ভেক্টর"),
      lines: [`\\hat{u} = (${fmt(along[0])},\\; ${fmt(along[1])})`],
    },
    {
      title: trs("ধাপ ৩ — উপকেন্দ্র ও শীর্ষ"),
      note: trs("উপকেন্দ্র নিয়ামক থেকে 2a দূরে, শীর্ষ ঠিক মাঝখানে।"),
      lines: [
        `S = Z ${sgn > 0 ? "+" : "-"} 2a\\hat{u} = ${P(focus)}`,
        `A = \\dfrac{S + Z}{2} = ${P(res.vertex)}`,
        `a = ${fmt(res.a)}`,
      ],
    },
  ];
  return pack(res, pre, [{ kind: "point", p: z, name: "Z", color: COLOR.alt }], []);
}

function solveAxisFocusDist(v: Values): ModeSolution {
  const axis = line(v, "axis", trs("অক্ষরেখা"));
  const focus = point(v, "fx", "fy", trs("উপকেন্দ্র"));
  const a = Math.abs(num(v, "dist", trs("দূরত্ব a")));
  if (a < EPS) throw new Error(trs("দূরত্ব শূন্য হতে পারে না"));
  const along = unit([-axis.b, axis.a]);
  const sgn = v.branch === "2" ? -1 : 1;
  const vertex: Pt = [focus[0] + sgn * a * along[0], focus[1] + sgn * a * along[1]];
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — অক্ষ বরাবর দিক"),
      lines: [
        trt`\\text{অক্ষ}: ${lineTex(axis)}`,
        `\\hat{u} = (${fmt(along[0])},\\; ${fmt(along[1])})`,
      ],
    },
    {
      title: trs("ধাপ ২ — শীর্ষ নির্ণয়"),
      lines: [`A = S ${sgn > 0 ? "+" : "-"} a\\hat{u} = ${P(vertex)}`, `a = ${fmt(a)}`],
    },
    {
      title: trs("ধাপ ৩ — নিয়ামক"),
      note: trs("নিয়ামক শীর্ষ থেকে a দূরত্বে উপকেন্দ্রের বিপরীত পাশে, অক্ষের উপর লম্ব।"),
      lines: [trt`\\text{নিয়ামক}: ${lineTex(res.directrix)}`],
    },
  ];
  return pack(res, pre, [], []);
}

function solvePoly(v: Values): ModeSolution {
  const form = v.form === "x" ? "x" : "y";
  const h = num(v, "vx", trs("শীর্ষ h"));
  const k = num(v, "vy", trs("শীর্ষ k"));
  const p = point(v, "px", "py", trs("বিন্দু"));
  const horizontal = form === "x";
  const t0 = horizontal ? k : h;
  const w0 = horizontal ? h : k;
  const tp = horizontal ? p[1] : p[0];
  const wp = horizontal ? p[0] : p[1];
  if (Math.abs(tp - t0) < EPS)
    throw new Error(trs("বিন্দুটি শীর্ষের সমান অক্ষ-মানে থাকতে পারে না"));
  const a = (wp - w0) / (tp - t0) ** 2;
  if (Math.abs(a) < 1e-12) throw new Error(trs("বিন্দুটি শীর্ষ থেকে ভিন্ন হতে হবে"));
  const b = -2 * a * t0;
  const c = w0 + a * t0 * t0;
  const focalLen = 1 / (4 * a);
  const vertex: Pt = horizontal ? [w0, t0] : [t0, w0];
  const focus: Pt = horizontal ? [w0 + focalLen, t0] : [t0, w0 + focalLen];
  const res = fromVertexFocus(vertex, focus);
  const varT = horizontal ? "y" : "x";
  const varW = horizontal ? "x" : "y";
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — শীর্ষ রূপ"),
      lines: [`${varW} = a(${varT} ${signed(-t0)})^2 ${signed(w0)}`],
    },
    {
      title: trs("ধাপ ২ — বিন্দু বসিয়ে a নির্ণয়"),
      lines: [
        `${fmt(wp)} = a(${fmt(tp)} ${signed(-t0)})^2 ${signed(w0)}`,
        `a = \\dfrac{${fmt(wp - w0)}}{${fmt((tp - t0) ** 2)}} = ${fmt(a)}`,
      ],
    },
    {
      title: trs("ধাপ ৩ — বিস্তার করে b ও c"),
      lines: [
        `b = -2a${varT}_v = -2(${fmt(a)})(${fmt(t0)}) = ${fmt(b)}`,
        `c = ${varW}_v + a${varT}_v^2 = ${fmt(w0)} ${signed(a * t0 * t0)} = ${fmt(c)}`,
        `${varW} = ${fmt(a)}${varT}^2 ${signed(b)}${varT} ${signed(c)}`,
      ],
    },
    {
      title: trs("ধাপ ৪ — উপকেন্দ্রিক দৈর্ঘ্য"),
      lines: [`\\dfrac{1}{4a} = ${fmt(focalLen)}`, `S = ${P(focus)}`],
    },
  ];
  return pack(res, pre, givenPoints([{ p, name: trs("প্রদত্ত বিন্দু") }]), [
    {
      label: trs("সহগসমূহ"),
      tex: `a = ${fmt(a)},\\; b = ${fmt(b)},\\; c = ${fmt(c)}`,
      color: COLOR.given,
    },
  ]);
}

function solveTangentPerp(v: Values): ModeSolution {
  const eq = (v.eq ?? "").trim();
  if (!eq) throw new Error(trs("পরাবৃত্তের সমীকরণ লিখুন"));
  const given = line(v, "ln", trs("রেখার সমীকরণ"));
  const res = solveAdvanced({ kind: "A", equation: eq });
  const local = axisAlignedLocal(res);
  if (Math.abs(given.b) < EPS && Math.abs(given.a) < EPS)
    throw new Error(trs("রেখার সমীকরণ সঠিক নয়"));
  if (Math.abs(given.b) < EPS)
    throw new Error(trs("উল্লম্ব রেখার লম্ব স্পর্শক অনুভূমিক — এই মোডে সমর্থিত নয়"));
  const m0 = -given.a / given.b;
  if (Math.abs(m0) < EPS)
    throw new Error(trs("অনুভূমিক রেখার লম্ব স্পর্শক উল্লম্ব — এই মোডে সমর্থিত নয়"));
  const m = -1 / m0;
  const { horizontal, s, h, k, a } = local;
  const mL = s * m;
  let tangent: Line;
  let contact: Pt;
  if (horizontal) {
    const X = a / (mL * mL);
    const Y = (2 * a) / mL;
    contact = [h + s * X, k + Y];
    tangent = { a: m, b: -1, c: -(m * contact[0] - contact[1]) };
  } else {
    const X = 2 * a * mL;
    const Y = a * mL * mL;
    contact = [h + X, k + s * Y];
    tangent = { a: m, b: -1, c: -(m * contact[0] - contact[1]) };
  }
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — প্রদত্ত রেখার ঢাল"),
      lines: [
        `${lineTex(given)} \\Rightarrow m_0 = -\\dfrac{${fmt(given.a)}}{${fmt(given.b)}} = ${fmt(m0)}`,
      ],
    },
    {
      title: trs("ধাপ ২ — লম্ব শর্ত"),
      note: trs("দুই রেখা পরস্পর লম্ব হলে ঢালের গুণফল −1।"),
      lines: [`m \\times m_0 = -1 \\Rightarrow m = -\\dfrac{1}{${fmt(m0)}} = ${fmt(m)}`],
    },
    {
      title: trs("ধাপ ৩ — স্পর্শকের আদর্শ রূপ"),
      note: horizontal
        ? trs("Y² = 4aX পরাবৃত্তের ঢাল m স্পর্শক: Y = mX + a/m, স্পর্শবিন্দু (a/m², 2a/m)।")
        : trs("X² = 4aY পরাবৃত্তের ঢাল m স্পর্শক: Y = mX − am², স্পর্শবিন্দু (2am, am²)।"),
      lines: [
        trt`a = ${fmt(a)},\\quad \\text{শীর্ষ } A = ${P(res.vertex)}`,
        trt`\\text{স্পর্শক}: ${lineTex(tangent)}`,
        trt`\\text{স্পর্শবিন্দু}: ${P(contact)}`,
      ],
    },
  ];
  return pack(
    res,
    pre,
    [
      { kind: "line", line: given, name: trs("প্রদত্ত রেখা"), color: COLOR.given, dash: "6 5" },
      { kind: "line", line: tangent, name: trs("স্পর্শক"), color: COLOR.tangent },
      { kind: "point", p: contact, name: trs("স্পর্শবিন্দু"), color: COLOR.contact },
    ],
    [
      { label: trs("স্পর্শক"), tex: lineTex(tangent), color: COLOR.tangent },
      { label: trs("স্পর্শবিন্দু"), tex: P(contact), color: COLOR.contact },
    ],
  );
}

function solveTangentNormal(v: Values): ModeSolution {
  const eq = (v.eq ?? "").trim();
  if (!eq) throw new Error(trs("পরাবৃত্তের সমীকরণ লিখুন"));
  const p = point(v, "px", "py", trs("বিন্দু"));
  const res = solveAdvanced({ kind: "A", equation: eq });
  const c = res.coefs;
  const value =
    c.A * p[0] * p[0] + c.B * p[0] * p[1] + c.C * p[1] * p[1] + c.D * p[0] + c.E * p[1] + c.F;
  if (Math.abs(value) > 1e-6 * (1 + Math.abs(p[0]) + Math.abs(p[1])))
    throw new Error(trs("বিন্দুটি পরাবৃত্তের উপর অবস্থিত নয়"));
  const tangent = tangentFromCoefs(c, p);
  const normal: Line = { a: tangent.b, b: -tangent.a, c: -(tangent.b * p[0] - tangent.a * p[1]) };
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — বিন্দুটি পরাবৃত্তের উপর কিনা যাচাই"),
      lines: [
        `${res.generalTex}`,
        trt`\\text{বিন্দু } ${P(p)} \\text{ বসিয়ে বামপক্ষ} = ${fmt(value)} \\approx 0`,
      ],
    },
    {
      title: trs("ধাপ ২ — স্পর্শকের T = 0 সূত্র"),
      note: trs(
        "Ax² + Bxy + Cy² + Dx + Ey + F = 0 এর (x₁, y₁) বিন্দুতে স্পর্শক: Axx₁ + B(xy₁ + x₁y)/2 + Cyy₁ + D(x + x₁)/2 + E(y + y₁)/2 + F = 0।",
      ),
      lines: [trt`\\text{স্পর্শক}: ${lineTex(tangent)}`],
    },
    {
      title: trs("ধাপ ৩ — অভিলম্ব"),
      note: trs("অভিলম্ব স্পর্শকের উপর লম্ব এবং একই বিন্দুগামী।"),
      lines: [trt`\\text{অভিলম্ব}: ${lineTex(normal)}`],
    },
  ];
  return pack(
    res,
    pre,
    [
      { kind: "line", line: tangent, name: trs("স্পর্শক"), color: COLOR.tangent },
      { kind: "line", line: normal, name: trs("অভিলম্ব"), color: COLOR.normal, dash: "7 5" },
      { kind: "point", p, name: trs("প্রদত্ত বিন্দু"), color: COLOR.contact },
    ],
    [
      { label: trs("স্পর্শক"), tex: lineTex(tangent), color: COLOR.tangent },
      { label: trs("অভিলম্ব"), tex: lineTex(normal), color: COLOR.normal },
    ],
  );
}

function solveFocusTangentVertex(v: Values): ModeSolution {
  const focus = point(v, "fx", "fy", trs("উপকেন্দ্র"));
  const tan = line(v, "tan", trs("শীর্ষে স্পর্শক"));
  const vertex = footOnLine(focus, tan);
  if (Math.hypot(vertex[0] - focus[0], vertex[1] - focus[1]) < EPS)
    throw new Error(trs("উপকেন্দ্র স্পর্শকের উপর থাকতে পারে না"));
  const res = fromVertexFocus(vertex, focus);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — শীর্ষবিন্দু নির্ণয়"),
      note: trs("শীর্ষে স্পর্শক অক্ষের উপর লম্ব, তাই উপকেন্দ্র থেকে স্পর্শকের পাদবিন্দুই শীর্ষ।"),
      lines: [trt`\\text{স্পর্শক}: ${lineTex(tan)}`, `A = ${P(vertex)}`],
    },
    {
      title: trs("ধাপ ২ — a নির্ণয়"),
      lines: [`a = |AS| = ${fmt(res.a)}`],
    },
    {
      title: trs("ধাপ ৩ — নিয়ামক"),
      note: trs("নিয়ামক শীর্ষে স্পর্শকের সমান্তরাল এবং শীর্ষ থেকে a দূরত্বে উপকেন্দ্রের বিপরীতে।"),
      lines: [trt`\\text{নিয়ামক}: ${lineTex(res.directrix)}`],
    },
  ];
  return pack(
    res,
    pre,
    [{ kind: "line", line: tan, name: trs("শীর্ষে স্পর্শক"), color: COLOR.tangent }],
    [],
  );
}

function solveTangency(v: Values): ModeSolution {
  const keys = ["l", "m", "n", "a"] as const;
  const blanks = keys.filter((k) => !(v[k] ?? "").trim());
  if (blanks.length > 1) throw new Error(trs("সর্বোচ্চ একটি ঘর ফাঁকা রাখা যাবে"));
  const known: Record<string, number> = {};
  for (const k of keys) if (!blanks.includes(k)) known[k] = num(v, k, k);
  const lines: string[] = [
    trt`\\text{রেখা}: lx + my + n = 0, \\quad \\text{পরাবৃত্ত}: y^2 = 4ax`,
    trt`\\text{স্পর্শকতার শর্ত}: ln = am^2`,
  ];
  let l = known.l;
  let m = known.m;
  let n = known.n;
  let a = known.a;
  if (blanks.length === 1) {
    const b = blanks[0];
    if (b === "a") {
      if (Math.abs(m) < EPS) throw new Error(trs("m শূন্য হলে a নির্ণয় করা যায় না"));
      a = (l * n) / (m * m);
      lines.push(`a = \\dfrac{ln}{m^2} = \\dfrac{${fmt(l * n)}}{${fmt(m * m)}} = ${fmt(a)}`);
    } else if (b === "n") {
      if (Math.abs(l) < EPS) throw new Error(trs("l শূন্য হলে n নির্ণয় করা যায় না"));
      n = (a * m * m) / l;
      lines.push(`n = \\dfrac{am^2}{l} = ${fmt(n)}`);
    } else if (b === "l") {
      if (Math.abs(n) < EPS) throw new Error(trs("n শূন্য হলে l নির্ণয় করা যায় না"));
      l = (a * m * m) / n;
      lines.push(`l = \\dfrac{am^2}{n} = ${fmt(l)}`);
    } else {
      if (Math.abs(a) < EPS) throw new Error(trs("a শূন্য হলে m নির্ণয় করা যায় না"));
      const val = (l * n) / a;
      if (val < 0) throw new Error(trs("বাস্তব m পাওয়া যায়নি (ln/a ঋণাত্মক)"));
      m = Math.sqrt(val);
      lines.push(`m^2 = \\dfrac{ln}{a} = ${fmt(val)} \\Rightarrow m = \\pm ${fmt(m)}`);
    }
  }
  if (!isFinite(a) || Math.abs(a) < EPS) throw new Error(trs("a শূন্য হতে পারে না"));
  const lhs = l * n;
  const rhs = a * m * m;
  const tangent: Line = { a: l, b: m, c: n };
  lines.push(
    `ln = ${fmt(lhs)}, \\quad am^2 = ${fmt(rhs)}`,
    Math.abs(lhs - rhs) < 1e-6
      ? trt`\\therefore ln = am^2 \\Rightarrow \\text{রেখাটি পরাবৃত্তের স্পর্শক}`
      : trt`\\therefore ln \\ne am^2 \\Rightarrow \\text{রেখাটি স্পর্শক নয়}`,
  );
  const focus: Pt = [a, 0];
  const directrix: Line = { a: 1, b: 0, c: a };
  const res = fromFocusDirectrix(focus, directrix);
  const contactExtras: Extra[] = [
    { kind: "line", line: tangent, name: trs("প্রদত্ত রেখা"), color: COLOR.tangent },
  ];
  if (Math.abs(lhs - rhs) < 1e-6 && Math.abs(m) > EPS) {
    const slope = -l / m;
    const contact: Pt = [a / (slope * slope), (2 * a) / slope];
    contactExtras.push({
      kind: "point",
      p: contact,
      name: trs("স্পর্শবিন্দু"),
      color: COLOR.contact,
    });
    lines.push(
      trt`\\text{স্পর্শবিন্দু} = \\left(\\dfrac{a}{m_s^2},\\; \\dfrac{2a}{m_s}\\right) = ${P(contact)}`,
    );
  }
  const pre: StepBlock[] = [{ title: trs("ধাপ ১ — স্পর্শকতার শর্ত প্রয়োগ"), lines }];
  return pack(res, pre, contactExtras, [
    { label: trs("শর্ত"), tex: `ln = ${fmt(lhs)},\\; am^2 = ${fmt(rhs)}`, color: COLOR.tangent },
    { label: trs("রেখা"), tex: lineTex(tangent), color: COLOR.given },
  ]);
}

function solveCommonTangents(v: Values): ModeSolution {
  const a = num(v, "a", trs("পরাবৃত্তের a"));
  if (Math.abs(a) < EPS) throw new Error(trs("a শূন্য হতে পারে না"));
  const h = num(v, "h", trs("কেন্দ্রের h"));
  const k = num(v, "k", trs("কেন্দ্রের k"));
  const r = Math.abs(num(v, "r", trs("ব্যাসার্ধ r")));
  const quart = [h * h - r * r, -2 * h * k, k * k + 2 * a * h - r * r, -2 * a * k, a * a];
  const ms = polyRoots(quart).filter((m) => Math.abs(m) > 1e-6);
  const tangents = ms.map((m) => ({ m, line: { a: m, b: -1, c: a / m } as Line }));
  const focus: Pt = [a, 0];
  const directrix: Line = { a: 1, b: 0, c: a };
  const res = fromFocusDirectrix(focus, directrix);
  const pre: StepBlock[] = [
    {
      title: trs("ধাপ ১ — পরাবৃত্তের ঢাল-রূপ স্পর্শক"),
      lines: [
        trt`y^2 = 4ax \\text{ এর ঢাল } m \\text{ স্পর্শক}: y = mx + \\dfrac{a}{m}`,
        `mx - y + \\dfrac{a}{m} = 0`,
      ],
    },
    {
      title: trs("ধাপ ২ — বৃত্তের স্পর্শকতার শর্ত"),
      note: trs("বৃত্তের কেন্দ্র থেকে স্পর্শকের লম্ব দূরত্ব ব্যাসার্ধের সমান।"),
      lines: [
        `\\dfrac{\\left|m(${fmt(h)}) - (${fmt(k)}) + \\dfrac{${fmt(a)}}{m}\\right|}{\\sqrt{m^2 + 1}} = ${fmt(r)}`,
        `\\left(${fmt(h)}m^2 ${signed(-k)}m ${signed(a)}\\right)^2 = ${fmt(r * r)}m^2(m^2 + 1)`,
      ],
    },
    {
      title: trs("ধাপ ৩ — চতুর্ঘাত সমীকরণ"),
      lines: [
        `${fmt(quart[0])}m^4 ${signed(quart[1])}m^3 ${signed(quart[2])}m^2 ${signed(quart[3])}m ${signed(quart[4])} = 0`,
        ms.length
          ? `m = ${ms.map((m) => fmt(m)).join(",\\; ")}`
          : trt`\\text{বাস্তব ঢাল পাওয়া যায়নি}`,
      ],
    },
    {
      title: trs("ধাপ ৪ — সাধারণ স্পর্শকসমূহ"),
      lines: tangents.length
        ? tangents.map(
            (t) =>
              `y = ${fmt(t.m)}x ${signed(a / t.m)} \\quad \\Rightarrow \\quad ${lineTex(t.line)}`,
          )
        : [trt`\\text{এই বৃত্ত ও পরাবৃত্তের বাস্তব সাধারণ স্পর্শক নেই}`],
    },
  ];
  const circlePts: Extra[] = [
    { kind: "point", p: [h, k], name: trs("বৃত্তের কেন্দ্র"), color: COLOR.alt },
  ];
  const extras: Extra[] = [
    ...circlePts,
    ...tangents.map((t, i) => ({
      kind: "line" as const,
      line: t.line,
      name: trt`সাধারণ স্পর্শক ${i + 1}`,
      color: COLOR.tangent,
    })),
  ];
  return pack(
    res,
    pre,
    extras,
    tangents.map((t, i) => ({
      label: trt`সাধারণ স্পর্শক ${i + 1}`,
      tex: lineTex(t.line),
      color: COLOR.tangent,
    })),
  );
}

function solveBasic(id: string, v: Values): ModeSolution {
  if (id === "A") {
    const eq = (v.eq ?? "").trim();
    if (!eq) throw new Error(trs("পরাবৃত্তের সমীকরণ লিখুন"));
    const res = solveAdvanced({ kind: "A", equation: eq });
    return { res, extras: [], steps: res.steps, facts: res.facts };
  }
  if (id === "B") {
    const res = solveAdvanced({
      kind: "B",
      focus: point(v, "fx", "fy", trs("উপকেন্দ্র")),
      directrix: line(v, "dir", trs("নিয়ামক রেখা")),
    });
    return { res, extras: [], steps: res.steps, facts: res.facts };
  }
  if (id === "C") {
    const res = solveAdvanced({
      kind: "C",
      vertex: point(v, "vx", "vy", trs("শীর্ষ")),
      directrix: line(v, "dir", trs("নিয়ামক রেখা")),
    });
    return { res, extras: [], steps: res.steps, facts: res.facts };
  }
  const res = solveAdvanced({
    kind: "D",
    focus: point(v, "fx", "fy", trs("উপকেন্দ্র")),
    vertex: point(v, "vx", "vy", trs("শীর্ষ")),
  });
  return { res, extras: [], steps: res.steps, facts: res.facts };
}

export function solveMode(id: string, v: Values): ModeSolution {
  switch (id) {
    case "A":
    case "B":
    case "C":
    case "D":
      return solveBasic(id, v);
    case "VP_DIRX":
      return solveVertexPointDirX(v);
    case "VZ":
      return solveVertexZ(v);
    case "VLR":
      return solveVertexLR(v);
    case "VP_YAXIS":
      return solveVertexPointYAxis(v);
    case "P3_X":
      return solveThreePoints(v, true);
    case "P3_Y":
      return solveThreePoints(v, false);
    case "P2_VONY":
      return solveTwoPointsVertexOnY(v);
    case "P2_AXISX":
      return solveTwoPointsAxisX(v);
    case "LR_EQ":
      return solveLatusEquation(v);
    case "LR_DIR":
      return solveLatusDirectrix(v);
    case "AXIS_DIR_DIST":
      return solveAxisDirectrixDist(v);
    case "AXIS_FOCUS_DIST":
      return solveAxisFocusDist(v);
    case "POLY":
      return solvePoly(v);
    case "TAN_PERP":
      return solveTangentPerp(v);
    case "TAN_NORM":
      return solveTangentNormal(v);
    case "FOCUS_TANV":
      return solveFocusTangentVertex(v);
    case "TANGENCY":
      return solveTangency(v);
    case "COMMON_TAN":
      return solveCommonTangents(v);
    default:
      throw new Error(trs("অজানা সমস্যার ধরন"));
  }
}
