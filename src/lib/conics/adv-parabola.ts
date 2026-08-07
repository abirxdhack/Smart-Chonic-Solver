import { getActiveLang, trs, trt } from "@/i18n";
import { coefsFromEquation, type PolyCoefs } from "./general-solver";

export type Pt = [number, number];
export type Line = { a: number; b: number; c: number };

export type ProblemType = "A" | "B" | "C" | "D";

export type AdvInput =
  | { kind: "A"; equation: string }
  | { kind: "B"; focus: Pt; directrix: Line }
  | { kind: "C"; vertex: Pt; directrix: Line }
  | { kind: "D"; focus: Pt; vertex: Pt };

export type StepBlock = { title: string; note?: string; lines: string[] };

export type Fact = { label: string; tex: string; color: string };

export type AdvResult = {
  focus: Pt;
  vertex: Pt;
  directrix: Line;
  axis: Line;
  a: number;
  u: Pt;
  v: Pt;
  latusEnds: [Pt, Pt];
  latusLength: number;
  coefs: PolyCoefs;
  rotated: boolean;
  rotationDeg: number;
  generalTex: string;
  standardTex: string;
  steps: StepBlock[];
  facts: Fact[];
};

const EPS = 1e-9;

export function fmt(n: number): string {
  if (!isFinite(n)) return "∞";
  if (Math.abs(n) < 1e-10) return "0";
  const r = Math.round(n);
  if (Math.abs(n - r) < 1e-9) return String(r);
  const rounded = Number(n.toFixed(4));
  return String(rounded);
}

function signed(n: number): string {
  return n < 0 ? `- ${fmt(Math.abs(n))}` : `+ ${fmt(n)}`;
}

function sqrtTex(n: number): string {
  const r = Math.sqrt(n);
  if (Math.abs(r - Math.round(r)) < 1e-9) return fmt(Math.round(r));
  return `\\sqrt{${fmt(n)}}`;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b > 0.5) {
    const t = a % b;
    a = b;
    b = t;
  }
  return a;
}

function reduce(c: PolyCoefs): PolyCoefs {
  const vals = [c.A, c.B, c.C, c.D, c.E, c.F];
  const allInt = vals.every((v) => Math.abs(v - Math.round(v)) < 1e-7);
  if (!allInt) return c;
  const ints = vals.map((v) => Math.round(v));
  let g = 0;
  for (const v of ints) if (v !== 0) g = g === 0 ? Math.abs(v) : gcd(g, Math.abs(v));
  if (g === 0) g = 1;
  const lead = ints.find((v) => v !== 0) ?? 1;
  const sgn = lead < 0 ? -1 : 1;
  return {
    A: (ints[0] / g) * sgn,
    B: (ints[1] / g) * sgn,
    C: (ints[2] / g) * sgn,
    D: (ints[3] / g) * sgn,
    E: (ints[4] / g) * sgn,
    F: (ints[5] / g) * sgn,
  };
}

export function conicTex(c: PolyCoefs): string {
  const terms: { v: number; s: string }[] = [
    { v: c.A, s: "x^2" },
    { v: c.B, s: "xy" },
    { v: c.C, s: "y^2" },
    { v: c.D, s: "x" },
    { v: c.E, s: "y" },
    { v: c.F, s: "" },
  ];
  let out = "";
  for (const t of terms) {
    if (Math.abs(t.v) < 1e-10) continue;
    const abs = Math.abs(t.v);
    const coef = Math.abs(abs - 1) < 1e-10 && t.s !== "" ? "" : fmt(abs);
    const sign = t.v < 0 ? "-" : "+";
    out += out === "" ? (t.v < 0 ? `-${coef}${t.s}` : `${coef}${t.s}`) : ` ${sign} ${coef}${t.s}`;
  }
  if (out === "") out = "0";
  return `${out} = 0`;
}

export function lineTex(l: Line): string {
  return conicTex({ A: 0, B: 0, C: 0, D: l.a, E: l.b, F: l.c });
}

