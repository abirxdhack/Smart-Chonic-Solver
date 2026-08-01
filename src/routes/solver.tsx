import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageShell } from "@/components/conics/Shared";
import { solveGeneral } from "@/lib/conics/general-solver";
import { toBn } from "@/lib/conics/format";
import { ChevronDown, Sparkles, Wand2, Zap, Share2, Download } from "lucide-react";
import { SolutionGraph } from "@/components/conics/SolutionGraph";
import { ADV_COLORS } from "@/components/conics/ParabolaGraph";
import { copyShareLink, passthroughSearch } from "@/lib/conics/share";
import { downloadGraphPng } from "@/lib/conics/export-graph";

export const Route = createFileRoute("/solver")({
  validateSearch: passthroughSearch,
  head: () => ({
    meta: [
      { title: "কণিকের সাধারণ সমীকরণ সমাধান — Conic Studio" },
      { name: "description", content: "যেকোন সাধারণ কণিক সমীকরণ থেকে মূলধন চলক প্রতিস্থাপন পদ্ধতিতে ধাপে ধাপে সম্পূর্ণ সমাধান।" },
      { property: "og:title", content: "কণিকের সাধারণ সমীকরণ সমাধান" },
      { property: "og:description", content: "Capital Variable পদ্ধতিতে ধাপে ধাপে ব্যাখ্যা।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SolverPage,
});

const EXAMPLES = [
  "y^2 = 4x + 4y - 8",
  "x^2 + 4x + 2y = 0",
  "3x^2 - 4y + 3x - 5 = 0",
  "25x^2 - 16y^2 = 400",
  "9x^2 + 16y^2 - 36x + 96y + 36 = 0",
  "(x-2)^2 + (y+1)^2/4 = 1",
];

function SolverPage() {
  const search = Route.useSearch();
  const [eq, setEq] = useState<string>(search.eq ?? "y^2 = 4x + 4y - 8");
  const [openStep, setOpenStep] = useState<number | null>(0);
  const graphRef = useRef<HTMLDivElement>(null);
  const result = useMemo(() => solveGeneral(eq), [eq]);

  const share = async () => {
    try {
      const { url, copied } = await copyShareLink("/solver", { eq });
      toast[copied ? "success" : "info"](copied ? "লিংক কপি হয়েছে!" : "শেয়ার লিংক তৈরি হয়েছে", {
        description: url,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "শেয়ার করা যায়নি");
    }
  };

  const downloadPng = async () => {
    try {
      await downloadGraphPng(graphRef.current, "conic-solution-graph.png");
      toast.success("গ্রাফ ডাউনলোড হয়েছে");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "ডাউনলোড ব্যর্থ");
    }
  };

  const kindLabel = result.ok
    ? result.solution.kind === "parabola"
      ? "পরাবৃত্ত"
      : result.solution.kind === "ellipse"
      ? "উপবৃত্ত"
      : "অধিবৃত্ত"
    : null;

  return (
    <PageShell>
      <main className="page-main">
        <section className="neon-hero fade-in">
          <div className="neon-hero-badge">
            <Sparkles size={14} /> Capital Variable Method · X = x − α, Y = y − β
          </div>
          <h1>
            যেকোন কণিক সমীকরণের <span className="neon-gradient-text">ধাপে ধাপে</span> সম্পূর্ণ সমাধান
          </h1>
          <p>
            পরাবৃত্ত, উপবৃত্ত অথবা অধিবৃত্ত — সাধারণ রূপ থেকে বর্গ সম্পূর্ণ, মূলধন চলক
            প্রতিস্থাপন, এবং প্রতিটি উপাদানের নির্ণয় স্পষ্ট ব্যাখ্যাসহ।
          </p>
        </section>

        <section className="neon-card fade-in" style={{ marginTop: 16 }}>
          <div className="card-title">
            <h2>
              <Wand2 size={16} style={{ verticalAlign: "-3px", marginRight: 8, color: "#00F0FF" }} />
              সমীকরণ ইনপুট
            </h2>
            <div className="actions">
              <button className="icon-btn" onClick={share} type="button">
                <Share2 size={14} /> শেয়ার
              </button>
              <button className="icon-btn primary" onClick={downloadPng} type="button">
                <Download size={14} /> PNG
              </button>
            </div>
          </div>
          <label className="fld">
            <span>সমীকরণ লিখুন (উদা: y^2 = 4x + 4y − 8)</span>
            <input
              className="neon-input"
              value={eq}
              onChange={(e) => setEq(e.target.value)}
              placeholder="x^2 + y^2 + ... = ..."
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <div className="example-chips">
            {EXAMPLES.map((ex) => (
              <button key={ex} className="example-chip" onClick={() => setEq(ex)} type="button">
                {ex}
              </button>
            ))}
          </div>
          <div className="rule-box">
            <h4>সবচেয়ে সহজ নিয়ম (ধাপে ধাপে মনে রাখো)</h4>
            <ul>
              <li>ধাপ ১: সব পদ এক পাশে এনে সাধারণ রূপ Ax² + Cy² + Dx + Ey + F = 0 বানাও।</li>
              <li>ধাপ ২: একটিমাত্র বর্গ পদ থাকলে পরাবৃত্ত; দুই বর্গ একই চিহ্নে হলে উপবৃত্ত; বিপরীত চিহ্নে হলে অধিবৃত্ত।</li>
              <li>ধাপ ৩: x ও y আলাদা করে বর্গ সম্পূর্ণ করো — সহগের অর্ধেকের বর্গ যোগ করো।</li>
              <li>ধাপ ৪: X = x − α, Y = y − β বসাও; সমীকরণ প্রামাণ্য রূপে চলে আসবে।</li>
              <li>ধাপ ৫: প্রামাণ্য রূপের সূত্র দিয়ে শীর্ষ, ফোকাস, নিয়ামক ও উপকেন্দ্রিক লম্ব বের করো।</li>
              <li>ধাপ ৬: শেষে X = x − α, Y = y − β ফিরিয়ে দিয়ে ছোট x, y-তে উত্তর লেখো।</li>
            </ul>
          </div>
        </section>

        {result.ok ? (
          <>
            <section className="neon-card fade-in" style={{ marginTop: 16 }}>
              <div className="neon-status ok">
                <div className="neon-status-row">
                  <span className="neon-badge cyan">সনাক্তকৃত ধরন</span>
                  <strong>{kindLabel}</strong>
                </div>
                <div className="neon-status-row">
                  <span className="neon-badge magenta">প্রামাণ্য রূপ</span>
                  <code>{toBn(result.solution.standard)}</code>
                </div>
                <div className="neon-status-row">
                  <span className="neon-badge purple">মূলধন চলকে</span>
                  <code>{toBn(result.solution.transformed)}</code>
                </div>
              </div>
            </section>

            <section className="neon-card graph-card fade-in" style={{ marginTop: 16 }} ref={graphRef} id="graph">
              <div className="graph-head">
                <h2>লেখচিত্র</h2>
                <div className="graph-tools">
                  <span className="chip"><span className="dot" style={{ background: ADV_COLORS.curve }} />বক্ররেখা</span>
                  <span className="chip"><span className="dot" style={{ background: ADV_COLORS.vertex }} />শীর্ষ/কেন্দ্র</span>
                  <span className="chip"><span className="dot" style={{ background: ADV_COLORS.focus }} />ফোকাস</span>
                  <span className="chip"><span className="dot" style={{ background: ADV_COLORS.directrix }} />নিয়ামক</span>
                  <span className="chip"><span className="dot" style={{ background: ADV_COLORS.latus }} />উপকেন্দ্রিক লম্ব</span>
                </div>
              </div>
              <SolutionGraph solution={result.solution} />
            </section>

            <section className="neon-card fade-in" style={{ marginTop: 16 }}>
              <div className="card-title">
                <h2>
                  <Zap size={16} style={{ verticalAlign: "-3px", marginRight: 8, color: "#B026FF" }} /> ধাপে ধাপে
                  সমাধান
                </h2>
              </div>
              <div className="accordion-list">
                {result.steps.map((s, i) => {
                  const open = openStep === i;
                  return (
                    <div key={i} className={`accordion-item ${open ? "open" : ""}`}>
                      <button
                        type="button"
                        className="accordion-head"
                        onClick={() => setOpenStep(open ? null : i)}
                        aria-expanded={open}
                      >
                        <span className="accordion-num">{toBn(String(i + 1))}</span>
                        <span className="accordion-title">{toBn(s.title)}</span>
                        <ChevronDown size={16} className="accordion-caret" />
                      </button>
                      {open && (
                        <div className="accordion-body">
                          <p className="accordion-explain">{toBn(s.explanation)}</p>
                          <div className="accordion-math">
                            {s.math.map((m, j) => (
                              <code key={j}>{toBn(m)}</code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="neon-card fade-in" style={{ marginTop: 16 }}>
              <div className="card-title">
                <h2>সম্পূর্ণ উপাদান তালিকা</h2>
              </div>
              <div className="items-grid">
                {result.solution.items.map((it, i) => (
                  <div className="item-card" key={i} style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="item-label">{toBn(it.label)}</div>
                    <div className="item-value">{toBn(it.value)}</div>
                    {it.note && <div className="item-note">{toBn(it.note)}</div>}
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="neon-card fade-in" style={{ marginTop: 16 }}>
            <div className="neon-status err">
              <div className="neon-status-row">
                <span className="neon-badge err">ত্রুটি</span>
                <strong>{result.error}</strong>
              </div>
              {result.suggestion && (
                <div className="neon-status-row">
                  <span className="neon-badge">পরামর্শ</span>
                  <span>{result.suggestion}</span>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}
