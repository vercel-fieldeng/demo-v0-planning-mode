"use client";

import * as React from "react";
import { Message, type MessageBinaryFormat } from "@v0-sdk/react";
import { cn } from "./ui";

/**
 * Renders a v0 assistant message from its `MessageBinaryFormat` (the parsed
 * `experimental_content`) with @v0-sdk/react's headless `Message`.
 *
 * All colors are Geist token classes (text-gray-*, border-gray-*, …) that
 * resolve to our `--ds-*` custom properties, so light/dark theming is
 * inherited — no hardcoded colors. The `components` map:
 *   - restores markdown element styling stripped by Tailwind's preflight,
 *   - replaces the SDK's default emoji icons + section chrome (thinking/task)
 *     with clean, collapsible, on-theme blocks (same pattern as v0-clone).
 * Text color is inherited from the message bubble (correct per role).
 */

/** Strip v0's internal file/shell placeholder markers from text nodes. */
function preprocess(content: MessageBinaryFormat): MessageBinaryFormat {
  if (!Array.isArray(content)) return content;
  return content.map((row) => {
    if (!Array.isArray(row)) return row;
    return row.map((item) => {
      if (typeof item !== "string") return item;
      return item
        .replace(/\[V0_FILE\][^:]*:file="[^"]*"\n?/g, "")
        .replace(/\[V0_FILE\][^\n]*\n?/g, "")
        .replace(/\.\.\.\s*shell\s*\.\.\./g, "")
        .replace(/\n\s*\n\s*\n/g, "\n\n")
        .trim();
    });
  }) as MessageBinaryFormat;
}

/** Collapsible progress block used for thinking / task / code-project parts. */
function CollapsibleSection({
  label,
  meta,
  defaultCollapsed = true,
  children,
}: {
  label: string;
  meta?: string;
  defaultCollapsed?: boolean;
  children?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed);
  const hasBody = React.Children.count(children) > 0;
  return (
    <div className="my-1.5 overflow-hidden rounded-md border border-gray-300">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left text-[12px] font-medium text-gray-600 hover:text-gray-900"
      >
        <span aria-hidden>{collapsed ? "▸" : "▾"}</span>
        <span>{label}</span>
        {meta && <span className="text-gray-500">· {meta}</span>}
      </button>
      {!collapsed && hasBody && (
        <div className="border-t border-gray-300 px-2.5 py-2 text-[12px] leading-relaxed text-gray-900">
          {children}
        </div>
      )}
    </div>
  );
}

export const messageComponents = {
  ThinkingSection: ({
    title,
    duration,
    thought,
    children,
  }: {
    title?: string;
    duration?: number;
    thought?: string;
    children?: React.ReactNode;
  }) => (
    <CollapsibleSection
      label={title || "Thinking"}
      meta={duration ? `${duration}s` : undefined}
    >
      {children ?? thought}
    </CollapsibleSection>
  ),
  TaskSection: ({
    title,
    type,
    children,
  }: {
    title?: string;
    type?: string;
    children?: React.ReactNode;
  }) => (
    <CollapsibleSection label={title || type || "Task"}>{children}</CollapsibleSection>
  ),
  CodeProjectPart: ({
    title,
    filename,
    children,
  }: {
    title?: string;
    filename?: string;
    children?: React.ReactNode;
  }) => (
    <CollapsibleSection label={title || filename || "Code project"}>
      {children}
    </CollapsibleSection>
  ),
  Icon: ({ name, className }: { name: string; className?: string }) => {
    const glyph: Record<string, string> = {
      "chevron-right": "▸",
      "chevron-down": "▾",
      search: "⌕",
      folder: "▤",
      "file-text": "▧",
      brain: "✳",
      wrench: "⚙",
      settings: "⚙",
    };
    return (
      <span className={cn("text-gray-500", className)} aria-hidden>
        {glyph[name] ?? "•"}
      </span>
    );
  },
  // Markdown element styling (Tailwind token classes). Restores preflight resets.
  p: { className: "mb-2 leading-relaxed" },
  ul: { className: "mb-2 list-disc space-y-1 pl-5" },
  ol: { className: "mb-2 list-decimal space-y-1 pl-5" },
  li: { className: "leading-relaxed marker:text-gray-500" },
  h1: { className: "mb-2 mt-1 text-base font-semibold" },
  h2: { className: "mb-2 mt-1 text-sm font-semibold" },
  h3: { className: "mb-1 mt-1 text-sm font-semibold" },
  strong: { className: "font-semibold" },
  em: { className: "italic" },
  code: { className: "rounded bg-gray-100 px-1 py-0.5 font-mono text-[12px]" },
  pre: {
    className:
      "scrollbar-thin my-2 overflow-x-auto rounded-md border border-gray-300 bg-background-200 p-3 font-mono text-[12px]",
  },
  a: {
    className: "text-blue-700 underline underline-offset-2 hover:text-blue-800",
  },
  blockquote: { className: "border-l-2 border-gray-300 pl-3 text-gray-700" },
} as const;

export function MessageRenderer({
  content,
  role,
  messageId,
  streaming,
  className,
}: {
  content: MessageBinaryFormat | string;
  role: "user" | "assistant";
  messageId?: string;
  streaming?: boolean;
  className?: string;
}) {
  // Text color inherits from the message bubble (correct per role).
  if (typeof content === "string") {
    return (
      <p className={cn("whitespace-pre-wrap text-[13px]", className)}>{content}</p>
    );
  }

  return (
    <Message
      content={preprocess(content)}
      role={role}
      messageId={messageId}
      streaming={streaming}
      className={cn("text-[13px]", className)}
      components={messageComponents}
    />
  );
}
