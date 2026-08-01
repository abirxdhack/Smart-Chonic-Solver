import { Link, useRouterState } from "@tanstack/react-router";
import {
  Sigma,
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Github,
  Send,
  MessageCircle,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import profileImg from "@/assets/abir-profile-v2.png";
import { ThemeToggle } from "@/lib/theme";

const NAV = [
  { to: "/", label: "হোম" },
  { to: "/parabola", label: "পরাবৃত্ত" },
  { to: "/ellipse", label: "উপবৃত্ত" },
  { to: "/hyperbola", label: "অধিবৃত্ত" },
  { to: "/parabola-formulas", label: "পরাবৃত্ত সূত্র" },
  { to: "/ellipse-formulas", label: "উপবৃত্ত সূত্র" },
  { to: "/hyperbola-formulas", label: "অধিবৃত্ত সূত্র" },
  { to: "/solver", label: "সাধারণ সমাধান" },
  { to: "/parabola-solver", label: "উন্নত সমাধান" },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="Conic Studio">
        <span className="brand-mark">
          <Sigma size={18} />
        </span>
        <span>Conic Studio</span>
      </Link>
      <nav aria-label="প্রধান নেভিগেশন" className={open ? "open" : ""}>
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className={path === n.to ? "active" : ""}
            activeOptions={{ exact: true }}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="topbar-right">
        <ThemeToggle />
        <button
          className="nav-toggle"
          aria-label="মেনু"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
    </header>
  );
}

const SOCIALS = [
  { Icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/in/abirxdhack" },
  { Icon: Instagram, label: "Instagram", href: "https://instagram.com/abirxdhackz" },
  { Icon: Facebook, label: "Facebook", href: "https://facebook.com/abirxdhackz" },
  { Icon: Twitter, label: "X (Twitter)", href: "https://x.com/abirxdhackz" },
  { Icon: Youtube, label: "YouTube", href: "https://youtube.com/@abirxdhackz" },
  { Icon: Github, label: "GitHub", href: "https://github.com/abirxdhack" },
  { Icon: Send, label: "Telegram", href: "https://t.me/abirxdhackz" },
  { Icon: MessageCircle, label: "WhatsApp", href: "https://wa.me/8801963818285" },
  { Icon: Mail, label: "Email", href: "mailto:abirxdhackz.info.me@gmail.com" },
];

export function Footer() {
  return (
    <footer className="site-footer" id="developer">
      <div className="footer-inner">
        <div className="dev">
          <div className="dev-avatar">
            <img src={profileImg} alt="Abir Arafat Chawdhury" />
          </div>
          <div className="dev-info">
            <h3>Abir Arafat Chawdhury</h3>
            <p>HSC 2027 · Govt. Yeasin College, Faridpur</p>
            <ul className="dev-meta">
              <li>
                <Mail size={13} />
                <a href="mailto:abirxdhackz.info.me@gmail.com">
                  abirxdhackz.info.me@gmail.com
                </a>
              </li>
              <li>
                <Phone size={13} />
                <a href="tel:+8801963818285">+880 1963 818285</a>
              </li>
              <li>
                <MapPin size={13} />
                <span>Khalilpur Bazar, Faridpur Sadar, Bangladesh</span>
              </li>
              <li>
                <Calendar size={13} />
                <span>Born 17 April 2009</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="socials">
          {SOCIALS.map(({ Icon, label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              title={label}
              className="social-btn"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>
      <p className="copyright">
        © {new Date().getFullYear()} Abir Arafat Chawdhury. All Rights Reserved.
      </p>
    </footer>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="bn-app">
      <div className="ambient" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>
      <Nav />
      {children}
      <Footer />
    </div>
  );
}

export function CollapsibleRow({
  color,
  label,
  value,
  steps,
  index = 0,
}: {
  color: string;
  label: string;
  value: ReactNode;
  steps?: (string | ReactNode)[];
  index?: number;
}) {
  const [open, setOpen] = useState(false);
  const hasSteps = steps && steps.length > 0;
  return (
    <li style={{ borderLeftColor: color, animationDelay: `${index * 40}ms` }}>
      <button
        type="button"
        className="res-head"
        aria-expanded={open}
        onClick={() => hasSteps && setOpen((v) => !v)}
        data-clickable={hasSteps ? "1" : "0"}
      >
        <span className="res-dot" style={{ background: color }} />
        <span className="res-label" style={{ color }}>
          {label}
        </span>
        <span className="res-val">{value}</span>
        {hasSteps && (
          <ChevronDown
            size={14}
            className="res-caret"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          />
        )}
      </button>
      {open && hasSteps && (
        <div className="res-steps">
          {steps!.map((s, i) => (
            <div className="res-step" key={i}>
              {typeof s === "string" ? s : s}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export const CONIC_COLORS = {
  curve: "#6366f1",
  center: "#ef4444",
  vertex: "#ef4444",
  focus: "#f59e0b",
  dirFoot: "#10b981",
  latusEnd: "#ec4899",
  axis: "#0ea5e9",
  directrix: "#22c55e",
  latus: "#d946ef",
  tangent: "#f97316",
  asymptote: "#a78bfa",
  aux: "#14b8a6",
  minor: "#f472b6",
  grid: "#dbe4f0",
  axisLine: "#334155",
  paperBg: "#fbfdff",
  paperBorder: "#cfd8e3",
  origin: "#0f172a",
};

export function niceStep(raw: number) {
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  let f;
  if (n < 1.5) f = 1;
  else if (n < 3) f = 2;
  else if (n < 7) f = 5;
  else f = 10;
  return f * pow;
}

export function MathKeyboard({
  onInsert,
  onClose,
  onBackspace,
  onClear,
}: {
  onInsert: (s: string) => void;
  onClose: () => void;
  onBackspace: () => void;
  onClear: () => void;
}) {
  const keys: { l: string; v: string; kind?: string }[] = [
    { l: "x", v: "x" },
    { l: "y", v: "y" },
    { l: "a", v: "a" },
    { l: "b", v: "b" },
    { l: "c", v: "c" },
    { l: "^", v: "^" },
    { l: "( )", v: "()", kind: "wrap" },
    { l: "²", v: "^2" },
    { l: "=", v: "=" },
    { l: "+", v: "+" },
    { l: "−", v: "-" },
    { l: "×", v: "*" },
    { l: "৭", v: "7" },
    { l: "৮", v: "8" },
    { l: "৯", v: "9" },
    { l: "৪", v: "4" },
    { l: "৫", v: "5" },
    { l: "৬", v: "6" },
    { l: "১", v: "1" },
    { l: "২", v: "2" },
    { l: "৩", v: "3" },
    { l: "০", v: "0" },
    { l: ".", v: "." },
    { l: "/", v: "/", kind: "frac" },
  ];
  return (
    <div className="mkb">
      <div className="mkb-head">
        <span>গণিত কীবোর্ড</span>
        <div className="mkb-actions">
          <button onClick={onClear}>মুছুন</button>
          <button onClick={onBackspace}>⌫</button>
          <button onClick={onClose}>বন্ধ</button>
        </div>
      </div>
      <div className="mkb-grid">
        {keys.map((k, i) => (
          <button
            key={i}
            className={`mkb-key ${k.kind || ""}`}
            onMouseDown={(e) => {
              e.preventDefault();
              onInsert(k.v);
            }}
          >
            {k.l}
          </button>
        ))}
      </div>
    </div>
  );
}
