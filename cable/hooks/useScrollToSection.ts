import { useCallback } from "react";
import { useLocation } from "wouter";

/**
 * Smoothly scrolls to a section by id (without changing the hash in the URL).
 *
 * If the user is currently on the product detail page (or any page that
 * doesn't contain the target section), this will first navigate them back
 * to "/" and then scroll to the section after the homepage renders.
 *
 * CSS: index.css sets `scroll-margin-top: 96px` on section[id] so the
 * section title clears the 64px fixed navbar.
 */
export function useScrollToSection(): (id: string) => void {
  const [, navigate] = useLocation();

  return useCallback(
    (id: string) => {
      const el = document.getElementById(id);

      if (el) {
        // Already on the homepage — just smooth-scroll to the section.
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      // Not on the homepage — navigate home, then scroll after mount.
      navigate("/");
      // Wait for the homepage to render before measuring the section.
      // 200ms is enough for the page-transition to start; we use
      // rAF + a small buffer to handle slower devices.
      requestAnimationFrame(() => {
        setTimeout(() => {
          document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 250);
      });
    },
    [navigate],
  );
}
