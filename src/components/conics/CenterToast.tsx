import { Check } from "lucide-react";
import { useEffect, useState } from "react";

export type CenterToastState = { id: number; message: string } | null;

export function CenterToast({ toast }: { toast: CenterToastState }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!toast) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="center-toast-wrap" aria-live="polite" aria-atomic="true">
      <div className={`center-toast${visible ? " in" : " out"}`} role="status">
        <span className="center-toast-icon">
          <Check size={14} strokeWidth={3} />
        </span>
        <span className="center-toast-text">{toast.message}</span>
      </div>
    </div>
  );
}