export function parseLine(raw: string): Line {
  const text = raw.trim();
  if (!text) throw new Error(trs("নিয়ামক রেখার সমীকরণ লিখুন"));
  const withEq = text.includes("=") ? text : `${text} = 0`;
  const c = coefsFromEquation(withEq);
  if (Math.abs(c.A) > EPS || Math.abs(c.B) > EPS || Math.abs(c.C) > EPS)
    throw new Error(trs("নিয়ামক অবশ্যই সরলরেখা হতে হবে (x², xy, y² থাকতে পারবে না)"));
  if (Math.abs(c.D) < EPS && Math.abs(c.E) < EPS)
    throw new Error(trs("রেখার সমীকরণে x বা y থাকতে হবে"));
  return { a: c.D, b: c.E, c: c.F };
}

function dot(p: Pt, q: Pt) {
  return p[0] * q[0] + p[1] * q[1];
}

function fromFocusDirectrix(focus: Pt, dir: Line) {
  const k = dir.a * dir.a + dir.b * dir.b;
  const norm = Math.sqrt(k);
  const sd = (dir.a * focus[0] + dir.b * focus[1] + dir.c) / norm;
  if (Math.abs(sd) < 1e-8)
    throw new Error(trs("উপকেন্দ্র নিয়ামক রেখার উপরে আছে — পরাবৃত্ত গঠিত হয় না"));
  const sgn = sd > 0 ? 1 : -1;
  const u: Pt = [(sgn * dir.a) / norm, (sgn * dir.b) / norm];
  const a = Math.abs(sd) / 2;
  const vertex: Pt = [focus[0] - a * u[0], focus[1] - a * u[1]];
  return { u, a, vertex, norm, k, sd };
}

function rationalizeLine(l: Line): Line {
  const base = Math.min(...[l.a, l.b].filter((v) => Math.abs(v) > EPS).map(Math.abs));
  for (let m = 1; m <= 200; m++) {
    const k = m / base;
    const vals = [l.a * k, l.b * k, l.c * k];
    if (vals.every((v) => Math.abs(v - Math.round(v)) < 1e-6 && Math.abs(v) < 1e6)) {
      const r = vals.map((v) => Math.round(v));
      const s = r[0] !== 0 ? Math.sign(r[0]) : Math.sign(r[1]);
      return { a: r[0] * s, b: r[1] * s, c: r[2] * s };
    }
  }
  return l;
}

function normalizeLine(l: Line): Line {
  const lead = Math.abs(l.a) > EPS ? l.a : l.b;
  const s = lead < 0 ? -1 : 1;
  return { a: l.a * s, b: l.b * s, c: l.c * s };
}

function buildCore(focus: Pt, dir: Line): AdvResult {
  const { u, a, vertex } = fromFocusDirectrix(focus, dir);
  const v: Pt = [-u[1], u[0]];
  const k = dir.a * dir.a + dir.b * dir.b;
  const raw: PolyCoefs = {
    A: k - dir.a * dir.a,
    B: -2 * dir.a * dir.b,
    C: k - dir.b * dir.b,
    D: -2 * k * focus[0] - 2 * dir.a * dir.c,
    E: -2 * k * focus[1] - 2 * dir.b * dir.c,
    F: k * (focus[0] * focus[0] + focus[1] * focus[1]) - dir.c * dir.c,
  };
  const coefs = reduce(raw);
  const axis: Line = normalizeLine({
    a: dir.b,
    b: -dir.a,
    c: dir.a * focus[1] - dir.b * focus[0],
  });
  const latusEnds: [Pt, Pt] = [
    [focus[0] + 2 * a * v[0], focus[1] + 2 * a * v[1]],
    [focus[0] - 2 * a * v[0], focus[1] - 2 * a * v[1]],
  ];
  const rotationDeg = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
  const rotated = Math.abs(dir.a) > EPS && Math.abs(dir.b) > EPS;
  const standardTex = rotated
    ? trt`Y^2 = ${fmt(4 * a)}X \\quad (\\text{ঘূর্ণিত অক্ষ } X, Y)`
    : standardAxisAligned(vertex, a, u);
  return {
    focus,
    vertex,
    directrix: dir,
    axis,
    a,
    u,
    v,
    latusEnds,
    latusLength: 4 * a,
    coefs,
    rotated,
    rotationDeg,
    generalTex: conicTex(coefs),
    standardTex,
    steps: [],
    facts: [],
  };
}

