import { useCallback } from "react";
import { useLocation } from "wouter";

/**
 * Smoothly scrolls to a section by id (without changing the hash in the URL).
 *
 * If the user is currently on a page that doesn't contain the target section
 * (e.g. /track-order, /contact), this first navigates them back to "/" and
 * then scrolls after the homepage renders. The index.css has
 * `scroll-margin-top: 96px` on section[id] so the section title clears the
 * 64px fixed navbar.
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
      requestAnimationFrame(() => {
        setTimeout(() => {
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 250);
      });
    },
    [navigate]
  );
}