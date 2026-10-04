"use client";

import { useEffect, useState } from "react";

export function useTheme() {
  const [dark, setDarkState] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("fz_theme");
        if (stored === "dark") return true;
        if (stored === "light") return false;
        return document.documentElement.classList.contains("dark");
      } catch {}
    }
    return false;
  });

  useEffect(() => {
    // Initial sync on mount
    const stored = localStorage.getItem("fz_theme");
    const isDark = stored === "dark" || (!stored && document.documentElement.classList.contains("dark"));
    setDarkState(isDark);
    document.documentElement.classList.toggle("dark", isDark);

    const handleThemeChange = (e: Event) => {
      const customDetail = (e as CustomEvent<boolean>).detail;
      if (typeof customDetail === "boolean") {
        setDarkState(customDetail);
      } else {
        setDarkState(document.documentElement.classList.contains("dark"));
      }
    };

    window.addEventListener("fz_theme_change", handleThemeChange);
    window.addEventListener("storage", (e) => {
      if (e.key === "fz_theme") {
        const d = e.newValue === "dark";
        setDarkState(d);
        document.documentElement.classList.toggle("dark", d);
      }
    });

    return () => {
      window.removeEventListener("fz_theme_change", handleThemeChange);
    };
  }, []);

  const toggleDark = (force?: boolean) => {
    const next = typeof force === "boolean" ? force : !dark;
    setDarkState(next);
    if (next) {
      document.documentElement.classList.add("dark");
      try {
        localStorage.setItem("fz_theme", "dark");
        document.cookie = "fz_theme=dark; path=/; max-age=31536000";
      } catch {}
    } else {
      document.documentElement.classList.remove("dark");
      try {
        localStorage.setItem("fz_theme", "light");
        document.cookie = "fz_theme=light; path=/; max-age=31536000";
      } catch {}
    }
    window.dispatchEvent(new CustomEvent("fz_theme_change", { detail: next }));
  };

  return { dark, toggleDark };
}
