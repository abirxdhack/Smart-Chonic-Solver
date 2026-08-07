import { trs, trt } from "@/i18n";
import { sanitize } from "./parser";

export type PolyCoefs = {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
};

export type SolveStep = {
  title: string;
  explanation: string;
  math: string[];
};

export type ParabolaSolution = {
  kind: "parabola";
  orientation: "x" | "y";
  opens: "right" | "left" | "up" | "down";
  A: number;
  alpha: number;
  beta: number;
  standard: string;
  transformed: string;
  items: SolutionItem[];
};

export type CentralSolution = {
  kind: "ellipse" | "hyperbola";
  orientation: "horizontal" | "vertical";
  a: number;
  b: number;
  c: number;
  e: number;
  alpha: number;
  beta: number;
  standard: string;
  transformed: string;
  items: SolutionItem[];
};

export type SolutionItem = {
  label: string;
  value: string;
  note?: string;
};

export type SolveResult =
  | { ok: true; steps: SolveStep[]; solution: ParabolaSolution | CentralSolution; coefs: PolyCoefs }
  | { ok: false; error: string; suggestion?: string };

const EPS = 1e-9;

function fmt(n: number): string {
  if (!isFinite(n)) return "∞";
  if (Math.abs(n) < 1e-10) return "0";
  if (Number.isInteger(n)) return String(n);
  const r = +n.toFixed(4);
  return r.toString();
}

function signStr(n: number): string {
  return n >= 0 ? "+" : "−";
}

function signedTerm(coef: number, varStr: string): string {
  if (Math.abs(coef) < EPS) return "";
  const abs = Math.abs(coef);
  const cStr = abs === 1 && varStr ? "" : fmt(abs);
  return `${signStr(coef)} ${cStr}${varStr}`;
}

function polyToString(c: PolyCoefs): string {
  const parts: string[] = [];
  const push = (coef: number, v: string) => {
    if (Math.abs(coef) < EPS) return;
    if (parts.length === 0) {
      const s = coef < 0 ? "−" : "";
      const abs = Math.abs(coef);
      const cStr = abs === 1 && v ? "" : fmt(abs);
      parts.push(`${s}${cStr}${v}`);
    } else {
      parts.push(signedTerm(coef, v));
    }
  };
  push(c.A, "x²");
  push(c.B, "xy");
  push(c.C, "y²");
  push(c.D, "x");
  push(c.E, "y");
  push(c.F, "");
  return parts.length > 0 ? parts.join(" ") + " = 0" : "0 = 0";
}

export function coefsFromEquation(raw: string): PolyCoefs {
  const { text } = sanitize(raw);
  if (!text.includes("=")) throw new Error(trs("সমান চিহ্ন (=) অনুপস্থিত"));
  const [lhs, rhs] = text.split("=");
  const l = parsePolySide(lhs);
  const r = parsePolySide(rhs);
  return {
    A: l.A - r.A,
    B: l.B - r.B,
    C: l.C - r.C,
    D: l.D - r.D,
    E: l.E - r.E,
    F: l.F - r.F,
  };
}

type Poly = { A: number; B: number; C: number; D: number; E: number; F: number };
const zero = (): Poly => ({ A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 });
const konst = (v: number): Poly => ({ ...zero(), F: v });
const px = (): Poly => ({ ...zero(), D: 1 });
const py = (): Poly => ({ ...zero(), E: 1 });

function add(a: Poly, b: Poly): Poly {
  return { A: a.A + b.A, B: a.B + b.B, C: a.C + b.C, D: a.D + b.D, E: a.E + b.E, F: a.F + b.F };
}
function neg(a: Poly): Poly {
  return { A: -a.A, B: -a.B, C: -a.C, D: -a.D, E: -a.E, F: -a.F };
}
function scale(a: Poly, s: number): Poly {
  return { A: a.A * s, B: a.B * s, C: a.C * s, D: a.D * s, E: a.E * s, F: a.F * s };
}
function deg(p: Poly): number {
  if (Math.abs(p.A) > EPS || Math.abs(p.B) > EPS || Math.abs(p.C) > EPS) return 2;
  if (Math.abs(p.D) > EPS || Math.abs(p.E) > EPS) return 1;
  return 0;
}
function mul(a: Poly, b: Poly): Poly {
  if (deg(a) + deg(b) > 2) throw new Error(trs("সমীকরণের ঘাত ২-এর বেশি হতে পারবে না"));
  return {
    A: a.F * b.A + a.A * b.F + a.D * b.D,
    B: a.F * b.B + a.B * b.F + a.D * b.E + a.E * b.D,
    C: a.F * b.C + a.C * b.F + a.E * b.E,
    D: a.F * b.D + a.D * b.F,
    E: a.F * b.E + a.E * b.F,
    F: a.F * b.F,
  };
}
function powP(base: Poly, e: number): Poly {
  if (e === 0) return konst(1);
  if (e === 1) return base;
  if (e === 2) return mul(base, base);
  throw new Error(trs("ঘাত অবশ্যই 0, 1 বা 2 হতে হবে"));
}
function divConst(a: Poly, b: Poly): Poly {
  if (deg(b) !== 0) throw new Error(trs("চলক দিয়ে ভাগ সমর্থিত নয়"));
  if (Math.abs(b.F) < EPS) throw new Error(trs("শূন্য দিয়ে ভাগ"));
  return scale(a, 1 / b.F);
}

