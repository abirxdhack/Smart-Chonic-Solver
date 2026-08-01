import type { ParseResult } from "@/lib/conics/parser";

const TYPE_LABEL: Record<string, string> = {
  parabola: "পরাবৃত্ত",
  ellipse: "উপবৃত্ত",
  hyperbola: "অধিবৃত্ত",
};

export function EqStatus({
  result,
  expected,
}: {
  result: ParseResult | null;
  expected: "parabola" | "ellipse" | "hyperbola";
}) {
  if (!result) return null;
  if (result.ok) {
    const typeOk = result.conic.type === expected;
    return (
      <div className={`eq-status ${typeOk ? "ok" : "warn"}`}>
        <div className="row">
          <span className="badge">ধরন</span>
          <strong>{TYPE_LABEL[result.conic.type]}</strong>
          {!typeOk && (
            <span className="mini-warn">
              এই পৃষ্ঠায় {TYPE_LABEL[expected]} আশা করা হচ্ছে
            </span>
          )}
        </div>
        <div className="row">
          <span className="badge">প্রামাণ্য রূপ</span>
          <code>{result.conic.standard}</code>
        </div>
        {result.autoCorrected && (
          <div className="row info">স্বয়ংক্রিয়ভাবে সংশোধিত: <code>{result.sanitized}</code></div>
        )}
      </div>
    );
  }
  return (
    <div className="eq-status err-block">
      <div className="row">
        <span className="badge err">ত্রুটি</span>
        <strong>{result.error.message}</strong>
      </div>
      {result.error.suggestion && (
        <div className="row">
          <span className="badge">পরামর্শ</span>
          <span>{result.error.suggestion}</span>
        </div>
      )}
    </div>
  );
}
