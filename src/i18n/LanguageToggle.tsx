import { Languages } from "lucide-react";
import { useLanguage } from "./LanguageProvider";
import { trs, type Lang } from "./index";

const CHOICES: { id: Lang; short: string; label: string }[] = [
  { id: "bn", short: "BN", label: "বাংলা" },
  { id: "en", short: "EN", label: "ইংরেজি" },
];

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="lang-switch" role="group" aria-label={trs("ভাষা নির্বাচন")}>
      <Languages size={14} className="lang-switch-icon" aria-hidden="true" />
      {CHOICES.map((c) => (
        <button
          key={c.id}
          type="button"
          title={trs(c.label)}
          aria-label={trs(c.label)}
          aria-pressed={lang === c.id}
          className={lang === c.id ? "on" : ""}
          onClick={() => setLang(c.id)}
        >
          {c.short}
        </button>
      ))}
    </div>
  );
}