type Tok =
  | { t: "num"; v: number }
  | { t: "var"; v: "x" | "y" }
  | { t: "op"; v: "+" | "-" | "*" | "/" | "^" }
  | { t: "lp" }
  | { t: "rp" };

function tokenize(s: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (ch === "(") {
      out.push({ t: "lp" });
      i++;
      continue;
    }
    if (ch === ")") {
      out.push({ t: "rp" });
      i++;
      continue;
    }
    if ("+-*/^".includes(ch)) {
      out.push({ t: "op", v: ch as "+" });
      i++;
      continue;
    }
    if (ch === "x" || ch === "y") {
      out.push({ t: "var", v: ch });
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      out.push({ t: "num", v: parseFloat(s.slice(i, j)) });
      i = j;
      continue;
    }
    throw new Error(trt`অপরিচিত অক্ষর: "${ch}"`);
  }
  return out;
}

class SideParser {
  toks: Tok[];
  pos = 0;
  constructor(t: Tok[]) {
    this.toks = t;
  }
  peek() {
    return this.toks[this.pos];
  }
  eat() {
    return this.toks[this.pos++];
  }
  eof() {
    return this.pos >= this.toks.length;
  }
  expr(): Poly {
    let left = this.term();
    while (!this.eof()) {
      const p = this.peek();
      if (p.t === "op" && (p.v === "+" || p.v === "-")) {
        this.eat();
        const r = this.term();
        left = p.v === "+" ? add(left, r) : add(left, neg(r));
      } else break;
    }
    return left;
  }
  term(): Poly {
    let left = this.unary();
    while (!this.eof()) {
      const p = this.peek();
      if (p.t === "op" && (p.v === "*" || p.v === "/")) {
        this.eat();
        const r = this.unary();
        left = p.v === "*" ? mul(left, r) : divConst(left, r);
      } else if (p.t === "num" || p.t === "var" || p.t === "lp") {
        const r = this.unary();
        left = mul(left, r);
      } else break;
    }
    return left;
  }
  unary(): Poly {
    const p = this.peek();
    if (p && p.t === "op" && (p.v === "+" || p.v === "-")) {
      this.eat();
      const v = this.power();
      return p.v === "-" ? neg(v) : v;
    }
    return this.power();
  }
  power(): Poly {
    const base = this.atom();
    if (!this.eof()) {
      const p = this.peek();
      if (p.t === "op" && p.v === "^") {
        this.eat();
        let sign = 1;
        const nx = this.peek();
        if (nx && nx.t === "op" && (nx.v === "+" || nx.v === "-")) {
          if (nx.v === "-") sign = -1;
          this.eat();
        }
        const ex = this.eat();
        if (!ex || ex.t !== "num") throw new Error(trs("ঘাতের পরে সংখ্যা থাকতে হবে"));
        return powP(base, sign * ex.v);
      }
    }
    return base;
  }
  atom(): Poly {
    if (this.eof()) throw new Error(trs("সমীকরণ অসম্পূর্ণ"));
    const p = this.eat();
    if (p.t === "num") return konst(p.v);
    if (p.t === "var") return p.v === "x" ? px() : py();
    if (p.t === "lp") {
      const inner = this.expr();
      const close = this.eat();
      if (!close || close.t !== "rp") throw new Error(trs("বন্ধনী মেলেনি"));
      return inner;
    }
    throw new Error(trs("অপ্রত্যাশিত টোকেন"));
  }
}

function parsePolySide(s: string): Poly {
  if (!s) throw new Error(trs("সমীকরণের একটি পাশ ফাঁকা"));
  const p = new SideParser(tokenize(s));
  const v = p.expr();
  if (!p.eof()) throw new Error(trs("অতিরিক্ত টোকেন"));
  return v;
}

