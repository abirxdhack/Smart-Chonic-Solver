import { trs, trt } from "@/i18n";
export type ConicType = "parabola" | "ellipse" | "hyperbola";

export type ParseError = {
  message: string;
  suggestion?: string;
  autoCorrected?: string;
};

export type NormalizedParabola = {
  type: "parabola";
  h: number;
  k: number;
  a: number;
  orientation: "x" | "y";
  standard: string;
};

export type NormalizedEllipse = {
  type: "ellipse";
  alpha: number;
  beta: number;
  a: number;
  b: number;
  orientation: "horizontal" | "vertical";
  standard: string;
};

export type NormalizedHyperbola = {
  type: "hyperbola";
  alpha: number;
  beta: number;
  a: number;
  b: number;
  orientation: "horizontal" | "vertical";
  standard: string;
};

export type NormalizedConic = NormalizedParabola | NormalizedEllipse | NormalizedHyperbola;

export type ParseResult =
  | { ok: true; conic: NormalizedConic; sanitized: string; autoCorrected: boolean }
  | { ok: false; error: ParseError; sanitized: string; autoCorrected: boolean };

type Poly = {
  c: number;
  x: number;
  y: number;
  xx: number;
  yy: number;
  xy: number;
};

const EPS = 1e-9;
const zero = (): Poly => ({ c: 0, x: 0, y: 0, xx: 0, yy: 0, xy: 0 });
const constPoly = (v: number): Poly => ({ ...zero(), c: v });
const xVar = (): Poly => ({ ...zero(), x: 1 });
const yVar = (): Poly => ({ ...zero(), y: 1 });

const addP = (a: Poly, b: Poly): Poly => ({
  c: a.c + b.c,
  x: a.x + b.x,
  y: a.y + b.y,
  xx: a.xx + b.xx,
  yy: a.yy + b.yy,
  xy: a.xy + b.xy,
});
const negP = (a: Poly): Poly => ({
  c: -a.c,
  x: -a.x,
  y: -a.y,
  xx: -a.xx,
  yy: -a.yy,
  xy: -a.xy,
});
const subP = (a: Poly, b: Poly): Poly => addP(a, negP(b));
const scaleP = (a: Poly, s: number): Poly => ({
  c: a.c * s,
  x: a.x * s,
  y: a.y * s,
  xx: a.xx * s,
  yy: a.yy * s,
  xy: a.xy * s,
});

const degP = (p: Poly): number => {
  if (Math.abs(p.xx) > EPS || Math.abs(p.yy) > EPS || Math.abs(p.xy) > EPS) return 2;
  if (Math.abs(p.x) > EPS || Math.abs(p.y) > EPS) return 1;
  return 0;
};

function mulP(a: Poly, b: Poly): Poly {
  const da = degP(a);
  const db = degP(b);
  if (da + db > 2) {
    throw new ParseException(
      trs("সমীকরণের ঘাত ২-এর বেশি হতে পারবে না"),
      trs("সমীকরণটি x² অথবা y² পর্যন্ত সীমাবদ্ধ রাখুন"),
    );
  }
  const out = zero();
  out.c = a.c * b.c;
  out.x = a.c * b.x + a.x * b.c;
  out.y = a.c * b.y + a.y * b.c;
  out.xx = a.c * b.xx + a.xx * b.c + a.x * b.x;
  out.yy = a.c * b.yy + a.yy * b.c + a.y * b.y;
  out.xy = a.c * b.xy + a.xy * b.c + a.x * b.y + a.y * b.x;
  return out;
}

function powP(base: Poly, exp: number): Poly {
  if (!Number.isInteger(exp) || exp < 0 || exp > 2) {
    throw new ParseException(
      trs("ঘাত অবশ্যই 0, 1 বা 2 হতে হবে"),
      trs("শুধুমাত্র বর্গ (^2) ব্যবহার করুন"),
    );
  }
  if (exp === 0) return constPoly(1);
  if (exp === 1) return base;
  return mulP(base, base);
}

function divP(a: Poly, b: Poly): Poly {
  if (degP(b) !== 0) {
    throw new ParseException(
      trs("চলক দিয়ে ভাগ সমর্থিত নয়"),
      trs("শুধু ধ্রুবক দিয়ে ভাগ ব্যবহার করুন"),
    );
  }
  if (Math.abs(b.c) < EPS) {
    throw new ParseException(trs("শূন্য দিয়ে ভাগ"), trs("হরে অশূন্য মান দিন"));
  }
  return scaleP(a, 1 / b.c);
}

