"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/** Scroll al formulario vía ?focus= (login móvil) o #ancla en la misma sesión. */
export function ScrollToHash() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const scrollToTarget = () => {
      const focus = searchParams.get("focus");
      const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
      const id = focus || hash;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    scrollToTarget();
    window.addEventListener("hashchange", scrollToTarget);
    return () => window.removeEventListener("hashchange", scrollToTarget);
  }, [searchParams]);

  return null;
}