function parabolaItems(sol: {
  orientation: "x" | "y";
  A: number;
  alpha: number;
  beta: number;
}): SolutionItem[] {
  const { orientation, A, alpha, beta } = sol;
  const absA = Math.abs(A);
  const items: SolutionItem[] = [];
  if (orientation === "x") {
    items.push({
      label: trs("শীর্ষবিন্দু"),
      value: `(${fmt(alpha)}, ${fmt(beta)})`,
      note: "X = 0, Y = 0 ⇒ x = α, y = β",
    });
    items.push({
      label: trs("উপকেন্দ্র"),
      value: `(${fmt(alpha + A)}, ${fmt(beta)})`,
      note: "X = A, Y = 0 ⇒ x = α + A",
    });
    items.push({
      label: trs("নিয়ামকের পাদবিন্দু"),
      value: `(${fmt(alpha - A)}, ${fmt(beta)})`,
      note: "X = −A, Y = 0",
    });
    items.push({ label: trs("অক্ষরেখার সমীকরণ"), value: `y = ${fmt(beta)}`, note: "Y = 0" });
    items.push({
      label: trs("নিয়ামক রেখার সমীকরণ"),
      value: `x = ${fmt(alpha - A)}`,
      note: "X = −A",
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের সমীকরণ"),
      value: `x = ${fmt(alpha + A)}`,
      note: "X = A",
    });
    items.push({ label: trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"), value: fmt(4 * absA), note: "|4A|" });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের প্রান্তবিন্দু"),
      value: trt`(${fmt(alpha + A)}, ${fmt(beta + 2 * absA)}) ও (${fmt(alpha + A)}, ${fmt(beta - 2 * absA)})`,
      note: "X = A, Y = ±2|A|",
    });
    items.push({
      label: trs("শীর্ষে স্পর্শকের সমীকরণ"),
      value: `x = ${fmt(alpha)}`,
      note: "X = 0",
    });
  } else {
    items.push({ label: trs("শীর্ষবিন্দু"), value: `(${fmt(alpha)}, ${fmt(beta)})` });
    items.push({
      label: trs("উপকেন্দ্র"),
      value: `(${fmt(alpha)}, ${fmt(beta + A)})`,
      note: "Y = A",
    });
    items.push({ label: trs("নিয়ামকের পাদবিন্দু"), value: `(${fmt(alpha)}, ${fmt(beta - A)})` });
    items.push({ label: trs("অক্ষরেখার সমীকরণ"), value: `x = ${fmt(alpha)}`, note: "X = 0" });
    items.push({
      label: trs("নিয়ামক রেখার সমীকরণ"),
      value: `y = ${fmt(beta - A)}`,
      note: "Y = −A",
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের সমীকরণ"),
      value: `y = ${fmt(beta + A)}`,
      note: "Y = A",
    });
    items.push({ label: trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"), value: fmt(4 * absA) });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের প্রান্তবিন্দু"),
      value: trt`(${fmt(alpha + 2 * absA)}, ${fmt(beta + A)}) ও (${fmt(alpha - 2 * absA)}, ${fmt(beta + A)})`,
    });
    items.push({ label: trs("শীর্ষে স্পর্শকের সমীকরণ"), value: `y = ${fmt(beta)}` });
  }
  return items;
}

