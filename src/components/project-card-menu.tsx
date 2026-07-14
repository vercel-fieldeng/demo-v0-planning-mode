"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Spinner, cn } from "./ui";
import { renameChatAction, deleteChatAction } from "@/app/actions";

type OpenDialog = null | "rename" | "delete";

export function ProjectCardMenu({
  chatId,
  name,
}: {
  chatId: string;
  name: string;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [dialog, setDialog] = React.useState<OpenDialog>(null);
  const [value, setValue] = React.useState(name);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Dismiss the dropdown on outside click / Escape.
  React.useEffect(() => {
    if (!menuOpen) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function openRename() {
    setValue(name);
    setError(null);
    setDialog("rename");
    setMenuOpen(false);
  }

  function openDelete() {
    setError(null);
    setDialog("delete");
    setMenuOpen(false);
  }

  function closeDialog() {
    if (!pending) {
      setDialog(null);
      setError(null);
    }
  }

  function submitRename(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Name can't be empty.");
      return;
    }
    if (trimmed === name.trim()) {
      setDialog(null);
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await renameChatAction(chatId, trimmed);
        setDialog(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to rename.");
      }
    });
  }

  function confirmDelete() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteChatAction(chatId);
        setDialog(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete.");
      }
    });
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        aria-label="Project options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((o) => !o)}
        className={cn(
          "grid h-8 w-8 place-items-center rounded-md border border-gray-400 bg-background-100/90 text-gray-900 backdrop-blur",
          "transition-colors hover:bg-gray-100 hover:text-gray-1000",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700",
        )}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 w-36 overflow-hidden rounded-md border border-gray-400 bg-background-100 py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={openRename}
            className="block w-full px-3 py-1.5 text-left text-[13px] text-gray-1000 hover:bg-gray-100"
          >
            Rename
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={openDelete}
            className="block w-full px-3 py-1.5 text-left text-[13px] text-red-700 hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      )}

      {dialog && (
        <Dialog
          onClose={closeDialog}
          title={dialog === "rename" ? "Rename project" : "Delete project"}
        >
          {dialog === "rename" ? (
            <form onSubmit={submitRename} className="space-y-4">
              <div>
                <label
                  htmlFor="rename-input"
                  className="mb-1.5 block text-[13px] font-medium text-gray-900"
                >
                  Project name
                </label>
                <Input
                  id="rename-input"
                  autoFocus
                  value={value}
                  disabled={pending}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Untitled project"
                />
              </div>
              {error && <p className="text-[13px] text-red-700">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeDialog}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending || !value.trim()}>
                  {pending && <Spinner />}
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-[13px] text-gray-700">
                Delete{" "}
                <span className="font-medium text-gray-1000">
                  {name.trim() || "Untitled project"}
                </span>
                ? This can&apos;t be undone.
              </p>
              {error && <p className="text-[13px] text-red-700">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={closeDialog}
                  disabled={pending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={confirmDelete}
                  disabled={pending}
                  className="bg-red-700 text-white hover:bg-red-800"
                >
                  {pending && <Spinner />}
                  Delete
                </Button>
              </div>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}

/* Lightweight modal — backdrop click and Escape close it. */
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md rounded-xl border border-gray-400 bg-background-100 p-6 shadow-xl"
      >
        <h2 className="text-base font-semibold text-gray-1000">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
