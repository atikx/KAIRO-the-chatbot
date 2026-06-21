"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminRoot() {
  const [key, setKey] = useState("");
  const router = useRouter();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) return;
    router.push(`/admin/dashboard?key=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-primary)",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 6,
            }}
          >
            Kairo Admin
          </div>
          <div style={{ fontSize: 13.5, color: "var(--text-muted)" }}>
            Enter your admin key to continue
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          <input
            id="admin-key-input"
            type="password"
            className="form-input"
            placeholder="Admin secret key…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            autoFocus
            required
          />
          <button
            id="admin-login-btn"
            type="submit"
            className="btn btn-primary"
            style={{ justifyContent: "center" }}
            disabled={!key.trim()}
          >
            <span>→</span> Enter Dashboard
          </button>
        </form>

        <div
          style={{
            marginTop: 20,
            textAlign: "center",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          URL format:{" "}
          <code
            style={{
              background: "var(--accent-dim)",
              color: "var(--accent)",
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            /admin/dashboard?key=…
          </code>
        </div>
      </div>
    </div>
  );
}