function ellipseItems(o: {
  orientation: "horizontal" | "vertical";
  a: number;
  b: number;
  c: number;
  e: number;
  alpha: number;
  beta: number;
}): SolutionItem[] {
  const { orientation, a, b, c, e, alpha, beta } = o;
  const items: SolutionItem[] = [];
  items.push({ label: trs("কেন্দ্র"), value: `(${fmt(alpha)}, ${fmt(beta)})` });
  items.push({
    label: trs("উৎকেন্দ্রিকতা (e)"),
    value: fmt(e),
    note: orientation === "horizontal" ? "e = √(1 − b²/a²)" : "e = √(1 − a²/b²)",
  });
  if (orientation === "horizontal") {
    items.push({ label: trs("বৃহৎ অক্ষের দৈর্ঘ্য"), value: fmt(2 * a), note: "2a" });
    items.push({ label: trs("ক্ষুদ্র অক্ষের দৈর্ঘ্য"), value: fmt(2 * b), note: "2b" });
    items.push({ label: trs("বৃহৎ অক্ষের সমীকরণ"), value: `y = ${fmt(beta)}` });
    items.push({ label: trs("ক্ষুদ্র অক্ষের সমীকরণ"), value: `x = ${fmt(alpha)}` });
    items.push({
      label: trs("শীর্ষদ্বয়"),
      value: trt`(${fmt(alpha + a)}, ${fmt(beta)}) ও (${fmt(alpha - a)}, ${fmt(beta)})`,
    });
    items.push({
      label: trs("ফোকাসদ্বয় (উপকেন্দ্র)"),
      value: trt`(${fmt(alpha + c)}, ${fmt(beta)}) ও (${fmt(alpha - c)}, ${fmt(beta)})`,
      note: "c = ae = √(a² − b²)",
    });
    items.push({ label: trs("ফোকাসদ্বয়ের দূরত্ব"), value: fmt(2 * c), note: "2ae" });
    items.push({
      label: trs("নিয়ামক রেখার পাদবিন্দু"),
      value: trt`(±${fmt(a / e)}, 0) থেকে স্থানান্তরিত`,
    });
    items.push({ label: trs("নিয়ামক রেখাদ্বয়ের দূরত্ব"), value: fmt((2 * a) / e), note: "2a/e" });
    items.push({
      label: trs("নিয়ামক রেখার সমীকরণ"),
      value: trt`x = ${fmt(alpha + a / e)}  ও  x = ${fmt(alpha - a / e)}`,
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"),
      value: fmt((2 * b * b) / a),
      note: "2b²/a",
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের সমীকরণ"),
      value: trt`x = ${fmt(alpha + c)}  ও  x = ${fmt(alpha - c)}`,
    });
  } else {
    items.push({ label: trs("বৃহৎ অক্ষের দৈর্ঘ্য"), value: fmt(2 * b), note: "2b" });
    items.push({ label: trs("ক্ষুদ্র অক্ষের দৈর্ঘ্য"), value: fmt(2 * a), note: "2a" });
    items.push({ label: trs("বৃহৎ অক্ষের সমীকরণ"), value: `x = ${fmt(alpha)}` });
    items.push({ label: trs("ক্ষুদ্র অক্ষের সমীকরণ"), value: `y = ${fmt(beta)}` });
    items.push({
      label: trs("শীর্ষদ্বয়"),
      value: trt`(${fmt(alpha)}, ${fmt(beta + b)}) ও (${fmt(alpha)}, ${fmt(beta - b)})`,
    });
    items.push({
      label: trs("ফোকাসদ্বয় (উপকেন্দ্র)"),
      value: trt`(${fmt(alpha)}, ${fmt(beta + c)}) ও (${fmt(alpha)}, ${fmt(beta - c)})`,
      note: "c = be = √(b² − a²)",
    });
    items.push({ label: trs("ফোকাসদ্বয়ের দূরত্ব"), value: fmt(2 * c), note: "2be" });
    items.push({ label: trs("নিয়ামক রেখাদ্বয়ের দূরত্ব"), value: fmt((2 * b) / e), note: "2b/e" });
    items.push({
      label: trs("নিয়ামক রেখার সমীকরণ"),
      value: trt`y = ${fmt(beta + b / e)}  ও  y = ${fmt(beta - b / e)}`,
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"),
      value: fmt((2 * a * a) / b),
      note: "2a²/b",
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের সমীকরণ"),
      value: trt`y = ${fmt(beta + c)}  ও  y = ${fmt(beta - c)}`,
    });
  }
  return items;
}

