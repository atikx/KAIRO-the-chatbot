"use client";

import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTheme } from "../context/ThemeContext";

function NavLink({
  href,
  icon,
  label,
  active,
  onClick,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`sidebar-link ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="link-icon">{icon}</span>
      {label}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle theme">
      <span className="theme-toggle-text">
        <span>{isDark ? "🌙" : "☀️"}</span>
        {isDark ? "Dark mode" : "Light mode"}
      </span>

      <div className={`theme-toggle-track ${isDark ? "on" : ""}`}>
        <div className={`theme-toggle-knob ${isDark ? "on" : ""}`} />
      </div>
    </button>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const key = searchParams.get("key") ?? "";

  useEffect(() => {
    if (!key) router.replace("/admin");
  }, [key, router]);

  const qs = key ? `?key=${encodeURIComponent(key)}` : "";

  const isActive = (sub: string) => pathname === `/admin/${sub}`;

  if (!key) return null;

  return (
    <>
      {/* Mobile Hamburger */}
      <button
        className="w"
        onClick={() => setSidebarOpen(true)}
      >
        ☰
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="layout">
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>

          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">⚡</div>

            <div>
              <div className="sidebar-logo-text">Kairo</div>
              <div className="sidebar-logo-badge">Admin</div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Overview</div>

            <NavLink
              href={`/admin/dashboard${qs}`}
              icon="◈"
              label="Dashboard"
              active={isActive("dashboard")}
              onClick={() => setSidebarOpen(false)}
            />

            <div className="sidebar-section-label">Knowledge Base</div>

            <NavLink
              href={`/admin/ingest${qs}`}
              icon="⊕"
              label="Ingest Data"
              active={isActive("ingest")}
              onClick={() => setSidebarOpen(false)}
            />

            <NavLink
              href={`/admin/sources${qs}`}
              icon="◉"
              label="Sources"
              active={isActive("sources")}
              onClick={() => setSidebarOpen(false)}
            />

            <div className="sidebar-section-label">Testing</div>

            <NavLink
              href={`/admin/chat${qs}`}
              icon="◎"
              label="Test Chat"
              active={isActive("chat")}
              onClick={() => setSidebarOpen(false)}
            />
          </nav>

          <div className="sidebar-bottom">
            <div className="sidebar-status">
              <div className="status-dot" />
              <span>Server · port 4242</span>
            </div>

            <ThemeToggle />
          </div>
        </aside>

        <main className="main-content">{children}</main>
      </div>
    </>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            background: "var(--bg-primary)",
          }}
        />
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}