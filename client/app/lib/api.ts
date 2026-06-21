import axios, { AxiosError } from "axios";
import { extractTextInBrowser } from "./extractText";

/* ─── Axios instance ─────────────────────────────────────── */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4242",
  headers: { "Content-Type": "application/json" },
  timeout: 60_000,
});

/**
 * Creates a new axios instance pre-configured with the admin key header.
 * Call this once you have the key from the URL segment.
 */
export function adminApi(key: string) {
  return axios.create({
    baseURL: process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4242",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": key,
    },
    timeout: 60_000,
  });
}

/* ─── Response shapes ────────────────────────────────────── */
export interface IngestResponse {
  success: boolean;
  message: string;
}

export interface ResolveQueryResponse {
  success: boolean;
  answer: string;
}

export interface AdminDataItem {
  source: string;
  chunks_count: number;
}

export interface AdminDataResponse {
  success: boolean;
  data: AdminDataItem[];
}

/* ─── Typed error helper ─────────────────────────────────── */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError<{ error?: string; message?: string } | string>;
    const data = axiosErr.response?.data;
    const status = axiosErr.response?.status;

    if (typeof data === "string" && data.trim()) return data.trim();
    if (typeof data === "object" && data !== null) {
      if ("error" in data && typeof data.error === "string") return data.error;
      if ("message" in data && typeof data.message === "string") return data.message;
    }
    if (status === 401) return "Unauthorized — invalid or missing admin key.";
    if (status === 403) return "Forbidden — you don't have access to this resource.";
    if (status === 400) return "Bad request — check your input and try again.";
    if (status === 500) return "Server error (500) — check the server logs.";
    if (axiosErr.code === "ECONNABORTED")
      return "Request timed out — the page may be too large or the server is slow.";
    if (axiosErr.code === "ERR_NETWORK")
      return "Network error — is the Go server running on port 4242?";
    return axiosErr.message;
  }
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred.";
}

/* ─── API calls ──────────────────────────────────────────── */

/** POST /admin/embeddings/url — protected */
export async function ingestUrl(url: string, adminKey: string): Promise<IngestResponse> {
  const res = await adminApi(adminKey).post<IngestResponse>("/admin/embeddings/url", { url });
  return res.data;
}

/** POST /admin/embeddings/text — protected */
export async function ingestText(
  text: string,
  adminKey: string,
  source?: string
): Promise<IngestResponse> {
  const res = await adminApi(adminKey).post<IngestResponse>("/admin/embeddings/text", {
    text,
    source,
  });
  return res.data;
}

/**
 * Extract text from a file entirely in the browser (no API call).
 * Delegates to pdfjs-dist, mammoth browser build, xlsx, or TextDecoder.
 */
export async function extractTextWithLibraries(file: File): Promise<string> {
  return extractTextInBrowser(file);
}

/** GET /admin/data — protected */
export async function fetchAdminData(adminKey: string): Promise<AdminDataResponse> {
  const res = await adminApi(adminKey).get<AdminDataResponse>("/admin/data");
  return res.data;
}

/** DELETE /admin/source?source={source} — protected */
export async function deleteSource(source: string, adminKey: string): Promise<{ success: boolean }> {
  const res = await adminApi(adminKey).delete<{ success: boolean }>(
    `/admin/source?source=${encodeURIComponent(source)}`
  );
  return res.data;
}

/** POST /resolveQuery — public */
export async function resolveQuery(
  que: string,
  chatId: string
): Promise<ResolveQueryResponse> {
  const res = await api.post<ResolveQueryResponse>(
    `/resolveQuery?chat_id=${encodeURIComponent(chatId)}`,
    { que }
  );
  return res.data;
}