function hyperbolaItems(o: {
  orientation: "horizontal" | "vertical";
  a: number;
  b: number;
  c: number;
  e: number;
  alpha: number;
  beta: number;
}): SolutionItem[] {
  const { orientation, a, b, c, e, alpha, beta } = o;
  const items: SolutionItem[] = [];
  items.push({ label: trs("কেন্দ্র"), value: `(${fmt(alpha)}, ${fmt(beta)})` });
  items.push({
    label: trs("উৎকেন্দ্রিকতা (e)"),
    value: fmt(e),
    note: orientation === "horizontal" ? "e = √(1 + b²/a²)" : "e = √(1 + a²/b²)",
  });
  if (orientation === "horizontal") {
    items.push({ label: trs("আড় অক্ষের দৈর্ঘ্য"), value: fmt(2 * a), note: "2a" });
    items.push({ label: trs("অনুবন্ধী অক্ষের দৈর্ঘ্য"), value: fmt(2 * b), note: "2b" });
    items.push({ label: trs("আড় অক্ষের সমীকরণ"), value: `y = ${fmt(beta)}` });
    items.push({ label: trs("অনুবন্ধী অক্ষের সমীকরণ"), value: `x = ${fmt(alpha)}` });
    items.push({
      label: trs("শীর্ষদ্বয়"),
      value: trt`(${fmt(alpha + a)}, ${fmt(beta)}) ও (${fmt(alpha - a)}, ${fmt(beta)})`,
    });
    items.push({
      label: trs("ফোকাসদ্বয়"),
      value: trt`(${fmt(alpha + c)}, ${fmt(beta)}) ও (${fmt(alpha - c)}, ${fmt(beta)})`,
      note: "c = ae = √(a² + b²)",
    });
    items.push({ label: trs("ফোকাসদ্বয়ের দূরত্ব"), value: fmt(2 * c), note: "2ae" });
    items.push({ label: trs("নিয়ামক রেখাদ্বয়ের দূরত্ব"), value: fmt((2 * a) / e), note: "2a/e" });
    items.push({
      label: trs("নিয়ামক রেখার সমীকরণ"),
      value: trt`x = ${fmt(alpha + a / e)}  ও  x = ${fmt(alpha - a / e)}`,
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"),
      value: fmt((2 * b * b) / a),
      note: "2b²/a",
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের সমীকরণ"),
      value: trt`x = ${fmt(alpha + c)}  ও  x = ${fmt(alpha - c)}`,
    });
    items.push({
      label: trs("অসীমতটরেখা"),
      value: `y − ${fmt(beta)} = ±${fmt(b / a)}(x − ${fmt(alpha)})`,
      note: "Y = ±(b/a)X",
    });
  } else {
    items.push({ label: trs("আড় অক্ষের দৈর্ঘ্য"), value: fmt(2 * b), note: "2b" });
    items.push({ label: trs("অনুবন্ধী অক্ষের দৈর্ঘ্য"), value: fmt(2 * a), note: "2a" });
    items.push({ label: trs("আড় অক্ষের সমীকরণ"), value: `x = ${fmt(alpha)}` });
    items.push({ label: trs("অনুবন্ধী অক্ষের সমীকরণ"), value: `y = ${fmt(beta)}` });
    items.push({
      label: trs("শীর্ষদ্বয়"),
      value: trt`(${fmt(alpha)}, ${fmt(beta + b)}) ও (${fmt(alpha)}, ${fmt(beta - b)})`,
    });
    items.push({
      label: trs("ফোকাসদ্বয়"),
      value: trt`(${fmt(alpha)}, ${fmt(beta + c)}) ও (${fmt(alpha)}, ${fmt(beta - c)})`,
      note: "c = be",
    });
    items.push({ label: trs("ফোকাসদ্বয়ের দূরত্ব"), value: fmt(2 * c), note: "2be" });
    items.push({ label: trs("নিয়ামক রেখাদ্বয়ের দূরত্ব"), value: fmt((2 * b) / e), note: "2b/e" });
    items.push({
      label: trs("নিয়ামক রেখার সমীকরণ"),
      value: trt`y = ${fmt(beta + b / e)}  ও  y = ${fmt(beta - b / e)}`,
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"),
      value: fmt((2 * a * a) / b),
      note: "2a²/b",
    });
    items.push({
      label: trs("উপকেন্দ্রিক লম্বের সমীকরণ"),
      value: trt`y = ${fmt(beta + c)}  ও  y = ${fmt(beta - c)}`,
    });
    items.push({
      label: trs("অসীমতটরেখা"),
      value: `y − ${fmt(beta)} = ±${fmt(a / b)}(x − ${fmt(alpha)})`,
      note: "Y = ±(a/b)X",
    });
  }
  return items;
}