class ParseException extends Error {
  suggestion?: string;
  constructor(message: string, suggestion?: string) {
    super(message);
    this.suggestion = suggestion;
  }
}

const SUP_MAP: Record<string, string> = {
  "⁰": "0",
  "¹": "1",
  "²": "2",
  "³": "3",
  "⁴": "4",
  "⁵": "5",
  "⁶": "6",
  "⁷": "7",
  "⁸": "8",
  "⁹": "9",
};

export function sanitize(raw: string): { text: string; changed: boolean } {
  const original = raw;
  let s = raw;
  s = s.replace(
    /[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g,
    (m) =>
      "^" +
      m
        .split("")
        .map((c) => SUP_MAP[c])
        .join(""),
  );
  s = s.replace(/[−–—]/g, "-");
  s = s.replace(/[×·⋅]/g, "*");
  s = s.replace(/[｛[{]/g, "(").replace(/[｝\]}]/g, ")");
  s = s.replace(/\s+/g, "");
  s = s.replace(/([xyXY])(\^?)(\d)/g, (_m, v: string, hat: string, d: string) =>
    hat === "^" ? `${v.toLowerCase()}^${d}` : `${v.toLowerCase()}^${d}`,
  );
  s = s.replace(/([xy])(?![\^\w])/g, "$1");
  s = s.toLowerCase();
  s = s.replace(/\)\(/g, ")*(");
  s = s.replace(/(\d)\(/g, "$1*(");
  s = s.replace(/\)(\d)/g, ")*$1");
  s = s.replace(/(\d)([xy])/g, "$1*$2");
  s = s.replace(/([xy])(\d)/g, "$1*$2");
  s = s.replace(/\)([xy])/g, ")*$1");
  s = s.replace(/([xy])\(/g, "$1*(");
  s = s.replace(/([xy])([xy])/g, "$1*$2");
  return { text: s, changed: s !== original.replace(/\s+/g, "") };
}

type Tok =
  | { t: "num"; v: number }
  | { t: "var"; v: "x" | "y" }
  | { t: "op"; v: "+" | "-" | "*" | "/" | "^" | "=" }
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
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^" || ch === "=") {
      out.push({ t: "op", v: ch });
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
      const num = parseFloat(s.slice(i, j));
      if (!isFinite(num)) {
        throw new ParseException(
          trt`অবস্থান ${i + 1}-এ অসংখ্যিক মান`,
          trs("শুধু বৈধ সংখ্যা ব্যবহার করুন"),
        );
      }
      out.push({ t: "num", v: num });
      i = j;
      continue;
    }
    throw new ParseException(
      trt`অবস্থান ${i + 1}-এ অপরিচিত অক্ষর: "${ch}"`,
      trs("কেবল x, y, সংখ্যা, +, −, ×, /, ^, ( ) ব্যবহার করুন"),
    );
  }
  return out;
}

