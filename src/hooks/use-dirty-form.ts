import { useEffect } from "react";

const LEAVE_MESSAGE =
  "You have unsaved changes. Are you sure you want to leave this page?";

export function useDirtyForm(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    // Warn on tab close / refresh / external navigation.
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    // Warn on in-app (client-side) navigation triggered by link clicks.
    const handleClick = (e: MouseEvent) => {
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      // Ignore external links and navigations that don't change the route.
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return;
      }

      if (!window.confirm(LEAVE_MESSAGE)) {
        // Capture-phase stop prevents the framework's navigation handler.
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty]);
}