export function solveGeneral(raw: string): SolveResult {
  try {
    const { text, changed } = sanitize(raw);
    if (!raw.trim())
      return {
        ok: false,
        error: trs("সমীকরণ ফাঁকা"),
        suggestion: trs("উদাহরণ: y^2 = 4x + 4y − 8"),
      };
    const c = coefsFromEquation(raw);
    if (Math.abs(c.B) > 1e-6)
      return { ok: false, error: trs("xy পদযুক্ত (ঘূর্ণিত) কণিক সমর্থিত নয়") };

    const steps: SolveStep[] = [];
    steps.push({
      title: trs("১) প্রদত্ত সমীকরণ"),
      explanation: changed
        ? trt`স্বয়ংক্রিয়ভাবে সাধারণ রূপে আনা হলো: ${text}`
        : trs("প্রদত্ত সমীকরণ থেকে সরাসরি শুরু করছি।"),
      math: [raw, `⇒  ${polyToString(c)}`],
    });

    const { A: Ac, C: Cc, D: Dc, E: Ec, F: Fc } = c;

    if (Math.abs(Ac) < EPS && Math.abs(Cc) < EPS) {
      return {
        ok: false,
        error: trs("কণিক নয়: x² বা y² পদ নেই"),
        suggestion: trs("অন্তত একটি বর্গ পদ থাকতে হবে"),
      };
    }

    if (Math.abs(Ac) < EPS || Math.abs(Cc) < EPS) {
      const yPar = Math.abs(Ac) < EPS;
      if (yPar) {
        if (Math.abs(Dc) < EPS)
          return { ok: false, error: trs("পরাবৃত্ত অবৈধ: রৈখিক x পদ অনুপস্থিত") };
        const beta = -Ec / (2 * Cc);
        const halfCoefY = Ec / (2 * Cc);
        steps.push({
          title: trs("২) y-পদগুলোকে এক পাশে আনি"),
          explanation: `${fmt(Cc)}y² ${signStr(Ec)} ${fmt(Math.abs(Ec))}y = ${signStr(-Dc)} ${fmt(Math.abs(Dc))}x ${signStr(-Fc)} ${fmt(Math.abs(Fc))}`,
          math: [`${fmt(Cc)}y² + ${fmt(Ec)}y = −${fmt(Dc)}x − ${fmt(Fc)}`],
        });
        steps.push({
          title: trs("৩) উভয় পাশে C দিয়ে ভাগ"),
          explanation: trt`y-এর বর্গের সহগ 1 করে নিই।`,
          math: [`y² + ${fmt(Ec / Cc)}y = ${fmt(-Dc / Cc)}x + ${fmt(-Fc / Cc)}`],
        });
        const addTerm = halfCoefY * halfCoefY;
        steps.push({
          title: trs("৪) বর্গ সম্পূর্ণ করি"),
          explanation: trt`y-এর সহগের অর্ধেকের বর্গ = (${fmt(Ec / (2 * Cc))})² = ${fmt(addTerm)} — এটি উভয় পাশে যোগ করি।`,
          math: [
            `y² + ${fmt(Ec / Cc)}y + ${fmt(addTerm)} = ${fmt(-Dc / Cc)}x + ${fmt(-Fc / Cc)} + ${fmt(addTerm)}`,
          ],
        });
        const rhsConst = -Fc / Cc + addTerm;
        const xCoef = -Dc / Cc;
        const alpha = -rhsConst / xCoef;
        const fourA = xCoef;
        const A = fourA / 4;
        steps.push({
          title: trs("৫) বাম পাশে বর্গ, ডান পাশে x-এর ফ্যাক্টর"),
          explanation: trt`বাম পাশ পূর্ণবর্গ; ডান পাশে (x − α) আকৃতিতে সাজাই।`,
          math: [
            `(y ${signStr(halfCoefY)} ${fmt(Math.abs(halfCoefY))})² = ${fmt(xCoef)}(x ${signStr(-alpha)} ${fmt(Math.abs(alpha))})`,
          ],
        });
        steps.push({
          title: trs("৬) মূলধন চলক প্রতিস্থাপন"),
          explanation: trt`ধরি X = x − α, Y = y − β  অর্থাৎ  α = ${fmt(alpha)}, β = ${fmt(beta)}. তখন সমীকরণ হয় Y² = 4AX।`,
          math: [`Y² = ${fmt(fourA)}X`, `⇒ 4A = ${fmt(fourA)}  ⇒  A = ${fmt(A)}`],
        });
        const opens: "right" | "left" = A > 0 ? "right" : "left";
        const items = parabolaItems({ orientation: "x", A, alpha, beta });
        steps.push({
          title: trs("৭) X = x − α, Y = y − β বসিয়ে প্রতিটি উপাদান নির্ণয়"),
          explanation: trs("মূলধন চলক থেকে ছোট x, y-তে ফিরে গিয়ে প্রতিটি বৈশিষ্ট্য বের করা হলো।"),
          math: items.map((it) => `${it.label}: ${it.value}`),
        });
        const standard = `(y ${signStr(-beta)} ${fmt(Math.abs(beta))})² = ${fmt(fourA)}(x ${signStr(-alpha)} ${fmt(Math.abs(alpha))})`;
        return {
          ok: true,
          steps,
          coefs: c,
          solution: {
            kind: "parabola",
            orientation: "x",
            opens,
            A,
            alpha,
            beta,
            standard,
            transformed: `Y² = ${fmt(fourA)}X`,
            items,
          },
        };
      }
      if (Math.abs(Ec) < EPS)
        return { ok: false, error: trs("পরাবৃত্ত অবৈধ: রৈখিক y পদ অনুপস্থিত") };
      const alpha = -Dc / (2 * Ac);
      const halfCoefX = Dc / (2 * Ac);
      steps.push({
        title: trs("২) x-পদগুলোকে এক পাশে আনি"),
        explanation: `${fmt(Ac)}x² ${signStr(Dc)} ${fmt(Math.abs(Dc))}x = ${signStr(-Ec)} ${fmt(Math.abs(Ec))}y ${signStr(-Fc)} ${fmt(Math.abs(Fc))}`,
        math: [`${fmt(Ac)}x² + ${fmt(Dc)}x = −${fmt(Ec)}y − ${fmt(Fc)}`],
      });
      steps.push({
        title: trs("৩) উভয় পাশে A দিয়ে ভাগ"),
        explanation: trs("x-এর বর্গের সহগ 1 করি।"),
        math: [`x² + ${fmt(Dc / Ac)}x = ${fmt(-Ec / Ac)}y + ${fmt(-Fc / Ac)}`],
      });
      const addTerm = halfCoefX * halfCoefX;
      steps.push({
        title: trs("৪) বর্গ সম্পূর্ণ করি"),
        explanation: trt`x-এর সহগের অর্ধেকের বর্গ = ${fmt(addTerm)} — উভয় পাশে যোগ করি।`,
        math: [
          `x² + ${fmt(Dc / Ac)}x + ${fmt(addTerm)} = ${fmt(-Ec / Ac)}y + ${fmt(-Fc / Ac)} + ${fmt(addTerm)}`,
        ],
      });
      const rhsConst = -Fc / Ac + addTerm;
      const yCoef = -Ec / Ac;
      const beta = -rhsConst / yCoef;
      const fourA = yCoef;
      const A = fourA / 4;
      steps.push({
        title: trs("৫) বাম পাশে বর্গ, ডান পাশে y-এর ফ্যাক্টর"),
        explanation: trs("সাজিয়ে (x − α)² = 4A(y − β) আকৃতিতে আনি।"),
        math: [
          `(x ${signStr(halfCoefX)} ${fmt(Math.abs(halfCoefX))})² = ${fmt(yCoef)}(y ${signStr(-beta)} ${fmt(Math.abs(beta))})`,
        ],
      });
      steps.push({
        title: trs("৬) মূলধন চলক প্রতিস্থাপন"),
        explanation: trt`ধরি X = x − α, Y = y − β  ⇒  α = ${fmt(alpha)}, β = ${fmt(beta)}.`,
        math: [`X² = ${fmt(fourA)}Y`, `⇒ 4A = ${fmt(fourA)}  ⇒  A = ${fmt(A)}`],
      });
      const opens: "up" | "down" = A > 0 ? "up" : "down";
      const items = parabolaItems({ orientation: "y", A, alpha, beta });
      steps.push({
        title: trs("৭) প্রতিটি উপাদান নির্ণয়"),
        explanation: trs("X = x − α, Y = y − β বসিয়ে x, y-তে ফিরে গিয়ে সব উপাদান।"),
        math: items.map((it) => `${it.label}: ${it.value}`),
      });
      const standard = `(x ${signStr(-alpha)} ${fmt(Math.abs(alpha))})² = ${fmt(fourA)}(y ${signStr(-beta)} ${fmt(Math.abs(beta))})`;
      return {
        ok: true,
        steps,
        coefs: c,
        solution: {
          kind: "parabola",
          orientation: "y",
          opens,
          A,
          alpha,
          beta,
          standard,
          transformed: `X² = ${fmt(fourA)}Y`,
          items,
        },
      };
    }

    const alpha = -Dc / (2 * Ac);
    const beta = -Ec / (2 * Cc);
    const K = Ac * alpha * alpha + Cc * beta * beta - Fc;
    steps.push({
      title: trs("২) x ও y উভয়ের পদ গ্রুপ করি"),
      explanation: trt`${fmt(Ac)}x² ${signStr(Dc)} ${fmt(Math.abs(Dc))}x এবং ${fmt(Cc)}y² ${signStr(Ec)} ${fmt(Math.abs(Ec))}y দুই দলে ভাগ করি।`,
      math: [`${fmt(Ac)}(x² + ${fmt(Dc / Ac)}x) + ${fmt(Cc)}(y² + ${fmt(Ec / Cc)}y) = ${fmt(-Fc)}`],
    });
    steps.push({
      title: trs("৩) বর্গ সম্পূর্ণ করি (উভয় চলকে)"),
      explanation: trt`x-এর অর্ধেক সহগের বর্গ = ${fmt((Dc / (2 * Ac)) ** 2)}, y-এর অর্ধেক সহগের বর্গ = ${fmt((Ec / (2 * Cc)) ** 2)} যোগ করি।`,
      math: [
        `${fmt(Ac)}(x + ${fmt(Dc / (2 * Ac))})² + ${fmt(Cc)}(y + ${fmt(Ec / (2 * Cc))})² = ${fmt(K)}`,
      ],
    });
    steps.push({
      title: trs("৪) মূলধন চলক প্রতিস্থাপন"),
      explanation: trt`X = x − α, Y = y − β যেখানে α = ${fmt(alpha)}, β = ${fmt(beta)}।`,
      math: [`${fmt(Ac)}X² + ${fmt(Cc)}Y² = ${fmt(K)}`],
    });
    const pA = K / Ac;
    const pC = K / Cc;

    if (Ac * Cc > 0) {
      if (pA <= EPS || pC <= EPS)
        return {
          ok: false,
          error: trs("বাস্তব উপবৃত্ত নয়"),
          suggestion: trs("সহগ বা ধ্রুবকের চিহ্ন যাচাই করুন"),
        };
      const orientation: "horizontal" | "vertical" = pA >= pC ? "horizontal" : "vertical";
      const aSq = Math.max(pA, pC);
      const bSq = Math.min(pA, pC);
      const a = Math.sqrt(aSq);
      const b = Math.sqrt(bSq);
      const cc = Math.sqrt(aSq - bSq);
      const e = orientation === "horizontal" ? cc / a : cc / b;
      const standard =
        orientation === "horizontal"
          ? `(x ${signStr(-alpha)} ${fmt(Math.abs(alpha))})²/${fmt(aSq)} + (y ${signStr(-beta)} ${fmt(Math.abs(beta))})²/${fmt(bSq)} = 1`
          : `(x ${signStr(-alpha)} ${fmt(Math.abs(alpha))})²/${fmt(bSq)} + (y ${signStr(-beta)} ${fmt(Math.abs(beta))})²/${fmt(aSq)} = 1`;
      steps.push({
        title: trs("৫) প্রামাণ্য রূপ"),
        explanation: trt`উভয় পাশ K = ${fmt(K)} দিয়ে ভাগ করে প্রামাণ্য রূপে আনি।`,
        math: [
          `X²/${fmt(pA)} + Y²/${fmt(pC)} = 1`,
          `⇒ a² = ${fmt(aSq)},  b² = ${fmt(bSq)},  a = ${fmt(a)},  b = ${fmt(b)}`,
          `c = √(a² − b²) = ${fmt(cc)},  e = c/${orientation === "horizontal" ? "a" : "b"} = ${fmt(e)}`,
        ],
      });
      const items = ellipseItems({ orientation, a, b, c: cc, e, alpha, beta });
      steps.push({
        title: trs("৬) প্রতিটি উপাদান নির্ণয়"),
        explanation: trs("X = x − α, Y = y − β বসিয়ে সবগুলো নির্ণয় করা হলো।"),
        math: items.map((it) => `${it.label}: ${it.value}`),
      });
      return {
        ok: true,
        steps,
        coefs: c,
        solution: {
          kind: "ellipse",
          orientation,
          a,
          b,
          c: cc,
          e,
          alpha,
          beta,
          standard,
          transformed:
            orientation === "horizontal"
              ? `X²/${fmt(aSq)} + Y²/${fmt(bSq)} = 1`
              : `X²/${fmt(bSq)} + Y²/${fmt(aSq)} = 1`,
          items,
        },
      };
    }

    const orientation: "horizontal" | "vertical" = pA > 0 ? "horizontal" : "vertical";
    const aSq = orientation === "horizontal" ? pA : pC;
    const bSq = orientation === "horizontal" ? -pC : -pA;
    if (aSq <= EPS || bSq <= EPS) return { ok: false, error: trs("বাস্তব অধিবৃত্ত নয়") };
    const a = Math.sqrt(aSq);
    const b = Math.sqrt(bSq);
    const cc = Math.sqrt(aSq + bSq);
    const e = orientation === "horizontal" ? cc / a : cc / b;
    const standard =
      orientation === "horizontal"
        ? `(x ${signStr(-alpha)} ${fmt(Math.abs(alpha))})²/${fmt(aSq)} − (y ${signStr(-beta)} ${fmt(Math.abs(beta))})²/${fmt(bSq)} = 1`
        : `(y ${signStr(-beta)} ${fmt(Math.abs(beta))})²/${fmt(aSq)} − (x ${signStr(-alpha)} ${fmt(Math.abs(alpha))})²/${fmt(bSq)} = 1`;
    steps.push({
      title: trs("৫) প্রামাণ্য রূপ"),
      explanation: trt`উভয় পাশ K = ${fmt(K)} দিয়ে ভাগ; বিপরীত চিহ্নের সহগ থেকে অধিবৃত্ত পাই।`,
      math: [
        orientation === "horizontal"
          ? `X²/${fmt(aSq)} − Y²/${fmt(bSq)} = 1`
          : `Y²/${fmt(aSq)} − X²/${fmt(bSq)} = 1`,
        `a² = ${fmt(aSq)},  b² = ${fmt(bSq)},  a = ${fmt(a)},  b = ${fmt(b)}`,
        `c = √(a² + b²) = ${fmt(cc)},  e = ${fmt(e)}`,
      ],
    });
    const items = hyperbolaItems({ orientation, a, b, c: cc, e, alpha, beta });
    steps.push({
      title: trs("৬) প্রতিটি উপাদান নির্ণয়"),
      explanation: trs("X = x − α, Y = y − β বসিয়ে সবগুলো বের করা হলো।"),
      math: items.map((it) => `${it.label}: ${it.value}`),
    });
    return {
      ok: true,
      steps,
      coefs: c,
      solution: {
        kind: "hyperbola",
        orientation,
        a,
        b,
        c: cc,
        e,
        alpha,
        beta,
        standard,
        transformed:
          orientation === "horizontal"
            ? `X²/${fmt(aSq)} − Y²/${fmt(bSq)} = 1`
            : `Y²/${fmt(aSq)} − X²/${fmt(bSq)} = 1`,
        items,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : trs("সমাধান সম্ভব নয়") };
  }
}