function standardAxisAligned(vertex: Pt, a: number, u: Pt): string {
  const [h, k] = vertex;
  const xTerm = Math.abs(h) < EPS ? "x" : `\\left(x ${signed(-h)}\\right)`;
  const yTerm = Math.abs(k) < EPS ? "y" : `\\left(y ${signed(-k)}\\right)`;
  if (Math.abs(u[1]) < 1e-8) {
    const s = u[0] > 0 ? 1 : -1;
    return `${yTerm}^2 = ${fmt(s * 4 * a)}${xTerm}`;
  }
  const s = u[1] > 0 ? 1 : -1;
  return `${xTerm}^2 = ${fmt(s * 4 * a)}${yTerm}`;
}

function derivationSteps(focus: Pt, dir: Line, res: AdvResult): StepBlock[] {
  const [al, be] = focus;
  const { a, b, c } = dir;
  const k = a * a + b * b;
  const steps: StepBlock[] = [];

  steps.push({
    title: trs("ধাপ ১ — সংজ্ঞা প্রয়োগ"),
    note: trs(
      "পরাবৃত্তের সংজ্ঞা: উপকেন্দ্র S থেকে দূরত্ব = নিয়ামক রেখা থেকে লম্ব দূরত্ব, অর্থাৎ উৎকেন্দ্রিকতা e = 1।",
    ),
    lines: [
      trt`S = (${fmt(al)},\\; ${fmt(be)}), \\qquad \\text{নিয়ামক } M: ${lineTex(dir)}`,
      trt`P(x, y) \\text{ চলমান বিন্দু হলে, } \\dfrac{SP}{PM} = e = 1 \\Rightarrow SP = PM`,
      `SP^2 = PM^2`,
    ],
  });

  steps.push({
    title: trs("ধাপ ২ — দূরত্ব দুটির রাশি"),
    note: trs("দুই বিন্দুর দূরত্ব ও বিন্দু-রেখা লম্ব দূরত্বের সূত্র বসানো হলো।"),
    lines: [
      `SP = \\sqrt{(x - \\alpha)^2 + (y - \\beta)^2}`,
      `PM = \\dfrac{|ax + by + c|}{\\sqrt{a^2 + b^2}}`,
      `(x - \\alpha)^2 + (y - \\beta)^2 = \\left(\\dfrac{ax + by + c}{\\sqrt{a^2 + b^2}}\\right)^{2}`,
    ],
  });

  steps.push({
    title: trs("ধাপ ৩ — মান বসানো"),
    note: trs("α, β এবং a, b, c এর প্রদত্ত মান বসানো হলো।"),
    lines: [
      `(x ${signed(-al)})^2 + (y ${signed(-be)})^2 = \\left(\\dfrac{${fmt(a)}x ${signed(b)}y ${signed(c)}}{\\sqrt{(${fmt(a)})^2 + (${fmt(b)})^2}}\\right)^{2}`,
      `\\sqrt{(${fmt(a)})^2 + (${fmt(b)})^2} = \\sqrt{${fmt(a * a)} + ${fmt(b * b)}} = ${sqrtTex(k)}`,
      `(x ${signed(-al)})^2 + (y ${signed(-be)})^2 = \\dfrac{(${fmt(a)}x ${signed(b)}y ${signed(c)})^2}{${fmt(k)}}`,
    ],
  });

  steps.push({
    title: trs("ধাপ ৪ — হর দূর করা (আড়াআড়ি গুণ)"),
    note: trt`উভয় পক্ষকে a² + b² = ${fmt(k)} দিয়ে গুণ করা হলো।`,
    lines: [
      `${fmt(k)}\\left[(x ${signed(-al)})^2 + (y ${signed(-be)})^2\\right] = (${fmt(a)}x ${signed(b)}y ${signed(c)})^2`,
    ],
  });

  const lx = `x^2 ${signed(-2 * al)}x + ${fmt(al * al)}`;
  const ly = `y^2 ${signed(-2 * be)}y + ${fmt(be * be)}`;
  steps.push({
    title: trs("ধাপ ৫ — বামপক্ষের বিস্তার"),
    note: trs("(p − q)² = p² − 2pq + q² সূত্র ব্যবহার করা হলো।"),
    lines: [
      `(x ${signed(-al)})^2 = ${lx}`,
      `(y ${signed(-be)})^2 = ${ly}`,
      trt`\\text{বামপক্ষ} = ${fmt(k)}\\left[${lx} + ${ly}\\right]`,
      `= ${fmt(k)}x^2 ${signed(-2 * al * k)}x + ${fmt(al * al * k)} + ${fmt(k)}y^2 ${signed(-2 * be * k)}y + ${fmt(be * be * k)}`,
      `= ${fmt(k)}x^2 + ${fmt(k)}y^2 ${signed(-2 * al * k)}x ${signed(-2 * be * k)}y ${signed(k * (al * al + be * be))}`,
    ],
  });

  steps.push({
    title: trs("ধাপ ৬ — ডানপক্ষের বিস্তার"),
    note: trs("(p + q + r)² = p² + q² + r² + 2pq + 2qr + 2rp সূত্র ব্যবহার করা হলো।"),
    lines: [
      `(${fmt(a)}x ${signed(b)}y ${signed(c)})^2 = (${fmt(a)}x)^2 + (${fmt(b)}y)^2 + (${fmt(c)})^2 + 2(${fmt(a)}x)(${fmt(b)}y) + 2(${fmt(b)}y)(${fmt(c)}) + 2(${fmt(c)})(${fmt(a)}x)`,
      `= ${fmt(a * a)}x^2 + ${fmt(b * b)}y^2 + ${fmt(c * c)} ${signed(2 * a * b)}xy ${signed(2 * b * c)}y ${signed(2 * a * c)}x`,
    ],
  });

  const A = k - a * a;
  const C = k - b * b;
  const B = -2 * a * b;
  const D = -2 * k * al - 2 * a * c;
  const E = -2 * k * be - 2 * b * c;
  const F = k * (al * al + be * be) - c * c;

  steps.push({
    title: trs("ধাপ ৭ — সব পদ বামপক্ষে এনে সমচিহ্ন পদ একত্র"),
    note: trs("প্রতিটি সহগ আলাদাভাবে হিসাব করা হলো, কোনো ধাপ বাদ নেই।"),
    lines: [
      trt`x^2 \\text{ এর সহগ} = ${fmt(k)} - ${fmt(a * a)} = ${fmt(A)}`,
      trt`y^2 \\text{ এর সহগ} = ${fmt(k)} - ${fmt(b * b)} = ${fmt(C)}`,
      trt`xy \\text{ এর সহগ} = 0 - ${fmt(2 * a * b)} = ${fmt(B)}`,
      trt`x \\text{ এর সহগ} = ${fmt(-2 * al * k)} - ${fmt(2 * a * c)} = ${fmt(D)}`,
      trt`y \\text{ এর সহগ} = ${fmt(-2 * be * k)} - ${fmt(2 * b * c)} = ${fmt(E)}`,
      trt`\\text{ধ্রুবপদ} = ${fmt(k * (al * al + be * be))} - ${fmt(c * c)} = ${fmt(F)}`,
    ],
  });

  const rawEq = conicTex({ A, B, C, D, E, F });
  const reducedEq = res.generalTex;
  const lines8 = [`${rawEq}`];
  if (reducedEq !== rawEq)
    lines8.push(trt`\\text{সাধারণ উৎপাদক দিয়ে ভাগ করে:}\\quad ${reducedEq}`);
  steps.push({
    title: trs("ধাপ ৮ — নির্ণেয় সাধারণ দ্বিঘাত সমীকরণ"),
    note: trs("Ax² + Bxy + Cy² + Dx + Ey + F = 0 আকারে সাজানো হলো।"),
    lines: lines8,
  });

  const disc = res.coefs.B * res.coefs.B - 4 * res.coefs.A * res.coefs.C;
  steps.push({
    title: trs("ধাপ ৯ — যাচাই (শর্ত B² − 4AC = 0)"),
    note: trs("পরাবৃত্তের জন্য নিরূপক শূন্য হওয়া আবশ্যক।"),
    lines: [
      `B^2 - 4AC = (${fmt(res.coefs.B)})^2 - 4(${fmt(res.coefs.A)})(${fmt(res.coefs.C)}) = ${fmt(disc)}`,
      trt`\\therefore \\text{লেখচিত্রটি একটি পরাবৃত্ত}`,
    ],
  });

  return steps;
}

