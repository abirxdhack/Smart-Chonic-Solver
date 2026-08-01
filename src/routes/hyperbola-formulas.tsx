import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/conics/Shared";
import { FormulaTable, type FormulaRow } from "@/components/conics/FormulaTable";

export const Route = createFileRoute("/hyperbola-formulas")({
  head: () => ({
    meta: [
      { title: "অধিবৃত্তের সূত্রাবলী — Conic Studio" },
      { name: "description", content: "অধিবৃত্তের সকল উপাদান — কেন্দ্র, উৎকেন্দ্রিকতা, অক্ষ, ফোকাস, নিয়ামক, উপকেন্দ্রিক লম্ব, অসীমতট রেখা — ৪ কেসের সম্পূর্ণ সূত্র টেবিল।" },
      { property: "og:title", content: "অধিবৃত্তের সূত্রাবলী চার্ট" },
      { property: "og:description", content: "১৫টি উপাদানের নিয়ন সূত্র টেবিল অধিবৃত্তের সকল কেসের জন্য।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const rows: FormulaRow[] = [
  { label: "কেন্দ্রের স্থানাঙ্ক", cells: ["(0, 0)", "(0, 0)", "(α, β)", "(α, β)"] },
  { label: "উৎকেন্দ্রিকতা (e)", cells: ["√(1 + b²/a²)", "√(1 + a²/b²)", "√(1 + b²/a²)", "√(1 + a²/b²)"] },
  { label: "আড় অক্ষের দৈর্ঘ্য", cells: ["2a", "2b", "2a", "2b"] },
  { label: "অনুবন্ধী অক্ষের দৈর্ঘ্য", cells: ["2b", "2a", "2b", "2a"] },
  { label: "আড় অক্ষের সমীকরণ", cells: ["y = 0", "x = 0", "y − β = 0", "x − α = 0"] },
  { label: "অনুবন্ধী অক্ষের সমীকরণ", cells: ["x = 0", "y = 0", "x − α = 0", "y − β = 0"] },
  { label: "শীর্ষদ্বয়ের স্থানাঙ্ক", cells: ["(±a, 0)", "(0, ±b)", "(±a + α, β)", "(α, ±b + β)"] },
  { label: "ফোকাসদ্বয়ের স্থানাঙ্ক", cells: ["(±ae, 0) বা (±√(a²+b²), 0)", "(0, ±be) বা (0, ±√(a²+b²))", "(±ae + α, β)", "(α, ±be + β)"] },
  { label: "ফোকাসদ্বয়ের দূরত্ব", cells: ["2ae = 2√(a²+b²)", "2be = 2√(a²+b²)", "2ae", "2be"] },
  { label: "নিয়ামকের পাদবিন্দু", cells: ["(±a/e, 0)", "(0, ±b/e)", "(±a/e + α, β)", "(α, ±b/e + β)"] },
  { label: "নিয়ামক রেখাদ্বয়ের দূরত্ব", cells: ["2a/e = 2a²/√(a²+b²)", "2b/e = 2b²/√(a²+b²)", "2a/e", "2b/e"] },
  { label: "নিয়ামক রেখার সমীকরণ", cells: ["x = ±a/e", "y = ±b/e", "x − α = ±a/e", "y − β = ±b/e"] },
  { label: "উপকেন্দ্রিক লম্বের দৈর্ঘ্য", cells: ["2b²/a", "2a²/b", "2b²/a", "2a²/b"] },
  { label: "উপকেন্দ্রিক লম্বের সমীকরণ", cells: ["x = ±ae", "y = ±be", "x − α = ±ae", "y − β = ±be"] },
  { label: "অসীমতট রেখা", cells: ["y = ±(b/a)x", "y = ±(a/b)x", "y − β = ±(b/a)(x − α)", "y − β = ±(a/b)(x − α)"] },
];

function Page() {
  return (
    <PageShell>
      <main className="page-main">
        <section className="neon-hero fade-in">
          <span className="neon-hero-badge">অধিবৃত্ত · Hyperbola</span>
          <h1>অধিবৃত্তের <span className="neon-gradient-text">সম্পূর্ণ সূত্রাবলী</span></h1>
          <p>মূল ও সরিত অধিবৃত্তের ১৫টি উপাদানের নিয়ন টেবিল — চারটি কেস একত্রে।</p>
        </section>

        <section className="neon-card fade-in">
          <h2>সকল কেসের সমন্বিত সূত্র চার্ট</h2>
          <FormulaTable
            accent="magenta"
            headers={[
              <>x²/a² − y²/b² = 1<br/><small>আড় অক্ষ x বরাবর</small></>,
              <>y²/b² − x²/a² = 1<br/><small>আড় অক্ষ y বরাবর</small></>,
              <>(x−α)²/a² − (y−β)²/b² = 1<br/><small>সরিত, x বরাবর</small></>,
              <>(y−β)²/b² − (x−α)²/a² = 1<br/><small>সরিত, y বরাবর</small></>,
            ]}
            rows={rows}
          />
        </section>
      </main>
    </PageShell>
  );
}
