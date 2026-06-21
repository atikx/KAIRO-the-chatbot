"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAdminKey } from "../hooks/useAdminKey";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminData, getErrorMessage, AdminDataItem } from "../../lib/api";

export const dynamic = "force-static";

function getDomain(url: string) {
  try { return new URL(url).hostname; } catch { return url; }
}
function getFavicon(url: string): string {
  const domain = getDomain(url);
  const map: Record<string, string> = { "nextjs.org": "▲", "go.dev": "🐹", "openai.com": "🤖", "github.com": "🐙", "sqlite.org": "🗄️" };
  for (const [k, v] of Object.entries(map)) if (domain.includes(k)) return v;
  return "🌐";
}

function DashboardContent() {
  const adminKey = useAdminKey();
  const qs = `?key=${encodeURIComponent(adminKey)}`;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-data", adminKey],
    queryFn: () => fetchAdminData(adminKey),
    enabled: !!adminKey,
  });

  const sources: AdminDataItem[] = data?.data ?? [];
  const totalChunks = sources.reduce((a, s) => a + s.chunks_count, 0);
  const errorMessage = isError ? getErrorMessage(error) : null;

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Manage your RAG knowledge base and test the AI chat system.</p>
      </div>

      <div className="page-body">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon card-icon purple">◉</div>
            <div className="stat-info">
              <div className="stat-value">{isLoading ? "—" : sources.length}</div>
              <div className="stat-label">Indexed Sources</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon card-icon green">⊞</div>
            <div className="stat-info">
              <div className="stat-value">{isLoading ? "—" : totalChunks.toLocaleString()}</div>
              <div className="stat-label">Total Chunks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon card-icon amber">⬡</div>
            <div className="stat-info">
              <div className="stat-value">4242</div>
              <div className="stat-label">Server Port</div>
            </div>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 24 }}>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><div className="card-icon purple">⊕</div>Ingest Website</div>
              <span className="badge badge-purple">URL Chunking</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 20, lineHeight: 1.7 }}>
              Submit a website URL. Kairo will scrape, chunk, embed the content, and store it in your vector database.
            </p>
            <Link href={`/admin/ingest${qs}`} className="btn btn-primary"><span>⊕</span> Ingest a URL</Link>
          </div>
          <div className="card">
            <div className="card-header">
              <div className="card-title"><div className="card-icon green">◎</div>Test Chat</div>
              <span className="badge badge-green">RAG Chat</span>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 20, lineHeight: 1.7 }}>
              Send queries to your RAG chat system and see how it retrieves context from the knowledge base.
            </p>
            <Link href={`/admin/chat${qs}`} className="btn btn-success"><span>◎</span> Open Chat Tester</Link>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon amber">◉</div>Recent Sources
              {isLoading && <span className="spinner" style={{ borderColor: "var(--accent-dim)", borderTopColor: "var(--accent)", width: 13, height: 13 }} />}
            </div>
            <Link href={`/admin/sources${qs}`} className="btn btn-secondary btn-sm">View all →</Link>
          </div>
          {isError && errorMessage && (
            <div className="alert alert-error"><span className="alert-icon">⚠</span><div><div style={{ fontWeight: 700, marginBottom: 2 }}>Failed to load sources</div><div style={{ fontSize: 13 }}>{errorMessage}</div></div></div>
          )}
          {!isLoading && !isError && sources.length === 0 && (
            <div style={{ textAlign: "center", padding: "28px 16px", color: "var(--text-muted)", fontSize: 13.5 }}>
              No sources indexed yet.{" "}
              <Link href={`/admin/ingest${qs}`} style={{ color: "var(--accent)", textDecoration: "underline" }}>Ingest your first URL →</Link>
            </div>
          )}
          {sources.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sources.slice(0, 4).map((source) => (
                <div key={source.source} className="source-item">
                  <div className="source-favicon">{getFavicon(source.source)}</div>
                  <div className="source-info">
                    <div className="source-url" title={source.source}>{source.source}</div>
                    <div className="source-meta">
                      <span>{getDomain(source.source)}</span>
                      <span style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--text-muted)", display: "inline-block" }} />
                      <span>{source.chunks_count} chunks</span>
                    </div>
                  </div>
                  <span className="badge badge-green">✓ indexed</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><div className="card-icon amber">⊞</div>Server API Reference</div></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { method: "POST", path: "/admin/embeddings/url", desc: "Chunk & embed a URL — requires x-admin-key header", body: '{ "url": "https://…" }', color: "#7c3aed", bg: "rgba(124,58,237,0.1)", protected: true },
              { method: "GET",  path: "/admin/data", desc: "List all sources + chunk counts — requires x-admin-key header", body: null, color: "#7c3aed", bg: "rgba(124,58,237,0.1)", protected: true },
              { method: "POST", path: "/resolveQuery", desc: "Resolve a chat query using RAG + LLM (public)", body: '{ "que": "…" }  ?chat_id=<id>', color: "#059669", bg: "rgba(5,150,105,0.1)", protected: false },
              { method: "GET",  path: "/health", desc: "Health check", body: null, color: "#d97706", bg: "rgba(217,119,6,0.1)", protected: false },
            ].map((ep) => (
              <div key={ep.path} style={{ display: "flex", gap: 12, padding: "12px 14px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", alignItems: "flex-start" }}>
                <div className="method-badge" style={{ background: ep.bg, color: ep.color, border: `1px solid ${ep.color}44` }}>{ep.method}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>{ep.path}</span>
                    {ep.protected && <span className="badge badge-purple" style={{ fontSize: 10 }}>🔒 protected</span>}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>{ep.desc}</div>
                  {ep.body && (<div style={{ marginTop: 5, padding: "3px 8px", background: "var(--bg-card)", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: "var(--text-muted)", border: "1px solid var(--border)" }}>{ep.body}</div>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "11px 14px", background: "var(--accent-dim)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(124,58,237,.2)" }}>
            <div style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 600, marginBottom: 3 }}>🔒 Admin Authentication</div>
            <div style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Protected routes require the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: "var(--bg-card)", padding: "1px 5px", borderRadius: 3 }}>x-admin-key</code>{" "}
              header. The admin panel sends this automatically from the <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: "var(--bg-card)", padding: "1px 5px", borderRadius: 3 }}>?key=</code> query parameter.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text-muted)" }}>Loading…</div>}>
      <DashboardContent />
    </Suspense>
  );
}
