"use client";

import * as React from "react";
import { Button } from "./ui";

export function ThemeToggle() {
  const [dark, setDark] = React.useState(true);

  React.useEffect(() => {
    // Sync from the class set by the pre-hydration inline script (external state).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {dark ? "☾" : "☀"}
    </Button>
  );
}
