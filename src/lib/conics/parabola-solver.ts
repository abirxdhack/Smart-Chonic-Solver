import { trs, trt } from "@/i18n";
export type SolverResult = {
  h: number;
  k: number;
  a: number;
  orientation: "x" | "y";
  equation: string;
  steps: string[];
};

const num = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/\.?0+$/, ""));

function build(h: number, k: number, a: number, orientation: "x" | "y") {
  const four = 4 * a;
  const eq =
    orientation === "x"
      ? `(y − ${num(k)})² = ${num(four)}(x − ${num(h)})`
      : `(x − ${num(h)})² = ${num(four)}(y − ${num(k)})`;
  return { h, k, a, orientation, equation: eq };
}

export function solveFromFocusAndDirectrix(
  focus: [number, number],
  directrix: { axis: "x" | "y"; value: number },
): SolverResult {
  const orientation: "x" | "y" = directrix.axis === "x" ? "x" : "y";
  const steps: string[] = [];
  let h: number, k: number, a: number;
  if (orientation === "x") {
    k = focus[1];
    h = (focus[0] + directrix.value) / 2;
    a = (focus[0] - directrix.value) / 2;
    steps.push(trt`উপকেন্দ্র S = (${num(focus[0])}, ${num(focus[1])})`);
    steps.push(trt`নিয়ামক: x = ${num(directrix.value)}`);
    steps.push(trt`অক্ষরেখা x-অক্ষের সমান্তরাল, তাই শীর্ষ = নিয়ামক ও উপকেন্দ্রের মধ্যবিন্দু`);
    steps.push(trt`h = (${num(focus[0])} + ${num(directrix.value)})/২ = ${num(h)}`);
    steps.push(`k = ${num(k)}`);
    steps.push(trt`a = (${num(focus[0])} − ${num(directrix.value)})/২ = ${num(a)}`);
  } else {
    h = focus[0];
    k = (focus[1] + directrix.value) / 2;
    a = (focus[1] - directrix.value) / 2;
    steps.push(trt`উপকেন্দ্র S = (${num(focus[0])}, ${num(focus[1])})`);
    steps.push(trt`নিয়ামক: y = ${num(directrix.value)}`);
    steps.push(trt`অক্ষরেখা y-অক্ষের সমান্তরাল, তাই শীর্ষ = নিয়ামক ও উপকেন্দ্রের মধ্যবিন্দু`);
    steps.push(`h = ${num(h)}`);
    steps.push(trt`k = (${num(focus[1])} + ${num(directrix.value)})/২ = ${num(k)}`);
    steps.push(trt`a = (${num(focus[1])} − ${num(directrix.value)})/২ = ${num(a)}`);
  }
  const b = build(h, k, a, orientation);
  steps.push(trt`প্যারাবোলার সমীকরণ: ${b.equation}`);
  return { ...b, steps };
}

export function solveFromVertexAndDirectrix(
  vertex: [number, number],
  directrix: { axis: "x" | "y"; value: number },
): SolverResult {
  const orientation: "x" | "y" = directrix.axis === "x" ? "x" : "y";
  const steps: string[] = [];
  const h = vertex[0];
  const k = vertex[1];
  let a: number;
  if (orientation === "x") {
    a = vertex[0] - directrix.value;
    steps.push(trt`শীর্ষবিন্দু A = (${num(h)}, ${num(k)})`);
    steps.push(trt`নিয়ামক: x = ${num(directrix.value)}`);
    steps.push(trt`a = h − নিয়ামক = ${num(h)} − ${num(directrix.value)} = ${num(a)}`);
  } else {
    a = vertex[1] - directrix.value;
    steps.push(trt`শীর্ষবিন্দু A = (${num(h)}, ${num(k)})`);
    steps.push(trt`নিয়ামক: y = ${num(directrix.value)}`);
    steps.push(trt`a = k − নিয়ামক = ${num(k)} − ${num(directrix.value)} = ${num(a)}`);
  }
  const b = build(h, k, a, orientation);
  steps.push(trt`প্যারাবোলার সমীকরণ: ${b.equation}`);
  return { ...b, steps };
}

export function solveFromFocusAndVertex(
  focus: [number, number],
  vertex: [number, number],
): SolverResult {
  const steps: string[] = [];
  const h = vertex[0];
  const k = vertex[1];
  let orientation: "x" | "y";
  let a: number;
  if (Math.abs(focus[1] - vertex[1]) < 1e-9) {
    orientation = "x";
    a = focus[0] - vertex[0];
    steps.push(trt`শীর্ষ ও উপকেন্দ্রের y সমান, তাই অক্ষরেখা x-অক্ষের সমান্তরাল`);
    steps.push(`a = S_x − h = ${num(focus[0])} − ${num(h)} = ${num(a)}`);
  } else if (Math.abs(focus[0] - vertex[0]) < 1e-9) {
    orientation = "y";
    a = focus[1] - vertex[1];
    steps.push(trt`শীর্ষ ও উপকেন্দ্রের x সমান, তাই অক্ষরেখা y-অক্ষের সমান্তরাল`);
    steps.push(`a = S_y − k = ${num(focus[1])} − ${num(k)} = ${num(a)}`);
  } else {
    throw new Error(trs("শীর্ষ ও উপকেন্দ্র একই অক্ষরেখায় নেই"));
  }
  const b = build(h, k, a, orientation);
  steps.push(trt`প্যারাবোলার সমীকরণ: ${b.equation}`);
  return { ...b, steps };
}
