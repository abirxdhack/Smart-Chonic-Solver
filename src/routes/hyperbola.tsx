import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadGraphPng } from "@/lib/conics/export-graph";
import {
  parseHyperbola,
  parseHyperbolaDetailed,
  hyperbolaGeometry,
  focalDistancesHyperbola,
  pointPositionHyperbola,
  type HyperbolaParsed,
} from "@/lib/conics/hyperbola";
import { EqStatus } from "@/components/conics/EqStatus";
import { toBn, fmtPt, fmtNum } from "@/lib/conics/format";
import {
  PageShell,
  CollapsibleRow,
  CONIC_COLORS,
  MathKeyboard,
} from "@/components/conics/Shared";
import { ConicGraph, type Marker, type Guide } from "@/components/conics/ConicGraph";
import { copyShareLink, passthroughSearch } from "@/lib/conics/share";

export const Route = createFileRoute("/hyperbola")({
  validateSearch: passthroughSearch,
  head: () => ({
    meta: [
      { title: "অধিবৃত্ত সমাধান ও গ্রাফ — Conic Studio" },
      {
        name: "description",
        content:
          "অধিবৃত্তের সব ধর্ম — কেন্দ্র, উৎকেন্দ্রিকতা, আড় ও অনুবন্ধী অক্ষ, ফোকাস, নিয়ামক, অসীমতটরেখা, নির্দেশক বৃত্ত সহ ধাপে ধাপে সমাধান।",
      },
      { property: "og:title", content: "অধিবৃত্ত সমাধান" },
      { property: "og:description", content: "ইন্টারেক্টিভ অধিবৃত্ত গ্রাফ ও সম্পূর্ণ সমাধান।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HyperbolaPage,
});

function HyperbolaPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<"param" | "eq">(search.tab === "eq" ? "eq" : "param");
  const [alphaIn, setAlphaIn] = useState<string>(search.al ?? "");
  const [betaIn, setBetaIn] = useState<string>(search.be ?? "");
  const [aIn, setAIn] = useState<string>(search.a ?? "");
  const [bIn, setBIn] = useState<string>(search.b ?? "");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(search.o === "vertical" ? "vertical" : "horizontal");
  const [eq, setEq] = useState<string>(search.eq ?? "");
  const [eqError, setEqError] = useState("");
  const [kbOpen, setKbOpen] = useState(false);
  const [pxIn, setPxIn] = useState<string>(search.px ?? "");
  const [pyIn, setPyIn] = useState<string>(search.py ?? "");
  const eqInputRef = useRef<HTMLInputElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const shareLink = async () => {
    try {
      const { url, copied } = await copyShareLink(
        "/hyperbola",
        tab === "eq"
          ? { tab: "eq", eq, px: pxIn, py: pyIn }
          : { tab: "param", al: alphaIn, be: betaIn, a: aIn, b: bIn, o: orientation, px: pxIn, py: pyIn },
      );
      toast[copied ? "success" : "info"](copied ? "লিংক কপি হয়েছে!" : "শেয়ার লিংক তৈরি হয়েছে", {
        description: url,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "শেয়ার করা যায়নি");
    }
  };

  const downloadPng = async () => {
    try {
      await downloadGraphPng(graphRef.current, "hyperbola-graph.png");
      toast.success("গ্রাফ ডাউনলোড হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ডাউনলোড ব্যর্থ");
    }
  };
  const toNum = (v: string) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  };
  const alpha = toNum(alphaIn);
  const beta = toNum(betaIn);
  const a = toNum(aIn);
  const b = toNum(bIn);
  const px = toNum(pxIn);
  const py = toNum(pyIn);

  const parsed: HyperbolaParsed | null = useMemo(() => {
    if (tab === "eq") return parseHyperbola(eq);
    if (![alpha, beta, a, b].every(isFinite) || a <= 0 || b <= 0) return null;
    return { alpha, beta, a, b, orientation };
  }, [tab, eq, alpha, beta, a, b, orientation]);

  const eqDetail = useMemo(() => (tab === "eq" && eq.trim() ? parseHyperbolaDetailed(eq) : null), [eq, tab]);
  useEffect(() => {
    if (tab === "eq") {
      if (!eq.trim()) setEqError("");
      else if (!eqDetail || eqDetail.ok) setEqError("");
      else setEqError(eqDetail.error.message);
    }
  }, [eq, tab, eqDetail]);

  const insertAt = (t: string) => {
    const el = eqInputRef.current;
    if (!el) return setEq((v) => v + t);
    const s = el.selectionStart ?? eq.length;
    const e = el.selectionEnd ?? eq.length;
    setEq(eq.slice(0, s) + t + eq.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + t.length, s + t.length);
    });
  };

  return (
    <PageShell>
      <main className="page-main">
        <div className="grid-layout">
          <section className="card fade-in">
            <div className="card-title"><h2>ইনপুট</h2></div>
            <div className="tabs">
              <button className={`tab ${tab === "param" ? "active" : ""}`} onClick={() => setTab("param")}>প্যারামিটার</button>
              <button className={`tab ${tab === "eq" ? "active" : ""}`} onClick={() => setTab("eq")}>সমীকরণ</button>
            </div>
            {tab === "param" ? (
              <div>
                <div className="orient-toggle">
                  <span className="lbl">অভিমুখ</span>
                  <div className="seg">
                    <button className={orientation === "horizontal" ? "on" : ""} onClick={() => setOrientation("horizontal")}>x²/a² − y²/b² = 1</button>
                    <button className={orientation === "vertical" ? "on" : ""} onClick={() => setOrientation("vertical")}>y²/a² − x²/b² = 1</button>
                  </div>
                </div>
                <div className="fields">
                  <label className="fld"><span>α (কেন্দ্র x)</span><input type="text" inputMode="decimal" placeholder="α" value={alphaIn} onChange={(e) => setAlphaIn(e.target.value)} /></label>
                  <label className="fld"><span>β (কেন্দ্র y)</span><input type="text" inputMode="decimal" placeholder="β" value={betaIn} onChange={(e) => setBetaIn(e.target.value)} /></label>
                  <label className="fld"><span>a (আড় অক্ষ)</span><input type="text" inputMode="decimal" placeholder="a" value={aIn} onChange={(e) => setAIn(e.target.value)} /></label>
                  <label className="fld"><span>b (অনুবন্ধী)</span><input type="text" inputMode="decimal" placeholder="b" value={bIn} onChange={(e) => setBIn(e.target.value)} /></label>
                </div>
                <div className="preview-eq">
                  <span>প্রদর্শিত সমীকরণ</span>
                  <code>
                    {orientation === "horizontal"
                      ? `(x ${alpha >= 0 ? "−" : "+"} ${toBn(Math.abs(alpha))})²/${toBn(a * a)} − (y ${beta >= 0 ? "−" : "+"} ${toBn(Math.abs(beta))})²/${toBn(b * b)} = ১`
                      : `(y ${beta >= 0 ? "−" : "+"} ${toBn(Math.abs(beta))})²/${toBn(a * a)} − (x ${alpha >= 0 ? "−" : "+"} ${toBn(Math.abs(alpha))})²/${toBn(b * b)} = ১`}
                  </code>
                </div>
              </div>
            ) : (
              <div>
                <label className="fld">
                  <span>সমীকরণ লিখুন</span>
                  <input
                    ref={eqInputRef}
                    type="text"
                    value={eq}
                    onChange={(e) => setEq(e.target.value)}
                    onFocus={() => setKbOpen(true)}
                    placeholder="(x-α)^2/a^2 - (y-β)^2/b^2 = 1"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </label>
                {eqDetail && <EqStatus result={eqDetail} expected="hyperbola" />}
                <div className="hint">উদাহরণ: <code>(x-2)^2/16-(y+1)^2/9=1</code></div>
                {kbOpen && (
                  <MathKeyboard
                    onInsert={insertAt}
                    onClose={() => setKbOpen(false)}
                    onBackspace={() => {
                      const el = eqInputRef.current;
                      if (!el) return setEq((v) => v.slice(0, -1));
                      const s = el.selectionStart ?? 0;
                      const e = el.selectionEnd ?? 0;
                      if (s !== e) setEq(eq.slice(0, s) + eq.slice(e));
                      else if (s > 0) setEq(eq.slice(0, s - 1) + eq.slice(s));
                    }}
                    onClear={() => setEq("")}
                  />
                )}
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div className="orient-toggle">
                <span className="lbl">উপকেন্দ্রিক দূরত্বের জন্য বিন্দু (x, y)</span>
                <div className="fields" style={{ marginTop: 4 }}>
                  <label className="fld"><span>x</span><input type="text" inputMode="decimal" placeholder="x" value={pxIn} onChange={(e) => setPxIn(e.target.value)} /></label>
                  <label className="fld"><span>y</span><input type="text" inputMode="decimal" placeholder="y" value={pyIn} onChange={(e) => setPyIn(e.target.value)} /></label>
                </div>
              </div>
            </div>
          </section>

          <section className="card graph-card fade-in" ref={graphRef}>
            <div className="graph-head">
              <h2>গ্রাফ</h2>
              <div className="actions">
                <button className="icon-btn" onClick={shareLink}>
                  <Share2 size={14} /> শেয়ার
                </button>
                <button className="icon-btn primary" onClick={downloadPng}>
                  <Download size={14} /> PNG
                </button>
              </div>
              <div className="graph-tools">
                <span className="chip"><span className="dot" style={{ background: CONIC_COLORS.curve }} />অধিবৃত্ত</span>
                <span className="chip"><span className="dot" style={{ background: CONIC_COLORS.focus }} />ফোকাস</span>
                <span className="chip"><span className="dot" style={{ background: CONIC_COLORS.asymptote }} />অসীমতটরেখা</span>
                <span className="chip"><span className="dot" style={{ background: CONIC_COLORS.directrix }} />নিয়ামক</span>
              </div>
            </div>
            {parsed ? <HyperbolaGraphInner parsed={parsed} /> : <div className="err soft">সঠিক ইনপুট দিন</div>}
          </section>

          <section className="card fade-in">
            <h2>ফলাফল ও ব্যাখ্যা</h2>
            {parsed ? <HyperbolaResults parsed={parsed} px={px} py={py} /> : <div className="err soft">সঠিক ইনপুট দিন।</div>}
          </section>
        </div>
      </main>
    </PageShell>
  );
}

function HyperbolaGraphInner({ parsed }: { parsed: HyperbolaParsed }) {
  const geo = hyperbolaGeometry(parsed);
  const horiz = parsed.orientation === "horizontal";
  const span = Math.max(8, geo.c * 2.2);
  const bounds = { xmin: parsed.alpha - span, xmax: parsed.alpha + span, ymin: parsed.beta - span * 0.9, ymax: parsed.beta + span * 0.9 };
  const T = 2.2;
  const curves = horiz
    ? [
        { type: "parametric" as const, sample: (t: number) => [parsed.alpha + parsed.a * Math.cosh(t), parsed.beta + parsed.b * Math.sinh(t)] as [number, number], tStart: -T, tEnd: T, n: 200 },
        { type: "parametric" as const, sample: (t: number) => [parsed.alpha - parsed.a * Math.cosh(t), parsed.beta + parsed.b * Math.sinh(t)] as [number, number], tStart: -T, tEnd: T, n: 200 },
      ]
    : [
        { type: "parametric" as const, sample: (t: number) => [parsed.alpha + parsed.b * Math.sinh(t), parsed.beta + parsed.a * Math.cosh(t)] as [number, number], tStart: -T, tEnd: T, n: 200 },
        { type: "parametric" as const, sample: (t: number) => [parsed.alpha + parsed.b * Math.sinh(t), parsed.beta - parsed.a * Math.cosh(t)] as [number, number], tStart: -T, tEnd: T, n: 200 },
      ];
  const slope = horiz ? parsed.b / parsed.a : parsed.a / parsed.b;
  const asy = (m: number, x: number) => parsed.beta + m * (x - parsed.alpha);
  const guides: Guide[] = [
    { kind: "segment", x1: bounds.xmin, y1: asy(slope, bounds.xmin), x2: bounds.xmax, y2: asy(slope, bounds.xmax), color: CONIC_COLORS.asymptote, dash: "6 4", width: 1.6 },
    { kind: "segment", x1: bounds.xmin, y1: asy(-slope, bounds.xmin), x2: bounds.xmax, y2: asy(-slope, bounds.xmax), color: CONIC_COLORS.asymptote, dash: "6 4", width: 1.6 },
    ...(horiz
      ? [
          { kind: "vline" as const, x: geo.directrixFeet[0][0], color: CONIC_COLORS.directrix, dash: "6 5" },
          { kind: "vline" as const, x: geo.directrixFeet[1][0], color: CONIC_COLORS.directrix, dash: "6 5" },
        ]
      : [
          { kind: "hline" as const, y: geo.directrixFeet[0][1], color: CONIC_COLORS.directrix, dash: "6 5" },
          { kind: "hline" as const, y: geo.directrixFeet[1][1], color: CONIC_COLORS.directrix, dash: "6 5" },
        ]),
  ];
  const markers: Marker[] = [
    { x: geo.center[0], y: geo.center[1], color: CONIC_COLORS.center, name: "কেন্দ্র", label: fmtPt(geo.center), placement: "above-right" },
    { x: geo.vertices[0][0], y: geo.vertices[0][1], color: CONIC_COLORS.vertex, name: "শীর্ষবিন্দু", label: fmtPt(geo.vertices[0]), placement: "below-left" },
    { x: geo.vertices[1][0], y: geo.vertices[1][1], color: CONIC_COLORS.vertex, name: "শীর্ষবিন্দু", label: fmtPt(geo.vertices[1]), placement: "above-right" },
    { x: geo.foci[0][0], y: geo.foci[0][1], color: CONIC_COLORS.focus, name: "ফোকাস S₁", label: fmtPt(geo.foci[0]), placement: "above-left" },
    { x: geo.foci[1][0], y: geo.foci[1][1], color: CONIC_COLORS.focus, name: "ফোকাস S₂", label: fmtPt(geo.foci[1]), placement: "below-right" },
    { x: geo.directrixFeet[0][0], y: geo.directrixFeet[0][1], color: CONIC_COLORS.dirFoot, name: "নিয়ামক পাদ", label: fmtPt(geo.directrixFeet[0]), placement: "below-left" },
    { x: geo.directrixFeet[1][0], y: geo.directrixFeet[1][1], color: CONIC_COLORS.dirFoot, name: "নিয়ামক পাদ", label: fmtPt(geo.directrixFeet[1]), placement: "below-right" },
  ];
  return <ConicGraph bounds={bounds} curves={curves} guides={guides} markers={markers} ariaLabel="অধিবৃত্ত গ্রাফ" />;
}

function HyperbolaResults({ parsed, px, py }: { parsed: HyperbolaParsed; px: number; py: number }) {
  const geo = hyperbolaGeometry(parsed);
  const { alpha, beta, a, b } = parsed;
  const fd = focalDistancesHyperbola(parsed, px, py);
  const pos = pointPositionHyperbola(parsed, px, py);
  const posText = pos === "on" ? "উপর" : pos === "inside" ? "ভিতরে" : "বাইরে";
  const rows = [
    { c: CONIC_COLORS.center, l: "কেন্দ্র", v: fmtPt(geo.center), steps: [`(α, β) = (${toBn(alpha)}, ${toBn(beta)})`] },
    { c: "#22d3ee", l: "উৎকেন্দ্রিকতা e", v: fmtNum(geo.e), steps: [`e = √(1 + b²/a²) = √(1 + ${toBn(b * b)}/${toBn(a * a)}) = ${fmtNum(geo.e)}`] },
    { c: CONIC_COLORS.axis, l: "আড় অক্ষের দৈর্ঘ্য", v: toBn(geo.transverseLen), steps: [`2a = ${toBn(geo.transverseLen)}`] },
    { c: CONIC_COLORS.minor, l: "অনুবন্ধী অক্ষের দৈর্ঘ্য", v: toBn(geo.conjugateLen), steps: [`2b = ${toBn(geo.conjugateLen)}`] },
    { c: CONIC_COLORS.axis, l: "আড় অক্ষের সমীকরণ", v: geo.transverseAxisEq, steps: [parsed.orientation === "horizontal" ? "y = β" : "x = α"] },
    { c: CONIC_COLORS.aux, l: "অনুবন্ধী অক্ষের সমীকরণ", v: geo.conjugateAxisEq, steps: [parsed.orientation === "horizontal" ? "x = α" : "y = β"] },
    { c: CONIC_COLORS.vertex, l: "শীর্ষদ্বয়", v: `${fmtPt(geo.vertices[0])} ও ${fmtPt(geo.vertices[1])}`, steps: [parsed.orientation === "horizontal" ? "(α ± a, β)" : "(α, β ± a)"] },
    { c: CONIC_COLORS.focus, l: "ফোকাসদ্বয়", v: `${fmtPt(geo.foci[0])} ও ${fmtPt(geo.foci[1])}`, steps: [`c = √(a² + b²) = ${fmtNum(geo.c)}`, parsed.orientation === "horizontal" ? "(α ± c, β)" : "(α, β ± c)"] },
    { c: CONIC_COLORS.focus, l: "ফোকাসদ্বয়ের দূরত্ব", v: `২ae = ${fmtNum(geo.fociDist)}`, steps: [`= 2c = ${fmtNum(geo.fociDist)}`] },
    { c: CONIC_COLORS.dirFoot, l: "নিয়ামকের পাদবিন্দুদ্বয়", v: `${fmtPt(geo.directrixFeet[0])} ও ${fmtPt(geo.directrixFeet[1])}`, steps: [parsed.orientation === "horizontal" ? "(α ± a/e, β)" : "(α, β ± a/e)"] },
    { c: CONIC_COLORS.directrix, l: "নিয়ামক দুটির দূরত্ব", v: fmtNum(geo.directricesDist), steps: [`= 2a²/√(a²+b²) = ${fmtNum(geo.directricesDist)}`] },
    { c: CONIC_COLORS.directrix, l: "নিয়ামকের সমীকরণ", v: `${geo.directrixEqs[0]}  ও  ${geo.directrixEqs[1]}`, steps: [parsed.orientation === "horizontal" ? "x = α ± a/e" : "y = β ± a/e"] },
    { c: CONIC_COLORS.latus, l: "উপকেন্দ্রিক লম্বের দৈর্ঘ্য", v: fmtNum(geo.latusRectumLen), steps: [`= 2b²/a = ${fmtNum(geo.latusRectumLen)}`] },
    { c: CONIC_COLORS.latus, l: "উপকেন্দ্রিক লম্বের সমীকরণ", v: `${geo.latusRectumEqs[0]}  ও  ${geo.latusRectumEqs[1]}`, steps: ["ফোকাস দিয়ে আড় অক্ষের লম্ব"] },
    { c: CONIC_COLORS.asymptote, l: "অসীমতটরেখার সমীকরণ", v: `${geo.asymptotes[0]}  ও  ${geo.asymptotes[1]}`, steps: [parsed.orientation === "horizontal" ? "y − β = ±(b/a)(x − α)" : "y − β = ±(a/b)(x − α)"] },
    { c: "#a3e635", l: "নির্দেশক বৃত্তের সমীকরণ", v: geo.directorCircleEq, steps: ["(x − α)² + (y − β)² = a² − b²"] },
    {
      c: "#22d3ee",
      l: `(${toBn(px)}, ${toBn(py)}) বিন্দুর উপকেন্দ্রিক দূরত্ব`,
      v: `S₁P = ${fmtNum(fd.d1)}, S₂P = ${fmtNum(fd.d2)}, |পার্থক্য| = ${fmtNum(fd.diff)}`,
      steps: [
        `S₁P = ${fmtNum(fd.d1)}, S₂P = ${fmtNum(fd.d2)}`,
        `অধিবৃত্তের ধর্ম: |S₁P − S₂P| = 2a = ${toBn(2 * a)}`,
        `প্রাপ্ত = ${fmtNum(fd.diff)}`,
      ],
    },
    { c: "#f472b6", l: "বিন্দুটির অবস্থান", v: posText, steps: ["সমীকরণে বিন্দু বসিয়ে ফলাফলের চিহ্ন দিয়ে যাচাই"] },
  ];
  return (
    <ul className="res-list">
      {rows.map((r, i) => (
        <CollapsibleRow key={i} color={r.c} label={r.l} value={r.v} steps={r.steps} index={i} />
      ))}
    </ul>
  );
}
