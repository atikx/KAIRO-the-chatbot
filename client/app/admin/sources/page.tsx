"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAdminData,
  deleteSource,
  getErrorMessage,
  AdminDataItem,
} from "../../lib/api";
import { useToast } from "../../context/ToastContext";
import { useAdminKey } from "../hooks/useAdminKey";

function getDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function getFavicon(url: string): string {
  const fileExts = [".pdf", ".docx", ".doc", ".txt", ".md", ".pptx", ".xlsx"];
  if (fileExts.some((ext) => url.toLowerCase().endsWith(ext))) return "📄";

  const domain = getDomain(url);
  const map: Record<string, string> = {
    "nextjs.org": "▲",
    "go.dev": "🐹",
    "openai.com": "🤖",
    "github.com": "🐙",
    "sqlite.org": "🗄️",
    "vercel.com": "▲",
    "docs.anthropic.com": "🧠",
  };
  for (const [k, v] of Object.entries(map)) if (domain.includes(k)) return v;
  return "🌐";
}

export const dynamic = "force-static";

/* ─── Confirmation modal ─── */
function ConfirmModal({
  source,
  chunkCount,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  source: string;
  chunkCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          zIndex: 100,
          animation: "fadeInUp 0.15s ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 101,
          width: "100%",
          maxWidth: 480,
          padding: "0 16px",
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            boxShadow: "var(--shadow-lg)",
            padding: "28px 28px 24px",
            animation: "fadeInUp 0.18s ease",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "var(--radius-md)",
              background: "var(--error-dim)",
              border: "1px solid rgba(220,38,38,.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              marginBottom: 18,
            }}
          >
            🗑️
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: 8,
            }}
          >
            Delete source?
          </div>
          <div
            style={{
              fontSize: 13.5,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 20,
            }}
          >
            This will permanently remove{" "}
            <strong style={{ color: "var(--error)" }}>
              {chunkCount} chunk{chunkCount !== 1 ? "s" : ""}
            </strong>{" "}
            from the knowledge base. This action cannot be undone.
          </div>
          <div
            style={{
              padding: "9px 12px",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11.5,
              color: "var(--text-muted)",
              wordBreak: "break-all",
              marginBottom: 24,
            }}
          >
            {source}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              className="btn"
              style={{
                background: "var(--error)",
                color: "white",
                borderColor: "var(--error)",
                boxShadow: "0 2px 8px var(--error-dim)",
              }}
              onClick={onConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <span className="spinner" />
                  Deleting…
                </>
              ) : (
                <>
                  <span>🗑️</span>Delete Source
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Skeleton loader ─── */
function SourceSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: 62,
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border)",
            opacity: 1 - i * 0.15,
            animation: "skeletonPulse 1.5s ease infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function SourcesContent() {
  const adminKey = useAdminKey();
  const qs = `?key=${encodeURIComponent(adminKey)}`;
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<AdminDataItem | null>(
    null,
  );
  const { toast } = useToast();

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-data", adminKey],
    queryFn: () => fetchAdminData(adminKey),
    enabled: !!adminKey,
    refetchInterval: 30_000,
  });

  const sources: AdminDataItem[] = data?.data ?? [];
  const totalChunks = sources.reduce((a, s) => a + s.chunks_count, 0);
  const errorMessage = isError ? getErrorMessage(error) : null;

  const { mutate: doDelete, isPending: isDeleting } = useMutation({
    mutationFn: (source: string) => deleteSource(source, adminKey),
    onSuccess: (_, deletedSource) => {
      setPendingDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-data", adminKey] });
      toast(
        "success",
        "Source deleted",
        getDomain(deletedSource) + " removed from the knowledge base.",
      );
    },
    onError: (err) => {
      setPendingDelete(null);
      toast("error", "Delete failed", getErrorMessage(err));
    },
  });

  return (
    <>
      <style>{`
        @keyframes skeletonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
      `}</style>

      {pendingDelete && (
        <ConfirmModal
          source={pendingDelete.source}
          chunkCount={pendingDelete.chunks_count}
          onConfirm={() => doDelete(pendingDelete.source)}
          onCancel={() => setPendingDelete(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="page-header">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1 className="page-title">Sources</h1>
            <p className="page-subtitle">
              All content indexed in your RAG knowledge base.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
            <button
              className="btn btn-secondary"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <>
                  <span
                    className="spinner"
                    style={{
                      borderColor: "var(--border-hover)",
                      borderTopColor: "var(--text-secondary)",
                    }}
                  />
                  Refreshing…
                </>
              ) : (
                <>
                  <span>↺</span>Refresh
                </>
              )}
            </button>
            <Link href={`/admin/ingest${qs}`} className="btn btn-primary">
              <span>⊕</span>Add Source
            </Link>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div
          className="stats-grid"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 24 }}
        >
          <div className="stat-card">
            <div className="stat-icon card-icon purple">◉</div>
            <div>
              <div className="stat-value">
                {isLoading ? "—" : sources.length}
              </div>
              <div className="stat-label">Total Sources</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon card-icon green">⊞</div>
            <div>
              <div className="stat-value">
                {isLoading ? "—" : totalChunks.toLocaleString()}
              </div>
              <div className="stat-label">Total Chunks</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon card-icon amber">✓</div>
            <div>
              <div className="stat-value">
                {isLoading ? "—" : sources.length}
              </div>
              <div className="stat-label">Indexed</div>
            </div>
          </div>
        </div>

        {isError && errorMessage && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <span className="alert-icon">⚠</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                Failed to load sources
              </div>
              <div style={{ fontSize: 13 }}>{errorMessage}</div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <div className="card-icon purple">◉</div>
              Indexed Sources
              {isFetching && !isLoading && (
                <span
                  className="spinner"
                  style={{
                    borderColor: "var(--accent-dim)",
                    borderTopColor: "var(--accent)",
                    width: 13,
                    height: 13,
                  }}
                />
              )}
            </div>
            {!isLoading && (
              <span className="badge badge-purple">
                {sources.length} sources
              </span>
            )}
          </div>

          {isLoading ? (
            <SourceSkeleton />
          ) : sources.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "48px 20px",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontSize: 38, marginBottom: 12, opacity: 0.3 }}>
                📋
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                No sources yet
              </div>
              <div
                style={{ fontSize: 13.5, marginBottom: 20, lineHeight: 1.7 }}
              >
                Ingest a URL to add your first chunk to the knowledge base.
              </div>
              <Link href={`/admin/ingest${qs}`} className="btn btn-primary">
                <span>⊕</span> Ingest your first URL
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {sources.map((source) => (
                <div key={source.source} className="source-item">
                  <div className="source-favicon">
                    {getFavicon(source.source)}
                  </div>
                  <div className="source-info">
                    <div className="source-url" title={source.source}>
                      {source.source}
                    </div>
                    <div className="source-meta">
                      <span>{getDomain(source.source)}</span>
                      <span
                        style={{
                          width: 3,
                          height: 3,
                          borderRadius: "50%",
                          background: "var(--text-muted)",
                          display: "inline-block",
                        }}
                      />
                      <span>
                        {source.chunks_count} chunk
                        {source.chunks_count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "4px 10px",
                      background: "var(--accent-dim)",
                      border: "1px solid rgba(124,58,237,.15)",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--accent)",
                      flexShrink: 0,
                    }}
                  >
                    {source.chunks_count}
                  </div>
                  <span className="badge badge-green" style={{ flexShrink: 0 }}>
                    ✓ indexed
                  </span>
                  {source.source.startsWith("http") && (
                    <a
                      href={source.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm btn-icon"
                      title="Open source URL"
                    >
                      ↗
                    </a>
                  )}
                  <button
                    className="btn btn-sm btn-icon"
                    title="Delete source"
                    onClick={() => setPendingDelete(source)}
                    style={{
                      background: "var(--error-dim)",
                      border: "1px solid rgba(220,38,38,.2)",
                      color: "var(--error)",
                      flexShrink: 0,
                    }}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SourcesPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, color: "var(--text-muted)" }}>Loading…</div>
      }
    >
      <SourcesContent />
    </Suspense>
  );
}
