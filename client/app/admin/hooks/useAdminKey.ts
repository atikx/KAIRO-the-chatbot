"use client";

import { useSearchParams } from "next/navigation";

/**
 * Read the admin key from the `?key=` query parameter.
 * All flat admin pages (/admin/dashboard, /admin/ingest, etc.) use this
 * instead of the old [secretKey] dynamic route segment.
 */
export function useAdminKey(): string {
    const params = useSearchParams();
    return params.get("key") ?? "";
}
