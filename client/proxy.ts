import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only validate routes under /admin/<secretKey>/...
  // Pattern: /admin/<key>/<page>
  if (!pathname.startsWith("/admin/")) return NextResponse.next();

  // Allow /admin and /admin/ root
  const segments = pathname.split("/").filter(Boolean); // ['admin', '<key>', ...]
  if (segments.length < 2) return NextResponse.next();

  const secretKey = segments[1];
  const validKey = process.env.ADMIN_SECRET_KEY;

  // If key is invalid, return 403
  if (!validKey || secretKey !== validKey) {
    return new NextResponse(
      JSON.stringify({ error: "Unauthorized — invalid admin key" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path+"],
};
