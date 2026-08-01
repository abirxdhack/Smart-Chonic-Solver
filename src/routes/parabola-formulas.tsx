import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/conics/Shared";
import { FormulaTable, type FormulaRow } from "@/components/conics/FormulaTable";

export const Route = createFileRoute("/parabola-formulas")({
  head: () => ({
    meta: [
      { title: "পরাবৃত্তের সূত্রাবলী — Conic Studio" },
      { name: "description", content: "পরাবৃত্তের সকল উপাদানের সম্পূর্ণ সূত্র চার্ট: শীর্ষবিন্দু, উপকেন্দ্র, নিয়ামক, উপকেন্দ্রিক লম্ব ইত্যাদি সকল কেসের জন্য।" },
      { property: "og:title", content: "পরাবৃত্তের সূত্রাবলী চার্ট" },
      { property: "og:description", content: "৪ কেসের জন্য পরাবৃত্তের ৯টি উপাদানের নিয়ন সূত্র টেবিল।" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const mainRows: FormulaRow[] = [
  { label: "শীর্ষবিন্দু (A)", cells: ["(0, 0)", "(0, 0)", "(0, 0)", "(0, 0)"] },
  { label: "উপকেন্দ্রের স্থানাঙ্ক (S)", cells: ["(a, 0)", "(−a, 0)", "(0, a)", "(0, −a)"] },
  { label: "নিয়ামকের পাদবিন্দু (Z)", cells: ["(−a, 0)", "(a, 0)", "(0, −a)", "(0, a)"] },
  { label: "উপকেন্দ্রিক লম্বের দৈর্ঘ্য", cells: ["|4a|", "|4a|", "|4a|", "|4a|"] },
  { label: "উপকেন্দ্রিক লম্বের সমীকরণ", cells: ["x = a", "x = −a", "y = a", "y = −a"] },
  { label: "অক্ষের সমীকরণ", cells: ["y = 0", "y = 0", "x = 0", "x = 0"] },
  { label: "নিয়ামক রেখার সমীকরণ", cells: ["x = −a", "x = a", "y = −a", "y = a"] },
  { label: "শীর্ষবিন্দুতে স্পর্শকের সমীকরণ", cells: ["x = 0", "x = 0", "y = 0", "y = 0"] },
  { label: "উপকেন্দ্রিক লম্বের প্রান্তবিন্দুদ্বয়", cells: ["(a, ±2a)", "(−a, ±2a)", "(±2a, a)", "(±2a, −a)"] },
];

const capitalRows: FormulaRow[] = [
  { label: "শীর্ষবিন্দু", cells: ["X = 0, Y = 0", "X = 0, Y = 0"] },
  { label: "উপকেন্দ্রের স্থানাঙ্ক", cells: ["X = A, Y = 0", "X = 0, Y = A"] },
  { label: "নিয়ামকের পাদবিন্দু", cells: ["X = −A, Y = 0", "X = 0, Y = −A"] },
  { label: "উপকেন্দ্রিক লম্বের দৈর্ঘ্য", cells: ["|4A|", "|4A|"] },
  { label: "উপকেন্দ্রিক লম্বের সমীকরণ", cells: ["X = A", "Y = A"] },
  { label: "অক্ষের সমীকরণ", cells: ["Y = 0", "X = 0"] },
  { label: "নিয়ামক রেখার সমীকরণ", cells: ["X = −A", "Y = −A"] },
  { label: "শীর্ষবিন্দুতে স্পর্শকের সমীকরণ", cells: ["X = 0", "Y = 0"] },
  { label: "উপকেন্দ্রিক লম্বের প্রান্তবিন্দুদ্বয়", cells: ["(A, ±2A)", "(±2A, A)"] },
];

function Page() {
  return (
    <PageShell>
      <main className="page-main">
        <section className="neon-hero fade-in">
          <span className="neon-hero-badge">পরাবৃত্ত · Parabola</span>
          <h1>পরাবৃত্তের <span className="neon-gradient-text">সম্পূর্ণ সূত্রাবলী</span></h1>
          <p>মূল অবস্থান (a শূন্য) ও সরিত পরাবৃত্তের জন্য ৯টি প্রধান উপাদানের নিয়ন সূত্র টেবিল — চারটি কেস একসাথে।</p>
        </section>

        <section className="neon-card fade-in">
          <h2>মূল সমীকরণ (কেন্দ্র মূলবিন্দুতে)</h2>
          <FormulaTable
            accent="cyan"
            headers={[<>y² = 4ax<br/><small>(ডানহাতি, a&gt;0)</small></>, <>y² = −4ax<br/><small>(বামহাতি)</small></>, <>x² = 4ay<br/><small>(ঊর্ধ্বমুখী)</small></>, <>x² = −4ay<br/><small>(নিম্নমুখী)</small></>]}
            rows={mainRows}
          />
        </section>

        <section className="neon-card fade-in">
          <h2>ক্যাপিটাল রূপান্তর (X = x − α, Y = y − β)</h2>
          <FormulaTable
            accent="magenta"
            headers={[<>Y² = 4AX<br/><small>(A&gt;0 ডানহাতি; A&lt;0 বামহাতি)</small></>, <>X² = 4AY<br/><small>(A&gt;0 ঊর্ধ্বমুখী; A&lt;0 নিম্নমুখী)</small></>]}
            rows={capitalRows}
          />
          <p className="ftable-note">সরিত পরাবৃত্তের ক্ষেত্রে X, Y প্রতিস্থাপনের পর মূল x, y-এ ফিরিয়ে আনতে হবে: x = X + α, y = Y + β।</p>
        </section>
      </main>
    </PageShell>
  );
}
