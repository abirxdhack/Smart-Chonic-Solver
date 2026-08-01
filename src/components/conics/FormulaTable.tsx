import { type ReactNode } from "react";

export type FormulaRow = {
  label: string;
  cells: ReactNode[];
};

export function FormulaTable({
  headers,
  rows,
  accent = "cyan",
}: {
  headers: ReactNode[];
  rows: FormulaRow[];
  accent?: "cyan" | "magenta" | "purple";
}) {
  return (
    <div className={`ftable-wrap accent-${accent}`}>
      <div className="ftable-scroll">
        <table className="ftable">
          <thead>
            <tr>
              <th className="col-idx">ক্রম</th>
              <th className="col-name">উপাদানের নাম</th>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ animationDelay: `${i * 45}ms` }}>
                <td className="col-idx">{toBnNum(i + 1)}</td>
                <td className="col-name">{r.label}</td>
                {r.cells.map((c, j) => (
                  <td key={j}>
                    <span className="cell-math">{c}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="fcards">
        {rows.map((r, i) => (
          <article className="fcard" key={i} style={{ animationDelay: `${i * 45}ms` }}>
            <header>
              <span className="fcard-idx">{toBnNum(i + 1)}</span>
              <h4>{r.label}</h4>
            </header>
            <dl>
              {r.cells.map((c, j) => (
                <div className="fcard-row" key={j}>
                  <dt>{headers[j]}</dt>
                  <dd>
                    <span className="cell-math">{c}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </div>
  );
}

function toBnNum(n: number) {
  const d = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(n).replace(/[0-9]/g, (c) => d[+c]);
}
