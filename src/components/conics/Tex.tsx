import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

export function Tex({
  math,
  block = false,
  className,
}: {
  math: string;
  block?: boolean;
  className?: string;
}) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode: block,
        throwOnError: false,
        strict: false,
        trust: false,
      });
    } catch {
      return math;
    }
  }, [math, block]);
  return (
    <span
      className={className ? `tex ${className}` : "tex"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
