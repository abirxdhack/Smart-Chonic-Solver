import { trs } from "@/i18n";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/conics/Shared";
import { ArrowRight, Waves, Circle, GitCompareArrows, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: trs("Conic Studio — পরাবৃত্ত, উপবৃত্ত ও অধিবৃত্ত সমাধান") },
      {
        name: "description",
        content: trs(
          "HSC বাংলা মাধ্যমের কনিক সেকশন — পরাবৃত্ত, উপবৃত্ত ও অধিবৃত্তের সম্পূর্ণ সমাধান, গ্রাফ ও ধাপে ধাপে ব্যাখ্যা।",
        ),
      },
      { property: "og:title", content: trs("Conic Studio — পরাবৃত্ত, উপবৃত্ত ও অধিবৃত্ত সমাধান") },
      {
        property: "og:description",
        content: trs(
          "HSC বাংলা মাধ্যমের কনিক সেকশন — পরাবৃত্ত, উপবৃত্ত ও অধিবৃত্তের সম্পূর্ণ সমাধান, গ্রাফ ও ধাপে ধাপে ব্যাখ্যা।",
        ),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const TOOLS = [
  {
    to: "/parabola",
    Icon: Waves,
    title: "পরাবৃত্ত",
    desc: "শীর্ষ, উপকেন্দ্র, নিয়ামক, উপকেন্দ্রিক লম্ব সহ সম্পূর্ণ সমাধান ও গ্রাফ।",
  },
  {
    to: "/ellipse",
    Icon: Circle,
    title: "উপবৃত্ত",
    desc: "কেন্দ্র, উৎকেন্দ্রিকতা, অক্ষ, ফোকাস, নিয়ামক ও লম্বসহ সব প্যারামিটার।",
  },
  {
    to: "/hyperbola",
    Icon: GitCompareArrows,
    title: "অধিবৃত্ত",
    desc: "আড় ও অনুবন্ধী অক্ষ, অসীমতটরেখা, নির্দেশক বৃত্ত সহ পূর্ণ সমাধান।",
  },
  {
    to: "/parabola-solver",
    Icon: Sparkles,
    title: "পরাবৃত্তের সমীকরণ নির্ণয়",
    desc: "উপকেন্দ্র, শীর্ষ বা নিয়ামক থেকে যেকোন দুটির তথ্য দিলেই সমীকরণ।",
  },
] as const;

function Home() {
  return (
    <PageShell>
      <main>
        <section className="hero">
          <h1>{trs("বাংলায় কনিক সেকশনের সম্পূর্ণ ইন্টারেক্টিভ সমাধান")}</h1>
          <p>
            {trs(
              "পরাবৃত্ত, উপবৃত্ত ও অধিবৃত্ত — যেকোন সমীকরণ বা প্যারামিটার থেকে সব ধর্ম, ফোকাস, নিয়ামক, উপকেন্দ্রিক লম্ব ও গ্রাফ; প্রতিটি ফলাফলের ধাপে ধাপে গাণিতিক ব্যাখ্যা।",
            )}
          </p>
          <div className="hero-actions">
            <Link to="/parabola" className="icon-btn primary">
              {trs("পরাবৃত্ত সমাধান")} <ArrowRight size={15} />
            </Link>
            <Link to="/ellipse" className="icon-btn">
              {trs("উপবৃত্ত")} <ArrowRight size={14} />
            </Link>
            <Link to="/hyperbola" className="icon-btn">
              {trs("অধিবৃত্ত")} <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        <div className="tool-grid">
          {TOOLS.map(({ to, Icon, title, desc }) => (
            <Link key={to} to={to} className="tool-card">
              <span className="tool-icon">
                <Icon size={22} />
              </span>
              <h3>{trs(title)}</h3>
              <p>{trs(desc)}</p>
              <span className="tool-cta">
                {trs("শুরু করুন")} <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
