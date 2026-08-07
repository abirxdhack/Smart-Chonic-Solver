import { trs, trt } from "@/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Share2, Download } from "lucide-react";
import { toast } from "sonner";
import { downloadGraphPng } from "@/lib/conics/export-graph";
import {
  parseParabola,
  parseParabolaDetailed,
  parabolaGeometry,
  focalDistanceParabola,
  type ParabolaParsed,
} from "@/lib/conics/parabola";
import { EqStatus } from "@/components/conics/EqStatus";
import { toBn, fmtPt, fmtNum } from "@/lib/conics/format";
import { PageShell, CollapsibleRow, CONIC_COLORS, MathKeyboard } from "@/components/conics/Shared";
import { ConicGraph, type Marker, type Guide } from "@/components/conics/ConicGraph";
import { copyShareLink, passthroughSearch } from "@/lib/conics/share";

export const Route = createFileRoute("/parabola")({
  validateSearch: passthroughSearch,
  head: () => ({
    meta: [
      { title: trs("পরাবৃত্ত সমাধান ও গ্রাফ — Conic Studio") },
      {
        name: "description",
        content: trs(
          "পরাবৃত্তের যেকোন সমীকরণ বা প্যারামিটার থেকে শীর্ষ, উপকেন্দ্র, নিয়ামক, লম্ব ও গ্রাফ; ধাপে ধাপে ব্যাখ্যা।",
        ),
      },
      { property: "og:title", content: trs("পরাবৃত্ত সমাধান") },
      {
        property: "og:description",
        content: trs("ইন্টারেক্টিভ পরাবৃত্ত গ্রাফ ও ধাপে ধাপে সমাধান।"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ParabolaPage,
});

function ParabolaPage() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<"param" | "eq">(search.tab === "eq" ? "eq" : "param");
  const [hIn, setHIn] = useState<string>(search.h ?? "");
  const [kIn, setKIn] = useState<string>(search.k ?? "");
  const [aIn, setAIn] = useState<string>(search.a ?? "");
  const [orientation, setOrientation] = useState<"x" | "y">(search.o === "y" ? "y" : "x");
  const [eq, setEq] = useState<string>(search.eq ?? "");
  const [eqError, setEqError] = useState("");
  const [kbOpen, setKbOpen] = useState(false);
  const [pxIn, setPxIn] = useState<string>(search.px ?? "");
  const [pyIn, setPyIn] = useState<string>(search.py ?? "");
  const eqInputRef = useRef<HTMLInputElement>(null);
  const svgWrapRef = useRef<HTMLDivElement>(null);

  const toNum = (s: string) => {
    const v = parseFloat(s);
    return isFinite(v) ? v : 0;
  };
  const h = toNum(hIn);
  const k = toNum(kIn);
  const a = toNum(aIn);
  const px = toNum(pxIn);
  const py = toNum(pyIn);

  const parsed: ParabolaParsed | null = useMemo(() => {
    if (tab === "eq") return parseParabola(eq);
    if (!isFinite(h) || !isFinite(k) || !isFinite(a) || a === 0) return null;
    return { h, k, a, orientation };
  }, [tab, eq, h, k, a, orientation]);

  const eqDetail = useMemo(
    () => (tab === "eq" && eq.trim() ? parseParabolaDetailed(eq) : null),
    [eq, tab],
  );
  useEffect(() => {
    if (tab === "eq") {
      if (!eq.trim()) setEqError("");
      else if (!eqDetail || eqDetail.ok) setEqError("");
      else setEqError(eqDetail.error.message);
    }
  }, [eq, tab, eqDetail]);

  const share = async () => {
    try {
      const { url, copied } = await copyShareLink(
        "/parabola",
        tab === "eq"
          ? { tab: "eq", eq, px: pxIn, py: pyIn }
          : { tab: "param", h: hIn, k: kIn, a: aIn, o: orientation, px: pxIn, py: pyIn },
      );
      toast[copied ? "success" : "info"](
        copied ? trs("লিংক কপি হয়েছে!") : trs("শেয়ার লিংক তৈরি হয়েছে"),
        {
          description: url,
        },
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : trs("শেয়ার করা যায়নি"));
    }
  };

  const downloadPng = async () => {
    try {
      await downloadGraphPng(svgWrapRef.current, "parabola-graph.png");
      toast.success(trs("গ্রাফ ডাউনলোড হয়েছে"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : trs("ডাউনলোড ব্যর্থ"));
    }
  };

  const insertAtCursor = (text: string) => {
    const el = eqInputRef.current;
    if (!el) return setEq((v) => v + text);
    const s = el.selectionStart ?? eq.length;
    const e = el.selectionEnd ?? eq.length;
    setEq(eq.slice(0, s) + text + eq.slice(e));
    requestAnimationFrame(() => {
      el.focus();
      const pos = s + text.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <PageShell>
      <main className="page-main">
        <div className="grid-layout">
          <section className="card input-card fade-in" id="input">
            <div className="card-title">
              <h2>{trs("ইনপুট")}</h2>
              <div className="actions">
                <button className="icon-btn" onClick={share}>
                  <Share2 size={14} /> {trs("শেয়ার")}
                </button>
                <button className="icon-btn primary" onClick={downloadPng}>
                  <Download size={14} /> PNG
                </button>
              </div>
            </div>

            <div className="tabs">
              <button
                className={`tab ${tab === "param" ? "active" : ""}`}
                onClick={() => setTab("param")}
              >
                {trs("প্যারামিটার")}
              </button>
              <button
                className={`tab ${tab === "eq" ? "active" : ""}`}
                onClick={() => setTab("eq")}
              >
                {trs("সমীকরণ")}
              </button>
            </div>

            {tab === "param" ? (
              <div className="param-panel">
                <div className="orient-toggle">
                  <span className="lbl">{trs("অক্ষরেখা")}</span>
                  <div className="seg">
                    <button
                      className={orientation === "x" ? "on" : ""}
                      onClick={() => setOrientation("x")}
                    >
                      {trs("x-অক্ষের সমান্তরাল")}
                    </button>
                    <button
                      className={orientation === "y" ? "on" : ""}
                      onClick={() => setOrientation("y")}
                    >
                      {trs("y-অক্ষের সমান্তরাল")}
                    </button>
                  </div>
                </div>
                <div className="fields">
                  <label className="fld">
                    <span>{trs("h (শীর্ষ x)")}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="h"
                      value={hIn}
                      onChange={(e) => setHIn(e.target.value)}
                    />
                  </label>
                  <label className="fld">
                    <span>{trs("k (শীর্ষ y)")}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="k"
                      value={kIn}
                      onChange={(e) => setKIn(e.target.value)}
                    />
                  </label>
                  <label className="fld">
                    <span>a</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="a"
                      value={aIn}
                      onChange={(e) => setAIn(e.target.value)}
                    />
                  </label>
                </div>
                <div className="preview-eq">
                  <span>{trs("প্রদর্শিত সমীকরণ")}</span>
                  <code>
                    {orientation === "x"
                      ? `(y ${k >= 0 ? "−" : "+"} ${toBn(Math.abs(k))})² = ${toBn(4 * a)}(x ${h >= 0 ? "−" : "+"} ${toBn(Math.abs(h))})`
                      : `(x ${h >= 0 ? "−" : "+"} ${toBn(Math.abs(h))})² = ${toBn(4 * a)}(y ${k >= 0 ? "−" : "+"} ${toBn(Math.abs(k))})`}
                  </code>
                </div>
              </div>
            ) : (
              <div className="eq-panel">
                <label className="fld">
                  <span>{trs("সমীকরণ লিখুন")}</span>
                  <input
                    ref={eqInputRef}
                    type="text"
                    value={eq}
                    onChange={(e) => setEq(e.target.value)}
                    onFocus={() => setKbOpen(true)}
                    placeholder="(y-k)^2 = 4a(x-h)"
                    spellCheck={false}
                    autoComplete="off"
                  />
                </label>
                {eqDetail && <EqStatus result={eqDetail} expected="parabola" />}
                <div className="hint">
                  {trs("উদাহরণ:")} <code>(y+3)^2=16(x-2)</code> {trs("বা")}{" "}
                  <code>(x-1)^2=8(y+4)</code>
                </div>
                {kbOpen && (
                  <MathKeyboard
                    onInsert={insertAtCursor}
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
                <span className="lbl">{trs("উপকেন্দ্রিক দূরত্বের জন্য বিন্দু (x, y)")}</span>
                <div className="fields" style={{ marginTop: 4 }}>
                  <label className="fld">
                    <span>x</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="x"
                      value={pxIn}
                      onChange={(e) => setPxIn(e.target.value)}
                    />
                  </label>
                  <label className="fld">
                    <span>y</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="y"
                      value={pyIn}
                      onChange={(e) => setPyIn(e.target.value)}
                    />
                  </label>
                </div>
              </div>
            </div>
          </section>

          <section className="card graph-card fade-in" ref={svgWrapRef} id="graph">
            <div className="graph-head">
              <h2>{trs("গ্রাফ")}</h2>
              <div className="graph-tools">
                <span className="chip">
                  <span className="dot" style={{ background: CONIC_COLORS.curve }} />
                  {trs("পরাবৃত্ত")}
                </span>
                <span className="chip">
                  <span className="dot" style={{ background: CONIC_COLORS.vertex }} />
                  {trs("শীর্ষ")}
                </span>
                <span className="chip">
                  <span className="dot" style={{ background: CONIC_COLORS.focus }} />
                  {trs("উপকেন্দ্র")}
                </span>
                <span className="chip">
                  <span className="dot" style={{ background: CONIC_COLORS.directrix }} />
                  {trs("নিয়ামক")}
                </span>
              </div>
            </div>
            {parsed ? (
              <ParabolaGraphInner parsed={parsed} />
            ) : (
              <div className="err soft">{trs("সঠিক ইনপুট দিন")}</div>
            )}
          </section>

          <section className="card results-card fade-in" id="results">
            <h2>{trs("ফলাফল ও ব্যাখ্যা")}</h2>
            {parsed ? (
              <ParabolaResults parsed={parsed} px={px} py={py} />
            ) : (
              <div className="err soft">{trs("সঠিক ইনপুট দিন — পরাবৃত্ত তৈরি হয়নি।")}</div>
            )}
          </section>
        </div>
      </main>
    </PageShell>
  );
}

function ParabolaGraphInner({ parsed }: { parsed: ParabolaParsed }) {
  const { h, k, a, orientation } = parsed;
  const span = Math.max(6, Math.abs(a) * 6);
  const bounds = { xmin: h - span, xmax: h + span, ymin: k - span, ymax: k + span };
  const geo = parabolaGeometry(parsed);
  const guides: Guide[] = [
    orientation === "x"
      ? { kind: "vline", x: h - a, color: CONIC_COLORS.directrix, dash: "6 5" }
      : { kind: "hline", y: k - a, color: CONIC_COLORS.directrix, dash: "6 5" },
    orientation === "x"
      ? { kind: "hline", y: k, color: CONIC_COLORS.axis, dash: "2 4", width: 1.4 }
      : { kind: "vline", x: h, color: CONIC_COLORS.axis, dash: "2 4", width: 1.4 },
    {
      kind: "segment",
      x1: geo.latusEnds[0][0],
      y1: geo.latusEnds[0][1],
      x2: geo.latusEnds[1][0],
      y2: geo.latusEnds[1][1],
      color: CONIC_COLORS.latus,
      width: 2.4,
    },
  ];
  const markers: Marker[] = [
    {
      x: geo.vertex[0],
      y: geo.vertex[1],
      color: CONIC_COLORS.vertex,
      name: trs("শীর্ষবিন্দু"),
      label: fmtPt(geo.vertex),
      placement: "above-left",
    },
    {
      x: geo.focus[0],
      y: geo.focus[1],
      color: CONIC_COLORS.focus,
      name: trs("উপকেন্দ্র"),
      label: fmtPt(geo.focus),
      placement: "below-right",
    },
    {
      x: geo.dirFoot[0],
      y: geo.dirFoot[1],
      color: CONIC_COLORS.dirFoot,
      name: trs("নিয়ামক পাদবিন্দু"),
      label: fmtPt(geo.dirFoot),
      placement: "below-left",
    },
    {
      x: geo.latusEnds[0][0],
      y: geo.latusEnds[0][1],
      color: CONIC_COLORS.latusEnd,
      name: trs("উপকেন্দ্রিক লম্বের প্রান্তবিন্দু"),
      label: fmtPt(geo.latusEnds[0]),
      placement: "above-right",
    },
    {
      x: geo.latusEnds[1][0],
      y: geo.latusEnds[1][1],
      color: CONIC_COLORS.latusEnd,
      name: trs("উপকেন্দ্রিক লম্বের প্রান্তবিন্দু"),
      label: fmtPt(geo.latusEnds[1]),
      placement: "below-right",
    },
  ];
  const curves =
    orientation === "x"
      ? [{ type: "xOfY" as const, fn: (y: number) => h + (y - k) ** 2 / (4 * a) }]
      : [{ type: "yOfX" as const, fn: (x: number) => k + (x - h) ** 2 / (4 * a) }];
  return (
    <ConicGraph
      bounds={bounds}
      curves={curves}
      guides={guides}
      markers={markers}
      ariaLabel={trs("পরাবৃত্ত গ্রাফ")}
    />
  );
}

function ParabolaResults({ parsed, px, py }: { parsed: ParabolaParsed; px: number; py: number }) {
  const { h, k, a, orientation } = parsed;
  const geo = parabolaGeometry(parsed);
  const axisEq = orientation === "x" ? `y = ${toBn(k)}` : `x = ${toBn(h)}`;
  const latusEq = orientation === "x" ? `x = ${toBn(h + a)}` : `y = ${toBn(k + a)}`;
  const dirEq = orientation === "x" ? `x = ${toBn(h - a)}` : `y = ${toBn(k - a)}`;
  const tangentEq = orientation === "x" ? `x = ${toBn(h)}` : `y = ${toBn(k)}`;
  const fd = focalDistanceParabola(parsed, px, py);

  const rows = [
    {
      c: CONIC_COLORS.vertex,
      l: trs("শীর্ষবিন্দু"),
      v: fmtPt(geo.vertex),
      steps: [
        trt`প্রদত্ত সমীকরণে শীর্ষরূপ: (y − k)² = 4a(x − h) অথবা (x − h)² = 4a(y − k)`,
        trt`এখানে h = ${toBn(h)}, k = ${toBn(k)}`,
        trt`∴ শীর্ষবিন্দু = (h, k) = ${fmtPt(geo.vertex)}`,
      ],
    },
    {
      c: CONIC_COLORS.focus,
      l: trs("উপকেন্দ্র"),
      v: fmtPt(geo.focus),
      steps: [
        orientation === "x"
          ? trt`x-অক্ষের সমান্তরাল অক্ষরেখা, তাই উপকেন্দ্র = (h + a, k)`
          : trt`y-অক্ষের সমান্তরাল অক্ষরেখা, তাই উপকেন্দ্র = (h, k + a)`,
        `a = ${toBn(a)}`,
        trt`∴ উপকেন্দ্র = ${fmtPt(geo.focus)}`,
      ],
    },
    {
      c: CONIC_COLORS.dirFoot,
      l: trs("নিয়ামক পাদবিন্দু"),
      v: fmtPt(geo.dirFoot),
      steps: [
        orientation === "x" ? trt`পাদবিন্দু = (h − a, k)` : trt`পাদবিন্দু = (h, k − a)`,
        `∴ = ${fmtPt(geo.dirFoot)}`,
      ],
    },
    {
      c: CONIC_COLORS.latusEnd,
      l: trs("উপকেন্দ্রিক লম্বের প্রান্তবিন্দুদ্বয়"),
      v: trt`${fmtPt(geo.latusEnds[0])} ও ${fmtPt(geo.latusEnds[1])}`,
      steps: [
        trt`উপকেন্দ্র দিয়ে অক্ষের লম্ব রেখা প্যারাবোলাকে যেখানে ছেদ করে`,
        orientation === "x"
          ? trt`x = h + a বসিয়ে (y − k)² = 4a·a ⇒ y = k ± 2|a|`
          : trt`y = k + a বসিয়ে (x − h)² = 4a·a ⇒ x = h ± 2|a|`,
        trt`∴ প্রান্তবিন্দু = ${fmtPt(geo.latusEnds[0])} ও ${fmtPt(geo.latusEnds[1])}`,
      ],
    },
    {
      c: CONIC_COLORS.axis,
      l: trs("অক্ষরেখার সমীকরণ"),
      v: axisEq,
      steps: [
        orientation === "x"
          ? trt`অক্ষ শীর্ষ দিয়ে অতিক্রম করে x-অক্ষের সমান্তরাল`
          : trt`অক্ষ শীর্ষ দিয়ে অতিক্রম করে y-অক্ষের সমান্তরাল`,
        `∴ ${axisEq}`,
      ],
    },
    {
      c: CONIC_COLORS.latus,
      l: trs("উপকেন্দ্রিক লম্বের সমীকরণ"),
      v: latusEq,
      steps: [trt`উপকেন্দ্র বিন্দু দিয়ে অক্ষের লম্ব রেখা`, `∴ ${latusEq}`],
    },
    {
      c: CONIC_COLORS.directrix,
      l: trs("নিয়ামকের সমীকরণ"),
      v: dirEq,
      steps: [orientation === "x" ? trt`নিয়ামক x = h − a` : trt`নিয়ামক y = k − a`, `∴ ${dirEq}`],
    },
    {
      c: CONIC_COLORS.tangent,
      l: trs("শীর্ষবিন্দুতে স্পর্শকের সমীকরণ"),
      v: tangentEq,
      steps: [trt`শীর্ষে অক্ষের লম্ব হলো স্পর্শক`, `∴ ${tangentEq}`],
    },
    {
      c: CONIC_COLORS.latus,
      l: trs("উপকেন্দ্রিক লম্বের দৈর্ঘ্য"),
      v: trt`|৪a| = ${toBn(Math.abs(4 * a))}`,
      steps: [trt`দৈর্ঘ্য = |4a| = ${toBn(Math.abs(4 * a))} একক`],
    },
    {
      c: "#22d3ee",
      l: trt`(${toBn(px)}, ${toBn(py)}) বিন্দুর উপকেন্দ্রিক দূরত্ব`,
      v: fmtNum(fd),
      steps: [
        trt`উপকেন্দ্রিক দূরত্ব = বিন্দু থেকে নিয়ামকের দূরত্ব`,
        orientation === "x"
          ? `= |x − (h − a)| = |${toBn(px)} − ${toBn(h - a)}| = ${fmtNum(fd)}`
          : `= |y − (k − a)| = |${toBn(py)} − ${toBn(k - a)}| = ${fmtNum(fd)}`,
      ],
    },
  ];

  return (
    <ul className="res-list">
      {rows.map((r, i) => (
        <CollapsibleRow key={i} color={r.c} label={r.l} value={r.v} steps={r.steps} index={i} />
      ))}
    </ul>
  );
}
