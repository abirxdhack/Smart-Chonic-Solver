import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/conics/Shared";
import { Tex } from "@/components/conics/Tex";
import { ParabolaGraph, ADV_COLORS } from "@/components/conics/ParabolaGraph";
import { downloadGraphPng } from "@/lib/conics/export-graph";
import {
  parseLine,
  solveAdvanced,
  type AdvResult,
  type ProblemType,
} from "@/lib/conics/adv-parabola";
import { AlertTriangle, Sparkles, Share2, Download } from "lucide-react";
import { copyShareLink } from "@/lib/conics/share";

type Search = {
  type: ProblemType;
  eq: string;
  fx: string;
  fy: string;
  vx: string;
  vy: string;
  dir: string;
};

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

export const Route = createFileRoute("/parabola-solver")({
  validateSearch: (raw: Record<string, unknown>): Partial<Search> => {
    const t = str(raw.type).toUpperCase();
    const out: Partial<Search> = {};
    if (t === "A" || t === "B" || t === "C" || t === "D") out.type = t;
    for (const k of ["eq", "fx", "fy", "vx", "vy", "dir"] as const) {
      const v = str(raw[k]);
      if (v) out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: "উন্নত পরাবৃত্ত সমাধান ও গ্রাফ — Conic Studio" },
      {
        name: "description",
        content:
          "উপকেন্দ্র, নিয়ামক, শীর্ষ বা আদর্শ সমীকরণ — যেকোনো তথ্য থেকে পরাবৃত্তের সম্পূর্ণ ধাপে ধাপে সমাধান ও পরিষ্কার লেখচিত্র।",
      },
      { property: "og:title", content: "উন্নত পরাবৃত্ত সমাধান ও গ্রাফ" },
      {
        property: "og:description",
        content: "SP = PM সংজ্ঞা থেকে সম্পূর্ণ বীজগাণিতিক সমাধান ও নির্ভুল লেখচিত্র।",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdvancedSolverPage,
});

const TYPES: { id: ProblemType; label: string; hint: string }[] = [
  { id: "A", label: "Type A — আদর্শ সমীকরণ", hint: "যেমন y² = 32x অথবা x² = 12y" },
  { id: "B", label: "Type B — উপকেন্দ্র + নিয়ামক", hint: "S(x₁, y₁) এবং ax + by + c = 0" },
  { id: "C", label: "Type C — শীর্ষ + নিয়ামক", hint: "A(h, k) এবং ax + by + c = 0" },
  { id: "D", label: "Type D — উপকেন্দ্র + শীর্ষ", hint: "S(x₁, y₁) এবং A(h, k)" },
];

const LEGEND = [
  { c: ADV_COLORS.curve, l: "পরাবৃত্ত" },
  { c: ADV_COLORS.focus, l: "উপকেন্দ্র S" },
  { c: ADV_COLORS.vertex, l: "শীর্ষ A" },
  { c: ADV_COLORS.directrix, l: "নিয়ামক" },
  { c: ADV_COLORS.axis, l: "অক্ষরেখা" },
  { c: ADV_COLORS.latus, l: "উপকেন্দ্রিক লম্ব" },
  { c: ADV_COLORS.focal, l: "উপকেন্দ্রিক দূরত্ব" },
];

function AdvancedSolverPage() {
  const search = Route.useSearch();
  const [type, setType] = useState<ProblemType>(search.type ?? "B");
  const [equation, setEquation] = useState(search.eq ?? "");
  const [fx, setFx] = useState(search.fx ?? "");
  const [fy, setFy] = useState(search.fy ?? "");
  const [vx, setVx] = useState(search.vx ?? "");
  const [vy, setVy] = useState(search.vy ?? "");
  const [dirText, setDirText] = useState(search.dir ?? "");
  const graphRef = useRef<HTMLDivElement>(null);

  const num = (s: string, name: string) => {
    const v = parseFloat(s);
    if (!s.trim() || !isFinite(v)) throw new Error(`${name} সঠিকভাবে লিখুন`);
    return v;
  };

  const outcome: { ok: true; res: AdvResult } | { ok: false; msg: string } = useMemo(() => {
    try {
      if (type === "A") {
        if (!equation.trim()) throw new Error("পরাবৃত্তের সমীকরণ লিখুন");
        return { ok: true, res: solveAdvanced({ kind: "A", equation }) };
      }
      if (type === "B")
        return {
          ok: true,
          res: solveAdvanced({
            kind: "B",
            focus: [num(fx, "উপকেন্দ্রের x"), num(fy, "উপকেন্দ্রের y")],
            directrix: parseLine(dirText),
          }),
        };
      if (type === "C")
        return {
          ok: true,
          res: solveAdvanced({
            kind: "C",
            vertex: [num(vx, "শীর্ষের x"), num(vy, "শীর্ষের y")],
            directrix: parseLine(dirText),
          }),
        };
      return {
        ok: true,
        res: solveAdvanced({
          kind: "D",
          focus: [num(fx, "উপকেন্দ্রের x"), num(fy, "উপকেন্দ্রের y")],
          vertex: [num(vx, "শীর্ষের x"), num(vy, "শীর্ষের y")],
        }),
      };
    } catch (e) {
      return { ok: false, msg: e instanceof Error ? e.message : "সমাধান করা যায়নি" };
    }
  }, [type, equation, fx, fy, vx, vy, dirText]);

  const currentSearch = (): Partial<Search> => {
    if (type === "A") return { type, eq: equation };
    if (type === "B") return { type, fx, fy, dir: dirText };
    if (type === "C") return { type, vx, vy, dir: dirText };
    return { type, fx, fy, vx, vy };
  };

  const share = async () => {
    if (!outcome.ok) {
      toast.error("আগে সঠিক ইনপুট দিন");
      return;
    }
    try {
      const { url, copied } = await copyShareLink(
        "/parabola-solver",
        currentSearch() as Record<string, string>,
      );
      toast[copied ? "success" : "info"](copied ? "লিংক কপি হয়েছে!" : "শেয়ার লিংক তৈরি হয়েছে", {
        description: url,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "শেয়ার করা যায়নি");
    }
  };

  const download = async () => {
    try {
      await downloadGraphPng(graphRef.current, "advanced-parabola-graph.png");
      toast.success("গ্রাফ ডাউনলোড হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ডাউনলোড ব্যর্থ");
    }
  };

  return (
    <PageShell>
      <main className="page-main">
        <section className="adv-hero fade-in">
          <span className="adv-chip">
            <Sparkles size={13} /> Advanced Parabola Solver
          </span>
          <h1>উন্নত পরাবৃত্ত সমাধান ও পরিষ্কার লেখচিত্র</h1>
          <p>
            যেকোনো ধরনের পরাবৃত্ত সমস্যার সম্পূর্ণ বীজগাণিতিক সমাধান — SP = PM সংজ্ঞা থেকে শুরু করে সাধারণ
            দ্বিঘাত আকার পর্যন্ত, একটি ধাপও বাদ না দিয়ে।
          </p>
        </section>

        <div className="adv-grid">
          <section className="card adv-input fade-in">
            <h2>ইনপুট</h2>
            <div className="fld-block">
              <span className="lbl-sm">সমস্যার ধরন</span>
              <select
                className="adv-select"
                value={type}
                onChange={(e) => setType(e.target.value as ProblemType)}
              >
                {TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="lbl-hint">{TYPES.find((t) => t.id === type)?.hint}</p>
            </div>

            {type === "A" && (
              <div className="fld-block">
                <span className="lbl-sm">পরাবৃত্তের সমীকরণ</span>
                <input
                  className="adv-text"
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  placeholder="y^2 = 32x"
                  spellCheck={false}
                  autoComplete="off"
                />
                <div className="chips">
                  {["y^2 = 32x", "x^2 = 12y", "(y-3)^2 = 8(x+1)", "y = x^2 - 4x + 7"].map((s) => (
                    <button key={s} onClick={() => setEquation(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(type === "B" || type === "D") && (
              <div className="fld-block">
                <span className="lbl-sm">উপকেন্দ্র S (x₁, y₁)</span>
                <div className="two">
                  <input
                    className="adv-text"
                    value={fx}
                    onChange={(e) => setFx(e.target.value)}
                    placeholder="x₁"
                    inputMode="decimal"
                  />
                  <input
                    className="adv-text"
                    value={fy}
                    onChange={(e) => setFy(e.target.value)}
                    placeholder="y₁"
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}

            {(type === "C" || type === "D") && (
              <div className="fld-block">
                <span className="lbl-sm">শীর্ষবিন্দু A (h, k)</span>
                <div className="two">
                  <input
                    className="adv-text"
                    value={vx}
                    onChange={(e) => setVx(e.target.value)}
                    placeholder="h"
                    inputMode="decimal"
                  />
                  <input
                    className="adv-text"
                    value={vy}
                    onChange={(e) => setVy(e.target.value)}
                    placeholder="k"
                    inputMode="decimal"
                  />
                </div>
              </div>
            )}

            {(type === "B" || type === "C") && (
              <div className="fld-block">
                <span className="lbl-sm">নিয়ামক রেখা (ax + by + c = 0)</span>
                <input
                  className="adv-text"
                  value={dirText}
                  onChange={(e) => setDirText(e.target.value)}
                  placeholder="3x - 4y = 1"
                  spellCheck={false}
                  autoComplete="off"
                />
                <div className="chips">
                  {["3x - 4y = 1", "x + y = 2", "x = -3", "y = 4"].map((s) => (
                    <button key={s} onClick={() => setDirText(s)}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {!outcome.ok && (
              <div className="adv-err">
                <AlertTriangle size={15} />
                <span>{outcome.msg}</span>
              </div>
            )}

            {outcome.ok && (
              <div className="adv-facts">
                {outcome.res.facts.map((f) => (
                  <div className="adv-fact" key={f.label} style={{ borderLeftColor: f.color }}>
                    <span style={{ color: f.color }}>{f.label}</span>
                    <Tex math={f.tex} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card adv-graph fade-in" ref={graphRef}>
            <div className="graph-head">
              <h2>লেখচিত্র</h2>
              <div className="actions">
                <button className="icon-btn" onClick={share}>
                  <Share2 size={14} /> শেয়ার
                </button>
                <button className="icon-btn primary" onClick={download}>
                  <Download size={14} /> PNG
                </button>
              </div>
            </div>
            {outcome.ok ? (
              <ParabolaGraph res={outcome.res} />
            ) : (
              <div className="adv-empty">সঠিক ইনপুট দিন, গ্রাফ এখানে দেখা যাবে।</div>
            )}
            {outcome.ok && (
              <div className="legend">
                {LEGEND.map((g) => (
                  <span key={g.l}>
                    <i style={{ background: g.c }} />
                    {g.l}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {outcome.ok && (
          <section className="card adv-solution fade-in">
            <h2>ধাপে ধাপে সম্পূর্ণ সমাধান</h2>
            <div className="adv-final">
              <span>নির্ণেয় সমীকরণ</span>
              <Tex math={outcome.res.generalTex} block />
              <Tex math={outcome.res.standardTex} block />
            </div>
            <ol className="steps">
              {outcome.res.steps.map((s, i) => (
                <li key={i}>
                  <h3>{s.title}</h3>
                  {s.note && <p className="step-note">{s.note}</p>}
                  <div className="step-math">
                    {s.lines.map((m, j) => (
                      <Tex key={j} math={m} block />
                    ))}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </PageShell>
  );
}
