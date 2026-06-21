/**
 * This API route is no longer used.
 * Text extraction now happens entirely in the browser via extractText.ts
 * using pdfjs-dist, mammoth browser build, and xlsx.
 *
 * Kept as a stub to avoid 404s if anything still references /api/extract.
 */
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "This endpoint is deprecated. Text extraction now happens client-side.",
    },
    { status: 410 }
  );
}