function propertySteps(res: AdvResult): StepBlock[] {
  const { focus, vertex, directrix: d, a, u, latusEnds } = res;
  const steps: StepBlock[] = [];
  steps.push({
    title: trs("ধাপ ১০ — শীর্ষবিন্দু ও অক্ষরেখা"),
    note: trs(
      "শীর্ষ হলো উপকেন্দ্র ও নিয়ামকের মধ্যবিন্দু; অক্ষরেখা নিয়ামকের উপর লম্ব এবং উপকেন্দ্রগামী।",
    ),
    lines: [
      `d(S, M) = \\dfrac{|${fmt(d.a)}(${fmt(focus[0])}) ${signed(d.b)}(${fmt(focus[1])}) ${signed(d.c)}|}{${sqrtTex(d.a * d.a + d.b * d.b)}} = ${fmt(2 * a)}`,
      `a = \\dfrac{d(S, M)}{2} = \\dfrac{${fmt(2 * a)}}{2} = ${fmt(a)}`,
      `A = S - a\\hat{u} = (${fmt(focus[0])} - ${fmt(a)}\\cdot ${fmt(u[0])},\\; ${fmt(focus[1])} - ${fmt(a)}\\cdot ${fmt(u[1])}) = (${fmt(vertex[0])},\\; ${fmt(vertex[1])})`,
      trt`\\text{অক্ষরেখা}: ${lineTex(res.axis)}`,
    ],
  });
  steps.push({
    title: trs("ধাপ ১১ — উপকেন্দ্রিক লম্ব (Latus Rectum)"),
    note: trs("উপকেন্দ্রগামী, অক্ষের উপর লম্ব জ্যা-এর দৈর্ঘ্য 4a।"),
    lines: [
      trt`\\text{দৈর্ঘ্য} = 4a = 4 \\times ${fmt(a)} = ${fmt(4 * a)}`,
      `L_1 = (${fmt(latusEnds[0][0])},\\; ${fmt(latusEnds[0][1])}), \\qquad L_2 = (${fmt(latusEnds[1][0])},\\; ${fmt(latusEnds[1][1])})`,
      trt`\\text{উপকেন্দ্রিক লম্বের সমীকরণ}: ${lineTex({ a: d.a, b: d.b, c: -(d.a * focus[0] + d.b * focus[1]) })}`,
    ],
  });
  steps.push({
    title: trs("ধাপ ১২ — উপকেন্দ্রিক দূরত্ব"),
    note: trs("যেকোনো বিন্দু P(x, y) এর উপকেন্দ্রিক দূরত্ব = নিয়ামক থেকে তার লম্ব দূরত্ব।"),
    lines: [
      `SP = PM = \\dfrac{|${fmt(d.a)}x ${signed(d.b)}y ${signed(d.c)}|}{${sqrtTex(d.a * d.a + d.b * d.b)}}`,
      trt`\\text{শীর্ষে } SP = a = ${fmt(a)}`,
    ],
  });
  return steps;
}

