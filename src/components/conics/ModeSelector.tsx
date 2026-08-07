import {
  Check,
  ChevronDown,
  ChevronRight,
  Circle,
  CornerUpRight,
  Dot,
  GitBranch,
  Layers,
  Minus,
  Ruler,
  Search,
  Sigma,
  Target,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { trs } from "@/i18n";
import { useTranslation } from "@/i18n/useTranslation";
import type { ModeDef } from "@/lib/conics/parabola-modes";

const GROUP_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  মৌলিক: Sigma,
  শীর্ষভিত্তিক: Target,
  বিন্দুভিত্তিক: Dot,
  "উপকেন্দ্রিক লম্ব": Ruler,
  রেখাভিত্তিক: Minus,
  "বহুপদী রূপ": GitBranch,
  "স্পর্শক ও অভিলম্ব": CornerUpRight,
};

const groupIcon = (group: string) => GROUP_ICONS[group] ?? Layers;

type Props = {
  modes: ModeDef[];
  value: string;
  onChange: (id: string) => void;
};

export function ModeSelector({ modes, value, onChange }: Props) {
  const { t, lang } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [cursor, setCursor] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const current = modes.find((m) => m.id === value) ?? modes[0];

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (m: ModeDef) =>
      !q ||
      [m.label, m.hint, m.group, t(m.label), t(m.hint), t(m.group), m.id]
        .join(" ")
        .toLowerCase()
        .includes(q);
    const order: string[] = [];
    const map = new Map<string, ModeDef[]>();
    for (const m of modes) {
      if (!match(m)) continue;
      if (!map.has(m.group)) {
        map.set(m.group, []);
        order.push(m.group);
      }
      map.get(m.group)!.push(m);
    }
    return order.map((g) => ({ group: g, items: map.get(g)! }));
  }, [modes, query, t, lang]);

  const searching = query.trim().length > 0;
  const flat = useMemo(
    () => groups.flatMap(({ group, items }) => (!searching && collapsed[group] ? [] : items)),
    [groups, collapsed, searching],
  );

  useEffect(() => {
    if (!open) return;
    setCursor(
      Math.max(
        0,
        flat.findIndex((m) => m.id === value),
      ),
    );
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (cursor >= flat.length) setCursor(flat.length ? flat.length - 1 : 0);
  }, [flat.length, cursor]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-cursor="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor, open]);

  const commit = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!flat.length) return;
      setCursor((c) => (c + (e.key === "ArrowDown" ? 1 : flat.length - 1)) % flat.length);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setCursor(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setCursor(Math.max(0, flat.length - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const pick = flat[cursor];
      if (pick) commit(pick.id);
    }
  };

  const CurrentIcon = groupIcon(current.group);

  return (
    <div className="mode-select" ref={rootRef} onKeyDown={onKeyDown}>
      <button
        type="button"
        className={`mode-trigger${open ? " open" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={trs("সমস্যার ধরন")}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span className="mode-trigger-icon">
          <CurrentIcon size={16} />
        </span>
        <span className="mode-trigger-body">
          <span className="mode-trigger-group">{t(current.group)}</span>
          <span className="mode-trigger-label">{t(current.label)}</span>
        </span>
        <ChevronDown size={16} className="mode-trigger-chev" />
      </button>

      {open && (
        <div className="mode-panel" role="dialog" aria-label={trs("সমস্যার ধরন")}>
          <div className="mode-search">
            <Search size={15} aria-hidden="true" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              placeholder={trs("ধরন খুঁজুন…")}
              aria-label={trs("ধরন খুঁজুন…")}
              spellCheck={false}
              autoComplete="off"
            />
            {query && (
              <button
                type="button"
                className="mode-search-clear"
                aria-label={trs("মুছুন")}
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="mode-list" role="listbox" ref={listRef} tabIndex={-1}>
            {groups.length === 0 && <p className="mode-empty">{trs("কোনো ধরন মেলেনি")}</p>}
            {groups.map(({ group, items }) => {
              const GIcon = groupIcon(group);
              const isCollapsed = !searching && !!collapsed[group];
              return (
                <section className="mode-group" key={group}>
                  <button
                    type="button"
                    className="mode-group-head"
                    aria-expanded={!isCollapsed}
                    onClick={() => setCollapsed((c) => ({ ...c, [group]: !c[group] }))}
                  >
                    <span className="mode-group-icon">
                      <GIcon size={13} />
                    </span>
                    <span className="mode-group-title">{t(group)}</span>
                    <span className="mode-group-count">{items.length}</span>
                    <ChevronRight
                      size={14}
                      className={`mode-group-chev${isCollapsed ? "" : " down"}`}
                    />
                  </button>
                  {!isCollapsed && (
                    <ul className="mode-items">
                      {items.map((m) => {
                        const active = m.id === value;
                        const onCursor = flat[cursor]?.id === m.id;
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              role="option"
                              aria-selected={active}
                              data-cursor={onCursor || undefined}
                              className={`mode-item${active ? " active" : ""}${onCursor ? " cursor" : ""}`}
                              onMouseEnter={() => setCursor(flat.findIndex((f) => f.id === m.id))}
                              onClick={() => commit(m.id)}
                            >
                              <span className="mode-item-mark">
                                {active ? <Check size={13} strokeWidth={3} /> : <Circle size={7} />}
                              </span>
                              <span className="mode-item-body">
                                <span className="mode-item-label">{t(m.label)}</span>
                                <span className="mode-item-hint">{t(m.hint)}</span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>

          <div className="mode-foot">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> {trs("চলাচল")}
            </span>
            <span>
              <kbd>Enter</kbd> {trs("নির্বাচন")}
            </span>
            <span>
              <kbd>Esc</kbd> {trs("বন্ধ")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
