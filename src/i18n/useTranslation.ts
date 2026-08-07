import { useLanguage } from "./LanguageProvider";

export function useTranslation() {
  const { t, tt, lang, setLang, toggleLang } = useLanguage();
  return { t, tt, lang, setLang, toggleLang };
}