function facts(res: AdvResult): Fact[] {
  const { focus, vertex, a, latusEnds } = res;
  return [
    { label: trs("উপকেন্দ্র S"), tex: `(${fmt(focus[0])},\\; ${fmt(focus[1])})`, color: "#f59e0b" },
    {
      label: trs("শীর্ষবিন্দু A"),
      tex: `(${fmt(vertex[0])},\\; ${fmt(vertex[1])})`,
      color: "#ef4444",
    },
    { label: trs("নিয়ামক রেখা"), tex: lineTex(res.directrix), color: "#22c55e" },
    { label: trs("অক্ষরেখা"), tex: lineTex(res.axis), color: "#0ea5e9" },
    { label: trs("উপকেন্দ্রিক দূরত্ব a"), tex: fmt(a), color: "#a78bfa" },
    { label: trs("উপকেন্দ্রিক লম্ব"), tex: `4a = ${fmt(4 * a)}`, color: "#d946ef" },
    {
      label: trs("লম্বের প্রান্তবিন্দু"),
      tex: `(${fmt(latusEnds[0][0])},\\; ${fmt(latusEnds[0][1])}),\\; (${fmt(latusEnds[1][0])},\\; ${fmt(latusEnds[1][1])})`,
      color: "#ec4899",
    },
    { label: trs("উৎকেন্দ্রিকতা e"), tex: "1", color: "#29d3b0" },
    { label: trs("ঘূর্ণন কোণ"), tex: `${fmt(res.rotationDeg)}^\\circ`, color: "#48a9ff" },
  ];
}

