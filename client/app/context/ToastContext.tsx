"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "⚠",
  info: "ℹ",
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; bar: string }> = {
  success: {
    bg: "var(--success-dim)",
    border: "rgba(5,150,105,.25)",
    icon: "var(--success)",
    bar: "var(--success)",
  },
  error: {
    bg: "var(--error-dim)",
    border: "rgba(220,38,38,.25)",
    icon: "var(--error)",
    bar: "var(--error)",
  },
  info: {
    bg: "var(--accent-dim)",
    border: "rgba(124,58,237,.2)",
    icon: "var(--accent)",
    bar: "var(--accent)",
  },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const c = COLORS[toast.type];

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 16px",
        background: "var(--bg-card)",
        border: `1px solid ${c.border}`,
        borderRadius: "var(--radius-md)",
        boxShadow: "var(--shadow-lg)",
        minWidth: 300,
        maxWidth: 400,
        overflow: "hidden",
        animation: "toastIn 0.25s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Coloured left bar */}
      <div style={{
        position: "absolute",
        left: 0, top: 0, bottom: 0,
        width: 4,
        background: c.bar,
        borderRadius: "var(--radius-md) 0 0 var(--radius-md)",
      }} />

      {/* Icon */}
      <div style={{
        width: 28, height: 28,
        borderRadius: "50%",
        background: c.bg,
        border: `1px solid ${c.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 700,
        color: c.icon,
        flexShrink: 0,
        marginLeft: 6,
      }}>
        {ICONS[toast.type]}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: toast.message ? 3 : 0 }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>
            {toast.message}
          </div>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none", border: "none",
          color: "var(--text-muted)",
          cursor: "pointer", fontSize: 16,
          padding: "0 2px",
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ×
      </button>

      {/* Progress bar */}
      <div style={{
        position: "absolute",
        bottom: 0, left: 0, right: 0,
        height: 2,
        background: c.bg,
      }}>
        <div style={{
          height: "100%",
          background: c.bar,
          animation: "toastProgress 3.5s linear forwards",
        }} />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2) + Date.now();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => remove(id), 3500);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(110%); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      {children}

      {/* Portal-like fixed container */}
      <div style={{
        position: "fixed",
        bottom: 24, right: 24,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
      }}>
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
