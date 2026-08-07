import { trs } from "@/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/conics/Shared";
import { Tex } from "@/components/conics/Tex";
import { ParabolaGraph, ADV_COLORS } from "@/components/conics/ParabolaGraph";
import { downloadGraphPng } from "@/lib/conics/export-graph";
import {
  MODES,
  initialValues,
  modeById,
  solveMode,
  type ModeSolution,
  type Values,
} from "@/lib/conics/parabola-modes";
import { AlertTriangle, Sparkles, Share2, Download } from "lucide-react";
import { copyShareLink } from "@/lib/conics/share";
import { ModeSelector } from "@/components/conics/ModeSelector";
import { CenterToast, type CenterToastState } from "@/components/conics/CenterToast";

const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

const FIELD_KEYS = Array.from(new Set(MODES.flatMap((m) => m.fields.map((f) => f.key))));

export const Route = createFileRoute("/parabola-solver")({
  validateSearch: (raw: Record<string, unknown>): Record<string, string> => {
    const out: Record<string, string> = {};
    const t = str(raw.type);
    if (MODES.some((m) => m.id === t.toUpperCase())) out.type = t.toUpperCase();
    for (const k of FIELD_KEYS) {
      const v = str(raw[k]);
      if (v) out[k] = v;
    }
    return out;
  },
  head: () => ({
    meta: [
      { title: trs("উন্নত পরাবৃত্ত সমাধান ও গ্রাফ — Conic Studio") },
      {
        name: "description",
        content: trs(
          "উপকেন্দ্র, নিয়ামক, শীর্ষ বা আদর্শ সমীকরণ — যেকোনো তথ্য থেকে পরাবৃত্তের সম্পূর্ণ ধাপে ধাপে সমাধান ও পরিষ্কার লেখচিত্র।",
        ),
      },
      { property: "og:title", content: trs("উন্নত পরাবৃত্ত সমাধান ও গ্রাফ") },
      {
        property: "og:description",
        content: trs("SP = PM সংজ্ঞা থেকে সম্পূর্ণ বীজগাণিতিক সমাধান ও নির্ভুল লেখচিত্র।"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdvancedSolverPage,
});

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
  const [modeId, setModeId] = useState<string>(search.type ?? "B");
  const mode = modeById(modeId);
  const [values, setValues] = useState<Values>(() => initialValues(mode, search));
  const graphRef = useRef<HTMLDivElement>(null);
  const [modeToast, setModeToast] = useState<CenterToastState>(null);

  const changeMode = (id: string) => {
    setModeId(id);
    setValues(initialValues(modeById(id)));
    setModeToast({ id: Date.now(), message: trs(modeById(id).label) });
  };

  const setField = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const outcome: { ok: true; sol: ModeSolution } | { ok: false; msg: string } = useMemo(() => {
    try {
      return { ok: true, sol: solveMode(modeId, values) };
    } catch (e) {
      return { ok: false, msg: e instanceof Error ? e.message : trs("সমাধান করা যায়নি") };
    }
  }, [modeId, values]);

  const currentSearch = (): Record<string, string> => ({ type: modeId, ...values });

  const share = async () => {
    if (!outcome.ok) {
      toast.error(trs("আগে সঠিক ইনপুট দিন"));
      return;
    }
    try {
      const { url, copied } = await copyShareLink(
        "/parabola-solver",
        currentSearch() as Record<string, string>,
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

  const download = async () => {
    try {
      await downloadGraphPng(graphRef.current, "advanced-parabola-graph.png");
      toast.success(trs("গ্রাফ ডাউনলোড হয়েছে"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : trs("ডাউনলোড ব্যর্থ"));
    }
  };

  return (
    <PageShell>
      <CenterToast toast={modeToast} />
      <main className="page-main">
        <section className="adv-hero fade-in">
          <span className="adv-chip">
            <Sparkles size={13} /> Advanced Parabola Solver
          </span>
          <h1>{trs("উন্নত পরাবৃত্ত সমাধান ও পরিষ্কার লেখচিত্র")}</h1>
          <p>
            {trs(
              "যেকোনো ধরনের পরাবৃত্ত সমস্যার সম্পূর্ণ বীজগাণিতিক সমাধান — SP = PM সংজ্ঞা থেকে শুরু করে সাধারণ দ্বিঘাত আকার পর্যন্ত, একটি ধাপও বাদ না দিয়ে।",
            )}
          </p>
        </section>

        <div className="adv-grid">
          <section className="card adv-input fade-in">
            <h2>{trs("ইনপুট")}</h2>
            <div className="fld-block">
              <span className="lbl-sm">{trs("সমস্যার ধরন")}</span>
              <ModeSelector modes={MODES} value={modeId} onChange={changeMode} />
              <p className="lbl-hint">{trs(mode.hint)}</p>
            </div>

            {mode.fields.map((f) => (
              <div className="fld-block" key={f.key}>
                <span className="lbl-sm">{trs(f.label)}</span>
                {f.kind === "select" ? (
                  <select
                    className="adv-select"
                    value={values[f.key] ?? f.init ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                  >
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {trs(o.label)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="adv-text"
                    value={values[f.key] ?? ""}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder ?? trs(f.label)}
                    spellCheck={false}
                    autoComplete="off"
                    inputMode={f.kind === "number" ? "decimal" : undefined}
                  />
                )}
                {f.samples && (
                  <div className="chips">
                    {f.samples.map((s) => (
                      <button key={s} onClick={() => setField(f.key, s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {!outcome.ok && (
              <div className="adv-err">
                <AlertTriangle size={15} />
                <span>{outcome.msg}</span>
              </div>
            )}

            {outcome.ok && (
              <div className="adv-facts">
                {outcome.sol.facts.map((f, i) => (
                  <div
                    className="adv-fact"
                    key={`${f.label}-${i}`}
                    style={{ borderLeftColor: f.color }}
                  >
                    <span style={{ color: f.color }}>{f.label}</span>
                    <Tex math={f.tex} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card adv-graph fade-in" ref={graphRef}>
            <div className="graph-head">
              <h2>{trs("লেখচিত্র")}</h2>
              <div className="actions">
                <button className="icon-btn" onClick={share}>
                  <Share2 size={14} /> {trs("শেয়ার")}
                </button>
                <button className="icon-btn primary" onClick={download}>
                  <Download size={14} /> PNG
                </button>
              </div>
            </div>
            {outcome.ok ? (
              <ParabolaGraph res={outcome.sol.res} extras={outcome.sol.extras} />
            ) : (
              <div className="adv-empty">{trs("সঠিক ইনপুট দিন, গ্রাফ এখানে দেখা যাবে।")}</div>
            )}
            {outcome.ok && (
              <div className="legend">
                {LEGEND.map((g) => (
                  <span key={g.l}>
                    <i style={{ background: g.c }} />
                    {trs(g.l)}
                  </span>
                ))}
                {outcome.sol.extras.map((e, i) => (
                  <span key={`x-${i}`}>
                    <i style={{ background: e.color }} />
                    {e.name}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {outcome.ok && (
          <section className="card adv-solution fade-in">
            <h2>{trs("ধাপে ধাপে সম্পূর্ণ সমাধান")}</h2>
            <div className="adv-final">
              <span>{trs("নির্ণেয় সমীকরণ")}</span>
              <Tex math={outcome.sol.res.generalTex} block />
              <Tex math={outcome.sol.res.standardTex} block />
            </div>
            <ol className="steps">
              {outcome.sol.steps.map((s, i) => (
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