function standardFormSteps(c: PolyCoefs): { steps: StepBlock[]; focus: Pt; directrix: Line } {
  const steps: StepBlock[] = [];
  const disc = c.B * c.B - 4 * c.A * c.C;
  steps.push({
    title: trs("ধাপ ১ — সমীকরণের প্রকৃতি যাচাই"),
    note: trs("B² − 4AC = 0 হলে বক্ররেখাটি পরাবৃত্ত।"),
    lines: [
      `${conicTex(c)}`,
      `A = ${fmt(c.A)},\\; B = ${fmt(c.B)},\\; C = ${fmt(c.C)},\\; D = ${fmt(c.D)},\\; E = ${fmt(c.E)},\\; F = ${fmt(c.F)}`,
      `B^2 - 4AC = ${fmt(disc)}`,
    ],
  });
  if (Math.abs(disc) > 1e-6) throw new Error(trs("এই সমীকরণটি পরাবৃত্ত নয় (B² − 4AC ≠ 0)"));
  if (Math.abs(c.B) > 1e-8)
    throw new Error(trs("ঘূর্ণিত সাধারণ সমীকরণের জন্য Type B/C/D ব্যবহার করুন"));

  if (Math.abs(c.A) > 1e-8 && Math.abs(c.C) < 1e-8) {
    if (Math.abs(c.E) < 1e-8) throw new Error(trs("এটি পরাবৃত্ত নয়, সরলরেখা যুগল"));
    const A = c.A;
    const h = -c.D / (2 * A);
    steps.push({
      title: trs("ধাপ ২ — x পদগুলোর পূর্ণবর্গ করা"),
      note: trs("x² এর সহগ দিয়ে ভাগ করে পূর্ণবর্গ গঠন করা হলো।"),
      lines: [
        `${fmt(A)}x^2 ${signed(c.D)}x = -\\left(${fmt(c.E)}y ${signed(c.F)}\\right)`,
        `x^2 ${signed(c.D / A)}x = -\\dfrac{${fmt(c.E)}y ${signed(c.F)}}{${fmt(A)}}`,
        `x^2 ${signed(c.D / A)}x + \\left(${fmt(c.D / (2 * A))}\\right)^2 = -\\dfrac{${fmt(c.E)}y ${signed(c.F)}}{${fmt(A)}} + ${fmt((c.D / (2 * A)) ** 2)}`,
        `(x ${signed(c.D / (2 * A))})^2 = ${fmt(-c.E / A)}y ${signed(-c.F / A + (c.D / (2 * A)) ** 2)}`,
      ],
    });
    const four = -c.E / A;
    const kk = -(-c.F / A + (c.D / (2 * A)) ** 2) / four;
    const a = Math.abs(four) / 4;
    const dirDir = four > 0 ? 1 : -1;
    steps.push({
      title: trs("ধাপ ৩ — আদর্শ আকার"),
      note: trs("(x − h)² = 4a(y − k) আকারে সাজানো হলো।"),
      lines: [
        `(x ${signed(-h)})^2 = ${fmt(four)}\\left(y ${signed(-kk)}\\right)`,
        `4a = ${fmt(Math.abs(four))} \\Rightarrow a = ${fmt(a)}`,
      ],
    });
    const focus: Pt = [h, kk + dirDir * a];
    const directrix: Line = { a: 0, b: 1, c: -(kk - dirDir * a) };
    return { steps, focus, directrix };
  }

  if (Math.abs(c.C) > 1e-8 && Math.abs(c.A) < 1e-8) {
    if (Math.abs(c.D) < 1e-8) throw new Error(trs("এটি পরাবৃত্ত নয়, সরলরেখা যুগল"));
    const C = c.C;
    const kk = -c.E / (2 * C);
    steps.push({
      title: trs("ধাপ ২ — y পদগুলোর পূর্ণবর্গ করা"),
      note: trs("y² এর সহগ দিয়ে ভাগ করে পূর্ণবর্গ গঠন করা হলো।"),
      lines: [
        `${fmt(C)}y^2 ${signed(c.E)}y = -\\left(${fmt(c.D)}x ${signed(c.F)}\\right)`,
        `y^2 ${signed(c.E / C)}y = -\\dfrac{${fmt(c.D)}x ${signed(c.F)}}{${fmt(C)}}`,
        `y^2 ${signed(c.E / C)}y + \\left(${fmt(c.E / (2 * C))}\\right)^2 = -\\dfrac{${fmt(c.D)}x ${signed(c.F)}}{${fmt(C)}} + ${fmt((c.E / (2 * C)) ** 2)}`,
        `(y ${signed(c.E / (2 * C))})^2 = ${fmt(-c.D / C)}x ${signed(-c.F / C + (c.E / (2 * C)) ** 2)}`,
      ],
    });
    const four = -c.D / C;
    const h = -(-c.F / C + (c.E / (2 * C)) ** 2) / four;
    const a = Math.abs(four) / 4;
    const dirDir = four > 0 ? 1 : -1;
    steps.push({
      title: trs("ধাপ ৩ — আদর্শ আকার"),
      note: trs("(y − k)² = 4a(x − h) আকারে সাজানো হলো।"),
      lines: [
        `(y ${signed(-kk)})^2 = ${fmt(four)}\\left(x ${signed(-h)}\\right)`,
        `4a = ${fmt(Math.abs(four))} \\Rightarrow a = ${fmt(a)}`,
      ],
    });
    const focus: Pt = [h + dirDir * a, kk];
    const directrix: Line = { a: 1, b: 0, c: -(h - dirDir * a) };
    return { steps, focus, directrix };
  }

  throw new Error(trs("সমীকরণে x² অথবা y² যেকোনো একটি থাকতে হবে"));
}

