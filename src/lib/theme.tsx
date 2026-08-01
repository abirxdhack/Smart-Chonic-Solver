import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Monitor, Moon, Sun } from "lucide-react";

export type ThemeMode = "light" | "dark" | "system";

export const THEME_KEY = "conic-studio-theme";

export const themeBootScript = `(function(){try{var m=localStorage.getItem('${"conic-studio-theme"}')||'system';var d=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var e=document.documentElement;e.classList.toggle('dark',d);e.classList.toggle('light',!d);e.style.colorScheme=d?'dark':'light';}catch(_){}})();`;

type ThemeCtx = {
  mode: ThemeMode;
  resolved: "light" | "dark";
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeCtx>({
  mode: "system",
  resolved: "dark",
  setMode: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function prefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("system");
  const [resolved, setResolved] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setModeState(stored);
    }
  }, []);

  useEffect(() => {
    const apply = () => {
      const dark = mode === "dark" || (mode === "system" && prefersDark());
      const el = document.documentElement;
      el.classList.toggle("dark", dark);
      el.classList.toggle("light", !dark);
      el.style.colorScheme = dark ? "dark" : "light";
      setResolved(dark ? "dark" : "light");
    };
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [mode]);

  const setMode = useCallback((m: ThemeMode) => {
    try {
      localStorage.setItem(THEME_KEY, m);
    } catch {
      void 0;
    }
    setModeState(m);
  }, []);

  return (
    <ThemeContext.Provider value={{ mode, resolved, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

const OPTIONS: { id: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { id: "light", label: "লাইট মোড", Icon: Sun },
  { id: "dark", label: "ডার্ক মোড", Icon: Moon },
  { id: "system", label: "সিস্টেম মোড", Icon: Monitor },
];

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const index = OPTIONS.findIndex((o) => o.id === mode);
  return (
    <div className="theme-switch" role="group" aria-label="থিম নির্বাচন">
      <span
        className="theme-thumb"
        style={{ transform: `translateX(${Math.max(index, 0) * 100}%)` }}
        aria-hidden="true"
      />
      {OPTIONS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={mode === id}
          className={mode === id ? "on" : ""}
          onClick={() => setMode(id)}
        >
          <Icon size={15} />
        </button>
      ))}
    </div>
  );
}