class Parser {
  toks: Tok[];
  pos = 0;
  constructor(toks: Tok[]) {
    this.toks = toks;
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

  parseExpr(): Poly {
    let left = this.parseTerm();
    while (!this.eof()) {
      const p = this.peek();
      if (p.t === "op" && (p.v === "+" || p.v === "-")) {
        this.eat();
        const right = this.parseTerm();
        left = p.v === "+" ? addP(left, right) : subP(left, right);
      } else break;
    }
    return left;
  }
  parseTerm(): Poly {
    let left = this.parseUnary();
    while (!this.eof()) {
      const p = this.peek();
      if (p.t === "op" && (p.v === "*" || p.v === "/")) {
        this.eat();
        const right = this.parseUnary();
        left = p.v === "*" ? mulP(left, right) : divP(left, right);
      } else if (p.t === "num" || p.t === "var" || p.t === "lp") {
        const right = this.parseUnary();
        left = mulP(left, right);
      } else break;
    }
    return left;
  }
  parseUnary(): Poly {
    const p = this.peek();
    if (p && p.t === "op" && (p.v === "+" || p.v === "-")) {
      this.eat();
      const val = this.parsePower();
      return p.v === "-" ? negP(val) : val;
    }
    return this.parsePower();
  }
  parsePower(): Poly {
    const base = this.parseAtom();
    if (!this.eof()) {
      const p = this.peek();
      if (p.t === "op" && p.v === "^") {
        this.eat();
        const nx = this.peek();
        let sign = 1;
        if (nx && nx.t === "op" && (nx.v === "+" || nx.v === "-")) {
          if (nx.v === "-") sign = -1;
          this.eat();
        }
        const exTok = this.eat();
        if (!exTok || exTok.t !== "num") {
          throw new ParseException(trs("ঘাতের পরে সংখ্যা থাকতে হবে"), trs("যেমন x^2 লিখুন"));
        }
        return powP(base, sign * exTok.v);
      }
    }
    return base;
  }
  parseAtom(): Poly {
    if (this.eof())
      throw new ParseException(trs("সমীকরণ অসম্পূর্ণ"), trs("শেষে চলক বা সংখ্যা প্রত্যাশিত"));
    const p = this.eat();
    if (p.t === "num") return constPoly(p.v);
    if (p.t === "var") return p.v === "x" ? xVar() : yVar();
    if (p.t === "lp") {
      const inner = this.parseExpr();
      const close = this.eat();
      if (!close || close.t !== "rp") {
        throw new ParseException(trs("বন্ধনী মেলেনি"), trs("প্রতিটি ( এর সাথে ) দিন"));
      }
      return inner;
    }
    throw new ParseException(trs("অপ্রত্যাশিত টোকেন"), trs("সমীকরণের গঠন যাচাই করুন"));
  }
}

function parseSide(s: string): Poly {
  if (!s) throw new ParseException(trs("সমীকরণের একটি পাশ ফাঁকা"), trs("= এর দুই পাশেই রাশি দিন"));
  const toks = tokenize(s);
  if (toks.length === 0)
    throw new ParseException(trs("সমীকরণের একটি পাশ ফাঁকা"), trs("= এর দুই পাশেই রাশি দিন"));
  const p = new Parser(toks);
  const val = p.parseExpr();
  if (!p.eof()) throw new ParseException(trs("অতিরিক্ত টোকেন"), trs("গঠন যাচাই করুন"));
  return val;
}

function fmtN(n: number): string {
  if (!isFinite(n)) return "∞";
  if (Math.abs(n) < 1e-10) return "0";
  if (Number.isInteger(n)) return String(n);
  return (+n.toFixed(4)).toString();
}

function normalize(p: Poly): NormalizedConic {
  if (Math.abs(p.xy) > 1e-6) {
    throw new ParseException(
      trs("এই অ্যাপে ঘূর্ণিত (xy) কণিক সমর্থিত নয়"),
      trs("xy টার্ম বাদ দিন"),
    );
  }
  const A = p.xx;
  const C = p.yy;
  const D = p.x;
  const E = p.y;
  const F = p.c;

  const aZero = Math.abs(A) < EPS;
  const cZero = Math.abs(C) < EPS;

  if (aZero && cZero) {
    throw new ParseException(trs("কণিক নয়: বর্গ পদ অনুপস্থিত"), trs("x² বা y² অন্তত একটি রাখুন"));
  }

  if (aZero || cZero) {
    if (aZero) {
      if (Math.abs(D) < EPS) {
        throw new ParseException(
          trs("পরাবৃত্ত অবৈধ: রৈখিক x পদ অনুপস্থিত"),
          trs("উদাহরণ: y² = 4x"),
        );
      }
      const k = -E / (2 * C);
      const a = -D / (4 * C);
      const h = (E * E - 4 * C * F) / (4 * C * D);
      const four = 4 * a;
      const standard = `(y ${k >= 0 ? "−" : "+"} ${fmtN(Math.abs(k))})² = ${fmtN(four)}(x ${h >= 0 ? "−" : "+"} ${fmtN(Math.abs(h))})`;
      return { type: "parabola", h, k, a, orientation: "x", standard };
    }
    if (Math.abs(E) < EPS) {
      throw new ParseException(trs("পরাবৃত্ত অবৈধ: রৈখিক y পদ অনুপস্থিত"), trs("উদাহরণ: x² = 4y"));
    }
    const h = -D / (2 * A);
    const a = -E / (4 * A);
    const k = (D * D - 4 * A * F) / (4 * A * E);
    const four = 4 * a;
    const standard = `(x ${h >= 0 ? "−" : "+"} ${fmtN(Math.abs(h))})² = ${fmtN(four)}(y ${k >= 0 ? "−" : "+"} ${fmtN(Math.abs(k))})`;
    return { type: "parabola", h, k, a, orientation: "y", standard };
  }

  const h = -D / (2 * A);
  const k = -E / (2 * C);
  const K = A * h * h + C * k * k - F;

  if (A * C > 0) {
    const pA = K / A;
    const pC = K / C;
    if (pA < EPS || pC < EPS) {
      if (pA < -EPS || pC < -EPS) {
        throw new ParseException(
          trs("বাস্তব উপবৃত্ত নয়"),
          trs("সহগ বা ধ্রুবকের চিহ্ন যাচাই করুন"),
        );
      }
      throw new ParseException(trs("অধঃপতিত উপবৃত্ত (একটি বিন্দু)"), trs("সহগ যাচাই করুন"));
    }
    let orientation: "horizontal" | "vertical";
    let aSq: number, bSq: number;
    if (pA >= pC) {
      orientation = "horizontal";
      aSq = pA;
      bSq = pC;
    } else {
      orientation = "vertical";
      aSq = pC;
      bSq = pA;
    }
    const av = Math.sqrt(aSq);
    const bv = Math.sqrt(bSq);
    const standard =
      orientation === "horizontal"
        ? `(x ${h >= 0 ? "−" : "+"} ${fmtN(Math.abs(h))})²/${fmtN(aSq)} + (y ${k >= 0 ? "−" : "+"} ${fmtN(Math.abs(k))})²/${fmtN(bSq)} = 1`
        : `(x ${h >= 0 ? "−" : "+"} ${fmtN(Math.abs(h))})²/${fmtN(bSq)} + (y ${k >= 0 ? "−" : "+"} ${fmtN(Math.abs(k))})²/${fmtN(aSq)} = 1`;
    return { type: "ellipse", alpha: h, beta: k, a: av, b: bv, orientation, standard };
  }

  const pA = K / A;
  const pC = K / C;
  if (Math.abs(pA) < EPS || Math.abs(pC) < EPS) {
    throw new ParseException(trs("অধঃপতিত অধিবৃত্ত"), trs("সহগ যাচাই করুন"));
  }
  let orientation: "horizontal" | "vertical";
  let aSq: number, bSq: number;
  if (pA > 0) {
    orientation = "horizontal";
    aSq = pA;
    bSq = -pC;
  } else {
    orientation = "vertical";
    aSq = pC;
    bSq = -pA;
  }
  if (aSq <= EPS || bSq <= EPS) {
    throw new ParseException(trs("বাস্তব অধিবৃত্ত নয়"), trs("সহগ বা চিহ্ন যাচাই করুন"));
  }
  const av = Math.sqrt(aSq);
  const bv = Math.sqrt(bSq);
  const standard =
    orientation === "horizontal"
      ? `(x ${h >= 0 ? "−" : "+"} ${fmtN(Math.abs(h))})²/${fmtN(aSq)} − (y ${k >= 0 ? "−" : "+"} ${fmtN(Math.abs(k))})²/${fmtN(bSq)} = 1`
      : `(y ${k >= 0 ? "−" : "+"} ${fmtN(Math.abs(k))})²/${fmtN(aSq)} − (x ${h >= 0 ? "−" : "+"} ${fmtN(Math.abs(h))})²/${fmtN(bSq)} = 1`;
  return { type: "hyperbola", alpha: h, beta: k, a: av, b: bv, orientation, standard };
}

export function analyzeConic(raw: string): ParseResult {
  const { text, changed } = sanitize(raw);
  if (!raw.trim()) {
    return {
      ok: false,
      error: { message: trs("সমীকরণ ফাঁকা"), suggestion: trs("একটি সমীকরণ টাইপ করুন") },
      sanitized: text,
      autoCorrected: false,
    };
  }
  try {
    if (!text.includes("=")) {
      throw new ParseException(trs("সমান চিহ্ন (=) অনুপস্থিত"), trs("উদাহরণ: x²/16 + y²/9 = 1"));
    }
    const parts = text.split("=");
    if (parts.length !== 2) {
      throw new ParseException(trs("একের অধিক = চিহ্ন"), trs("কেবল একটি = ব্যবহার করুন"));
    }
    const lhs = parseSide(parts[0]);
    const rhs = parseSide(parts[1]);
    const poly = subP(lhs, rhs);
    const conic = normalize(poly);
    return { ok: true, conic, sanitized: text, autoCorrected: changed };
  } catch (e) {
    const err =
      e instanceof ParseException
        ? { message: e.message, suggestion: e.suggestion }
        : { message: trs("সমীকরণ পার্স করা যায়নি"), suggestion: trs("গঠন যাচাই করুন") };
    return { ok: false, error: err, sanitized: text, autoCorrected: changed };
  }
}