const BENGALI_DIGITS = "০১২৩৪৫৬৭৮৯";
const stepNumber = (n: number) =>
  getActiveLang() === "en"
    ? String(n)
    : String(n)
        .split("")
        .map((d) => BENGALI_DIGITS[Number(d)])
        .join("");

export function renumber(steps: StepBlock[]): StepBlock[] {
  return steps.map((s, i) => ({
    ...s,
    title: s.title.replace(
      /^(ধাপ|যাচাই ধাপ|Step|Verification Step)\s*[০-৯0-9]+/,
      trt`ধাপ ${stepNumber(i + 1)}`,
    ),
  }));
}

export function solveAdvanced(input: AdvInput): AdvResult {
  if (input.kind === "A") {
    const coefs = coefsFromEquation(input.equation);
    if ([coefs.A, coefs.B, coefs.C].every((v) => Math.abs(v) < 1e-10))
      throw new Error(trs("এটি দ্বিঘাত সমীকরণ নয়"));
    const pre = standardFormSteps(reduce(coefs));
    const res = buildCore(pre.focus, pre.directrix);
    res.steps = [
      ...pre.steps,
      ...derivationSteps(pre.focus, pre.directrix, res),
      ...propertySteps(res),
    ];
    res.steps = renumber(res.steps);
    res.facts = facts(res);
    return res;
  }

  if (input.kind === "B") {
    const res = buildCore(input.focus, input.directrix);
    res.steps = [...derivationSteps(input.focus, input.directrix, res), ...propertySteps(res)];
    res.steps = renumber(res.steps);
    res.facts = facts(res);
    return res;
  }

  if (input.kind === "C") {
    const d = input.directrix;
    const k = d.a * d.a + d.b * d.b;
    const norm = Math.sqrt(k);
    const sd = (d.a * input.vertex[0] + d.b * input.vertex[1] + d.c) / norm;
    if (Math.abs(sd) < 1e-8) throw new Error(trs("শীর্ষবিন্দু নিয়ামক রেখার উপরে থাকতে পারে না"));
    const sgn = sd > 0 ? 1 : -1;
    const u: Pt = [(sgn * d.a) / norm, (sgn * d.b) / norm];
    const a = Math.abs(sd);
    const focus: Pt = [input.vertex[0] + a * u[0], input.vertex[1] + a * u[1]];
    const res = buildCore(focus, d);
    const pre: StepBlock = {
      title: trs("ধাপ ০ — শীর্ষ ও নিয়ামক থেকে উপকেন্দ্র নির্ণয়"),
      note: trs(
        "শীর্ষ নিয়ামক ও উপকেন্দ্রের ঠিক মধ্যবিন্দু, তাই উপকেন্দ্র = শীর্ষ থেকে সমান দূরত্বে নিয়ামকের বিপরীত দিকে।",
      ),
      lines: [
        `a = d(A, M) = \\dfrac{|${fmt(d.a)}(${fmt(input.vertex[0])}) ${signed(d.b)}(${fmt(input.vertex[1])}) ${signed(d.c)}|}{${sqrtTex(k)}} = ${fmt(a)}`,
        `\\hat{u} = \\left(${fmt(u[0])},\\; ${fmt(u[1])}\\right)`,
        `S = A + a\\hat{u} = (${fmt(focus[0])},\\; ${fmt(focus[1])})`,
      ],
    };
    res.steps = [pre, ...derivationSteps(focus, d, res), ...propertySteps(res)];
    res.steps = renumber(res.steps);
    res.facts = facts(res);
    return res;
  }

  const S = input.focus;
  const V = input.vertex;
  const dx = S[0] - V[0];
  const dy = S[1] - V[1];
  const a = Math.hypot(dx, dy);
  if (a < 1e-8) throw new Error(trs("উপকেন্দ্র ও শীর্ষবিন্দু একই বিন্দু হতে পারে না"));
  const u: Pt = [dx / a, dy / a];
  const Q: Pt = [V[0] - a * u[0], V[1] - a * u[1]];
  const d: Line = rationalizeLine({ a: u[0], b: u[1], c: -dot(u, Q) });
  const res = buildCore(S, d);
  const pre: StepBlock = {
    title: trs("ধাপ ০ — উপকেন্দ্র ও শীর্ষ থেকে নিয়ামক নির্ণয়"),
    note: trs("নিয়ামক অক্ষরেখার উপর লম্ব এবং শীর্ষ থেকে a দূরত্বে উপকেন্দ্রের বিপরীত পাশে।"),
    lines: [
      `a = |AS| = \\sqrt{(${fmt(S[0])} ${signed(-V[0])})^2 + (${fmt(S[1])} ${signed(-V[1])})^2} = ${fmt(a)}`,
      `\\hat{u} = \\left(\\dfrac{${fmt(dx)}}{${fmt(a)}},\\; \\dfrac{${fmt(dy)}}{${fmt(a)}}\\right) = (${fmt(u[0])},\\; ${fmt(u[1])})`,
      trt`Q = A - a\\hat{u} = (${fmt(Q[0])},\\; ${fmt(Q[1])}) \\quad \\text{(নিয়ামকের পাদবিন্দু)}`,
      trt`\\text{নিয়ামক}: ${lineTex(d)}`,
    ],
  };
  res.steps = renumber([pre, ...derivationSteps(S, d, res), ...propertySteps(res)]);
  res.facts = facts(res);
  return res;
}

export function pointOnParabola(res: AdvResult, t: number): Pt {
  const { vertex, u, v, a } = res;
  const s = (t * t) / (4 * a);
  return [vertex[0] + s * u[0] + t * v[0], vertex[1] + s * u[1] + t * v[1]];
}

export function footOnDirectrix(p: Pt, d: Line): Pt {
  const k = d.a * d.a + d.b * d.b;
  const t = (d.a * p[0] + d.b * p[1] + d.c) / k;
  return [p[0] - d.a * t, p[1] - d.b * t];
}
