import { trs } from "@/i18n";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, LinkIcon } from "lucide-react";
import { PageShell } from "@/components/conics/Shared";
import { loadShare, passthroughSearch } from "@/lib/conics/share";

export const Route = createFileRoute("/share")({
  validateSearch: passthroughSearch,
  head: () => ({
    meta: [
      { title: trs("শেয়ার করা সমাধান — Conic Studio") },
      {
        name: "description",
        content: trs("শেয়ার কোড থেকে হুবহু একই সমীকরণ, সমাধান ও লেখচিত্র খুলে দেখুন।"),
      },
      { property: "og:title", content: trs("শেয়ার করা সমাধান — Conic Studio") },
      {
        property: "og:description",
        content: trs("ছোট শেয়ার কোড দিয়ে সংরক্ষিত কণিক সমাধান ও গ্রাফ পুনরায় দেখুন।"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const id = search.id ?? "";

  useEffect(() => {
    let alive = true;
    if (!id) {
      setError(trs("শেয়ার কোড পাওয়া যায়নি।"));
      return;
    }
    loadShare(id).then((payload) => {
      if (!alive) return;
      if (!payload) {
        setError(trs("এই শেয়ার কোডটি ভুল অথবা মেয়াদোত্তীর্ণ।"));
        return;
      }
      navigate({ to: payload.path, search: payload.params, replace: true });
    });
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  return (
    <PageShell>
      <main className="page-main">
        <section className="card fade-in share-loader">
          {error ? (
            <>
              <LinkIcon size={22} />
              <h2>{error}</h2>
              <p>{trs("কোডটি আবার যাচাই করুন অথবা নতুন করে শেয়ার লিংক তৈরি করুন।")}</p>
            </>
          ) : (
            <>
              <Loader2 size={22} className="spin" />
              <h2>{trs("শেয়ার করা সমাধান খোলা হচ্ছে…")}</h2>
              <p>
                {trs("কোড:")} {id}
              </p>
            </>
          )}
        </section>
      </main>
    </PageShell>
  );
}
