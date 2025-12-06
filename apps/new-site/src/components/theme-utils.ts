import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

export function getStarlightTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function useStarlightTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getStarlightTheme);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(getStarlightTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    setTheme(getStarlightTheme());

    return () => observer.disconnect();
  }, []);

  return theme;
}
