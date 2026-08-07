import { trs } from "@/i18n";
import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/conics/Shared";
import { FormulaTable, type FormulaRow } from "@/components/conics/FormulaTable";

export const Route = createFileRoute("/ellipse-formulas")({
  head: () => ({
    meta: [
      { title: trs("উপবৃত্তের সূত্রাবলী — Conic Studio") },
      {
        name: "description",
        content: trs(
          "উপবৃত্তের সকল উপাদান — কেন্দ্র, উৎকেন্দ্রিকতা, অক্ষ, ফোকাস, নিয়ামক, উপকেন্দ্রিক লম্ব — সরিত ও অসরিত কেসের সম্পূর্ণ সূত্র টেবিল।",
        ),
      },
      { property: "og:title", content: trs("উপবৃত্তের সূত্রাবলী চার্ট") },
      {
        property: "og:description",
        content: trs("১৪টি উপাদানের নিয়ন সূত্র টেবিল উপবৃত্তের সকল কেসের জন্য।"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const rowsMain: FormulaRow[] = [
  { label: "কেন্দ্রের স্থানাঙ্ক", cells: ["(0, 0)", "(0, 0)"] },
  { label: "উৎকেন্দ্রিকতা (e)", cells: ["e = √(1 − b²/a²)", "e = √(1 − a²/b²)"] },
  { label: "বৃহৎ অক্ষের দৈর্ঘ্য", cells: ["2a", "2b"] },
  { label: "ক্ষুদ্র অক্ষের দৈর্ঘ্য", cells: ["2b", "2a"] },
  { label: "বৃহৎ অক্ষের সমীকরণ", cells: ["y = 0 (x-অক্ষ)", "x = 0 (y-অক্ষ)"] },
  { label: "ক্ষুদ্র অক্ষের সমীকরণ", cells: ["x = 0 (y-অক্ষ)", "y = 0 (x-অক্ষ)"] },
  { label: "শীর্ষদ্বয়ের স্থানাঙ্ক", cells: ["(±a, 0)", "(0, ±b)"] },
  {
    label: "ফোকাসদ্বয় (উপকেন্দ্র)",
    cells: ["(±ae, 0) বা (±√(a²−b²), 0)", "(0, ±be) বা (0, ±√(b²−a²))"],
  },
  { label: "ফোকাসদ্বয়ের দূরত্ব", cells: ["2ae = 2√(a²−b²)", "2be = 2√(b²−a²)"] },
  { label: "নিয়ামক রেখার পাদবিন্দু", cells: ["(±a/e, 0)", "(0, ±b/e)"] },
  { label: "নিয়ামক রেখাদ্বয়ের দূরত্ব", cells: ["2a/e", "2b/e"] },
  { label: "নিয়ামকের সমীকরণ", cells: ["x = ±a/e", "y = ±b/e"] },
  { label: "উপকেন্দ্রিক লম্বের দৈর্ঘ্য", cells: ["2b²/a", "2a²/b"] },
  { label: "উপকেন্দ্রিক লম্বের সমীকরণ", cells: ["x = ±ae", "y = ±be"] },
];

const rowsShifted: FormulaRow[] = [
  { label: "কেন্দ্রের স্থানাঙ্ক", cells: ["(α, β)", "(α, β)"] },
  { label: "উৎকেন্দ্রিকতা (e)", cells: ["√(1 − b²/a²)", "√(1 − a²/b²)"] },
  { label: "বৃহৎ অক্ষের দৈর্ঘ্য", cells: ["2a", "2b"] },
  { label: "ক্ষুদ্র অক্ষের দৈর্ঘ্য", cells: ["2b", "2a"] },
  { label: "বৃহৎ অক্ষের সমীকরণ", cells: ["y − β = 0", "x − α = 0"] },
  { label: "ক্ষুদ্র অক্ষের সমীকরণ", cells: ["x − α = 0", "y − β = 0"] },
  { label: "শীর্ষদ্বয়", cells: ["(±a + α, β)", "(α, ±b + β)"] },
  { label: "ফোকাসদ্বয়", cells: ["(±ae + α, β)", "(α, ±be + β)"] },
  { label: "ফোকাসদ্বয়ের দূরত্ব", cells: ["2ae", "2be"] },
  { label: "নিয়ামকের পাদবিন্দু", cells: ["(±a/e + α, β)", "(α, ±b/e + β)"] },
  { label: "নিয়ামক রেখাদ্বয়ের দূরত্ব", cells: ["2a/e", "2b/e"] },
  { label: "নিয়ামকের সমীকরণ", cells: ["x − α = ±a/e", "y − β = ±b/e"] },
  { label: "উপকেন্দ্রিক লম্বের দৈর্ঘ্য", cells: ["2b²/a", "2a²/b"] },
  { label: "উপকেন্দ্রিক লম্বের সমীকরণ", cells: ["x − α = ±ae", "y − β = ±be"] },
];

function Page() {
  return (
    <PageShell>
      <main className="page-main">
        <section className="neon-hero fade-in">
          <span className="neon-hero-badge">{trs("উপবৃত্ত · Ellipse")}</span>
          <h1>
            {trs("উপবৃত্তের")}{" "}
            <span className="neon-gradient-text">{trs("সম্পূর্ণ সূত্রাবলী")}</span>
          </h1>
          <p>
            {trs(
              "মূল ও সরিত উপবৃত্তের ১৪টি উপাদানের নিয়ন টেবিল — উভয় ওরিয়েন্টেশন (a>b এবং b>a) সহ।",
            )}
          </p>
        </section>

        <section className="neon-card fade-in">
          <h2>{trs("মূল উপবৃত্ত (কেন্দ্র মূলবিন্দুতে)")}</h2>
          <FormulaTable
            accent="cyan"
            headers={[
              <>
                x²/a² + y²/b² = 1<br />
                <small>{trs("a > b, বৃহৎ অক্ষ x বরাবর")}</small>
              </>,
              <>
                x²/a² + y²/b² = 1<br />
                <small>{trs("b > a, বৃহৎ অক্ষ y বরাবর")}</small>
              </>,
            ]}
            rows={rowsMain}
          />
        </section>

        <section className="neon-card fade-in">
          <h2>{trs("সরিত উপবৃত্ত (কেন্দ্র (α, β))")}</h2>
          <FormulaTable
            accent="purple"
            headers={[
              <>
                (x−α)²/a² + (y−β)²/b² = 1<br />
                <small>a &gt; b</small>
              </>,
              <>
                (x−α)²/a² + (y−β)²/b² = 1<br />
                <small>b &gt; a</small>
              </>,
            ]}
            rows={rowsShifted}
          />
        </section>
      </main>
    </PageShell>
  );
}
