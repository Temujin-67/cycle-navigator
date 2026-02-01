// CHANGED LINES:
// - Converted to client component (static-export safe)
// - Removed async + Promise searchParams + await
// - Read query string from window.location.search and redirect using useRouter.replace

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CalendarPage() {
  const router = useRouter();

  useEffect(() => {
    // Preserve whatever query params were provided and forward to /navigate
    const qs = typeof window !== "undefined" ? window.location.search : "";
    router.replace(`/navigate${qs || ""}`);
  }, [router]);

  return null;
}
