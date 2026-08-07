import { bnDictionary } from "./bn";
import { enDictionary } from "./en";

export type Lang = "bn" | "en";

export const LANG_STORAGE_KEY = "conic-studio-lang";
export const DEFAULT_LANG: Lang = "bn";

const dictionaries: Record<Lang, Record<string, string>> = {
  bn: bnDictionary,
  en: enDictionary,
};

let activeLang: Lang = DEFAULT_LANG;

export function setActiveLang(lang: Lang) {
  activeLang = lang;
}

export function getActiveLang(): Lang {
  return activeLang;
}

export function translateKey(key: string, lang: Lang = activeLang): string {
  const entry = dictionaries[lang][key];
  return entry === undefined ? key : entry;
}

export function trs(key: string, lang: Lang = activeLang): string {
  return translateKey(key, lang);
}

export function templateKey(raw: readonly (string | undefined)[]): string {
  return raw
    .map((part, i) => (i === 0 ? (part ?? "") : `\u27ea${i - 1}\u27eb${part ?? ""}`))
    .join("");
}

export function fillTemplate(template: string, values: unknown[]): string {
  return template.replace(/\u27ea(\d+)\u27eb/g, (_m, i: string) => {
    const value = values[Number(i)];
    return value === undefined || value === null ? "" : String(value);
  });
}

export function trt(strings: TemplateStringsArray, ...values: unknown[]): string {
  const key = templateKey(strings);
  return fillTemplate(translateKey(key), values);
}

export const langBoot = `(function(){try{var l=localStorage.getItem('${LANG_STORAGE_KEY}')||'${DEFAULT_LANG}';document.documentElement.setAttribute('lang',l==='en'?'en':'bn');document.documentElement.setAttribute('data-lang',l);}catch(_){}})();`;
