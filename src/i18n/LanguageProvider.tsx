import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  setActiveLang,
  translateKey,
  templateKey,
  fillTemplate,
  type Lang,
} from "./index";

export type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
  tt: (strings: TemplateStringsArray, ...values: unknown[]) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);
  setActiveLang(lang);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(LANG_STORAGE_KEY);
    } catch {
      stored = null;
    }
    if (stored === "en" || stored === "bn") setLangState(stored);
  }, []);

  useEffect(() => {
    setActiveLang(lang);
    const el = document.documentElement;
    el.setAttribute("lang", lang);
    el.setAttribute("data-lang", lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setActiveLang(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      void 0;
    }
    setLangState(next);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang(lang === "bn" ? "en" : "bn"),
      t: (key: string) => translateKey(key, lang),
      tt: (strings: TemplateStringsArray, ...values: unknown[]) =>
        fillTemplate(translateKey(templateKey(strings), lang), values),
    }),
    [lang, setLang],
  );

  
  return (
    <LanguageContext.Provider value={value}>
      <Fragment key={lang}>{children}</Fragment>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
