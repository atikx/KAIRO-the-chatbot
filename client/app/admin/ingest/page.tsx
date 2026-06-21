"use client";

import { useState, FormEvent, useRef, Suspense } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ingestUrl,
  ingestText,
  extractTextWithLibraries,
  getErrorMessage,
} from "../../lib/api";
import { useAdminKey } from "../hooks/useAdminKey";

export const dynamic = "force-static";

type IngestMode = "url" | "text" | "file";

function IngestContent() {
  const adminKey = useAdminKey();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<IngestMode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const urlMutation = useMutation({
    mutationFn: (targetUrl: string) => ingestUrl(targetUrl, adminKey),
    onSuccess: () => {
      setUrl("");
      queryClient.invalidateQueries({ queryKey: ["admin-data", adminKey] });
    },
  });

  const textMutation = useMutation({
    mutationFn: ({ content, source }: { content: string; source?: string }) =>
      ingestText(content, adminKey, source),
    onSuccess: () => {
      setText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["admin-data", adminKey] });
    },
  });

  const fileMutation = useMutation({
    mutationFn: async (targetFile: File) => {
      const extractedText = await extractTextWithLibraries(targetFile);
      if (!extractedText.trim())
        throw new Error("No text content could be extracted from this file.");
      return textMutation.mutateAsync({ content: extractedText, source: targetFile.name });
    },
    onSuccess: () => {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "url") {
      const trimmed = url.trim();
      if (!trimmed) return;
      urlMutation.reset();
      urlMutation.mutate(trimmed);
    } else if (mode === "text") {
      const trimmed = text.trim();
      if (!trimmed) return;
      textMutation.reset();
      textMutation.mutate({ content: trimmed });
    } else if (mode === "file") {
      if (!file) return;
      fileMutation.reset();
      fileMutation.mutate(file);
    }
  };

  const isPending = urlMutation.isPending || textMutation.isPending || fileMutation.isPending;
  const isError = urlMutation.isError || textMutation.isError || fileMutation.isError;
  const isSuccess = urlMutation.isSuccess || textMutation.isSuccess || fileMutation.isSuccess;

  const data = urlMutation.data || textMutation.data || fileMutation.data;
  const error = urlMutation.error || textMutation.error || fileMutation.error;
  const errorMessage = isError ? getErrorMessage(error) : null;

  const resetMutations = () => {
    urlMutation.reset();
    textMutation.reset();
    fileMutation.reset();
  };

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Ingest Data</h1>
        <p className="page-subtitle">
          Add content to your RAG knowledge base via URL, raw text, or document upload.
        </p>
      </div>

      <div className="page-body">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ─── Mode Switcher ─── */}
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button
              className={`btn ${mode === "url" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setMode("url"); resetMutations(); }}
              style={{ flex: 1 }}
            >
              <span>🌐</span> Website URL
            </button>
            <button
              className={`btn ${mode === "text" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setMode("text"); resetMutations(); }}
              style={{ flex: 1 }}
            >
              <span>✍️</span> Raw Text
            </button>
            <button
              className={`btn ${mode === "file" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => { setMode("file"); resetMutations(); }}
              style={{ flex: 1 }}
            >
              <span>📄</span> Document
            </button>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <div className={`card-icon ${mode === "url" ? "purple" : mode === "text" ? "blue" : "amber"}`}>
                  {mode === "url" ? "🌐" : mode === "text" ? "✍️" : "📄"}
                </div>
                {mode === "url" ? "URL Chunking" : mode === "text" ? "Text Ingestion" : "Document Extraction"}
              </div>
              <span className="badge badge-purple">Active</span>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 20, lineHeight: 1.7 }}>
              {mode === "url"
                ? "Enter a publicly accessible URL. Kairo will fetch the page, split it into semantic chunks, generate embeddings, and store them."
                : mode === "text"
                ? "Paste raw text content here. Kairo will split it into semantic chunks, generate embeddings, and store them directly."
                : "Upload PDF, DOCX, or other files. Text is extracted directly in your browser, then chunked and embedded."}
            </p>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="ingest-input">
                  {mode === "url" ? "Website URL" : mode === "text" ? "Raw Content" : "Upload File"}
                </label>
                {mode === "url" ? (
                  <input
                    id="ingest-input"
                    type="url"
                    className="form-input"
                    placeholder="https://example.com/docs/page"
                    value={url}
                    onChange={(e) => {
                      setUrl(e.target.value);
                      if (isError || isSuccess) resetMutations();
                    }}
                    disabled={isPending}
                    required
                    autoFocus
                  />
                ) : mode === "text" ? (
                  <textarea
                    id="ingest-input"
                    className="form-input"
                    placeholder="Paste your content here..."
                    style={{ minHeight: 200, resize: "vertical" }}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      if (isError || isSuccess) resetMutations();
                    }}
                    disabled={isPending}
                    required
                    autoFocus
                  />
                ) : (
                  <input
                    id="ingest-input"
                    type="file"
                    ref={fileInputRef}
                    className="form-input"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setFile(e.target.files[0]);
                        if (isError || isSuccess) resetMutations();
                      }
                    }}
                    disabled={isPending}
                    required
                    accept=".pdf,.docx,.doc,.txt,.md,.pptx,.xlsx"
                  />
                )}
                <div className="form-hint">
                  {mode === "url"
                    ? "Publicly accessible URLs only. JS-heavy SPAs may not be fully captured."
                    : mode === "text"
                    ? "Ideal for long-form articles, documentation snippets, or meeting notes."
                    : "Supports PDF, DOCX, XLSX, CSV, TXT, and MD formats. Extraction happens entirely in your browser."}
                </div>
              </div>

              {/* Progress */}
              {isPending && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 8 }}>
                    <span className="spinner" style={{ borderColor: "var(--accent-dim)", borderTopColor: "var(--accent)" }} />
                    {mode === "url"
                      ? "Fetching and chunking..."
                      : mode === "file"
                      ? (fileMutation.isPending && !textMutation.isPending ? "Extracting text in browser..." : "Processing and embedding...")
                      : "Processing and embedding..."}
                  </div>
                  <div className="progress-bar"><div className="progress-fill" /></div>
                </div>
              )}

              {/* Success */}
              {isSuccess && data && (
                <div className="alert alert-success" style={{ marginBottom: 14 }}>
                  <span className="alert-icon">✓</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Ingested successfully</div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>{data.message}</div>
                  </div>
                </div>
              )}

              {/* Error */}
              {isError && errorMessage && (
                <div className="alert alert-error" style={{ marginBottom: 14 }}>
                  <span className="alert-icon">⚠</span>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>Ingest failed</div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>{errorMessage}</div>
                  </div>
                </div>
              )}

              <button
                id="ingest-submit-btn"
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={isPending || (mode === "file" && !file)}
              >
                {isPending
                  ? <><span className="spinner" />Processing…</>
                  : <><span>⊕</span> {mode === "url" ? "Ingest URL" : mode === "text" ? "Ingest Text" : "Ingest Document"}</>}
              </button>
            </form>
          </div>

        </div>
      </div>
    </>
  );
}

export default function IngestPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text-muted)" }}>Loading…</div>}>
      <IngestContent />
    </Suspense>
  );
}
