/**
 * Browser-only text extraction utility.
 * All heavy libraries are dynamically imported so they never pollute
 * the server bundle or the initial client bundle.
 *
 * Libraries used:
 *   PDF   – pdfjs-dist  (worker loaded from CDN to avoid webpack/turbopack issues)
 *   DOCX  – mammoth     (browser bundle via mammoth.browser.min.js)
 *   XLSX  – xlsx        (works natively in browser with ArrayBuffer)
 *   TXT   – TextDecoder (built-in browser API, zero deps)
 */

"use client";

// ─── PDF ─────────────────────────────────────────────────────────────────────

async function extractPdf(buffer: ArrayBuffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");

  // Serve the worker from Next.js public/ so there's no CDN dependency.
  // The file is copied from node_modules/pdfjs-dist/build/pdf.worker.min.mjs
  // into public/ at build time (see the copy step in the README).
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      // TextItem has a `str` property; TextMarkedContent does not
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    pages.push(pageText);
  }

  return pages.join("\n\n");
}

// ─── DOCX / DOC ──────────────────────────────────────────────────────────────

async function extractDocx(buffer: ArrayBuffer): Promise<string> {
  // mammoth ships a pre-bundled browser build that doesn't require Node.js fs
  const mammoth = await import("mammoth/mammoth.browser.min.js");
  const result = await (mammoth as any).extractRawText({ arrayBuffer: buffer });
  return (result as { value: string }).value;
}

// ─── XLSX / XLS / CSV ────────────────────────────────────────────────────────

async function extractSpreadsheet(buffer: ArrayBuffer): Promise<string> {
  const XLSX = await import("xlsx");
  // Pass as Uint8Array with type:"array" — works in all browsers
  const workbook = XLSX.read(new Uint8Array(buffer), { type: "array" });
  const firstSheet = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheet];
  const json = XLSX.utils.sheet_to_json(worksheet);
  return JSON.stringify(json, null, 2);
}

// ─── Plain text / Markdown ───────────────────────────────────────────────────

async function extractPlainText(buffer: ArrayBuffer): Promise<string> {
  return new TextDecoder("utf-8").decode(buffer);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Extract plain text from a browser File object — no server/API call needed.
 * Supported formats: .pdf, .docx, .doc, .xlsx, .xls, .csv, .txt, .md
 */
export async function extractTextInBrowser(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const buffer = await file.arrayBuffer();

  if (name.endsWith(".pdf")) return extractPdf(buffer);

  if (name.endsWith(".docx") || name.endsWith(".doc"))
    return extractDocx(buffer);

  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv"))
    return extractSpreadsheet(buffer);

  if (name.endsWith(".txt") || name.endsWith(".md"))
    return extractPlainText(buffer);

  const ext = name.split(".").pop()?.toUpperCase() ?? "unknown";
  throw new Error(
    `Unsupported file type: .${ext}. ` +
      "Supported formats: PDF, DOCX, DOC, XLSX, XLS, CSV, TXT, MD."
  );
}
