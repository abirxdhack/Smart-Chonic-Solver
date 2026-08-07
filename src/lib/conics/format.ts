import { getActiveLang } from "@/i18n";

export const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export const localDigits = (input: string): string =>
  getActiveLang() === "en" ? input : input.replace(/[0-9]/g, (d) => BN_DIGITS[+d]);

export const toBn = (v: number | string): string => {
  if (typeof v === "number") {
    if (!isFinite(v)) return "∞";
    const s = Number.isInteger(v) ? v.toString() : v.toFixed(3).replace(/\.?0+$/, "");
    return localDigits(s.replace(/-/g, "−"));
  }
  return localDigits(v.replace(/-/g, "−"));
};

export const fmtPt = (p: [number, number]) => `(${toBn(p[0])}, ${toBn(p[1])})`;

export const fmtNum = (n: number, digits = 3) => {
  if (!isFinite(n)) return "∞";
  if (Number.isInteger(n)) return toBn(n);
  const s = n.toFixed(digits).replace(/\.?0+$/, "");
  return toBn(s);
};

export const signStr = (n: number) => (n >= 0 ? "−" : "+");
export const absBn = (n: number) => toBn(Math.abs(n));

export function fmtLinear(varName: string, offset: number) {
  if (offset === 0) return varName;
  return `${varName} ${offset > 0 ? "−" : "+"} ${absBn(offset)}`;
}
