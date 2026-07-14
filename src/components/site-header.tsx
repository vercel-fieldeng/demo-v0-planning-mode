import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { CreateProjectButton } from "./create-project-button";

export function SiteHeader({ showCreate = true }: { showCreate?: boolean }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-gray-300 bg-background-100/80 px-6 backdrop-blur">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded bg-gray-1000 text-[13px] font-bold text-background-100">
            v0
          </span>
          <span className="text-sm font-semibold text-gray-1000">Demo</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            href="/about"
            className="text-[13px] text-gray-900 transition-colors hover:text-gray-1000"
          >
            How it works
          </Link>
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {showCreate && <CreateProjectButton size="sm" />}
      </div>
    </header>
  );
}
