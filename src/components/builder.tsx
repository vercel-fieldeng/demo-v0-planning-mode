"use client";

import * as React from "react";
import Link from "next/link";
import { StreamingMessage, type MessageBinaryFormat } from "@v0-sdk/react";
import { getTemplate } from "@/lib/templates";
import { MessageRenderer, messageComponents } from "./message-renderer";
import { ThemeToggle } from "./theme-toggle";
import { PreviewFrame, type PreviewState } from "./preview-frame";
import { Button, Spinner, Textarea, Badge, cn } from "./ui";

export interface BuilderSeed {
  prompt: string;
  templateId: string;
  advancedPlanning: boolean;
}

/** A rendered conversation turn. Assistant turns hold v0's binary content; a
 * live turn additionally carries the raw stream for StreamingMessage. */
export interface ChatMessage {
  type: "user" | "assistant";
  content: MessageBinaryFormat | string;
  isStreaming?: boolean;
  stream?: ReadableStream<Uint8Array> | null;
}

// Module-scoped so a StrictMode remount (dev) can't double-send the seed.
const startedSeeds = new Set<string>();

export function Builder({
  initialChatId,
  seed,
  initialPreview,
  initialName,
  initialMessages,
}: {
  initialChatId?: string;
  seed?: BuilderSeed;
  initialPreview?: PreviewState;
  initialName?: string;
  initialMessages?: ChatMessage[];
}) {
  const [chatHistory, setChatHistory] = React.useState<ChatMessage[]>(
    initialMessages ?? [],
  );
  const [preview, setPreview] = React.useState<PreviewState>(
    initialPreview ?? {},
  );
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const chatIdRef = React.useRef<string | undefined>(initialChatId);

  const assignChatId = React.useCallback((id: string) => {
    if (chatIdRef.current) return;
    chatIdRef.current = id;
    window.history.replaceState(null, "", `/projects/${id}`);
  }, []);

  // Poll the chat until its latest version finishes building, then surface the
  // fresh demo URL (the stream doesn't carry the final, built demo).
  const refreshPreview = React.useCallback(async (id: string) => {
    for (let i = 0; i < 8; i++) {
      try {
        const res = await fetch(`/api/chats/${id}`);
        if (res.ok) {
          const data = (await res.json()) as {
            demo?: string;
            status?: PreviewState["status"];
          };
          setPreview({ demoUrl: data.demo, status: data.status });
          if (data.status === "completed" || data.status === "failed") return;
        }
      } catch {
        // transient — keep trying
      }
      await new Promise((r) => setTimeout(r, 2000));
    }
  }, []);

  const send = React.useCallback(
    async (text: string) => {
      setError(null);
      setBusy(true);
      setChatHistory((prev) => [...prev, { type: "user", content: text }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            chatId: chatIdRef.current,
            templateId: seed?.templateId,
            advancedPlanning: seed?.advancedPlanning,
            streaming: true,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error ?? `Request failed (${res.status}).`);
          setBusy(false);
          return;
        }

        const headerId = res.headers.get("X-Chat-Id");
        if (headerId) assignChatId(headerId);

        if (!res.body) {
          setError("No response stream from the server.");
          setBusy(false);
          return;
        }

        setChatHistory((prev) => [
          ...prev,
          { type: "assistant", content: [], isStreaming: true, stream: res.body },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setBusy(false);
      }
    },
    [assignChatId, seed],
  );

  const handleChatData = React.useCallback(
    (data: { id?: string; object?: string }) => {
      if (data?.id) assignChatId(data.id);
    },
    [assignChatId],
  );

  const handleComplete = React.useCallback(
    (index: number, finalContent: MessageBinaryFormat) => {
      setChatHistory((prev) => {
        const next = [...prev];
        if (next[index]?.isStreaming) {
          next[index] = {
            type: "assistant",
            content: finalContent,
            isStreaming: false,
            stream: null,
          };
        }
        return next;
      });
      setBusy(false);
      if (chatIdRef.current) refreshPreview(chatIdRef.current);
    },
    [refreshPreview],
  );

  const handleStreamError = React.useCallback((message: string) => {
    setError(message);
    setBusy(false);
  }, []);

  // Auto-send the seed prompt exactly once for a freshly created project.
  // Deferred to a timer so the send (and its state updates) runs after commit,
  // not synchronously inside the effect. The dedupe guard is claimed *inside*
  // the timer so that under StrictMode's mount→unmount→remount the doomed first
  // mount (whose timer is cleared on cleanup) doesn't claim it and starve the
  // live remount.
  React.useEffect(() => {
    if (!seed?.prompt) return;
    const key = `${seed.templateId}|${seed.advancedPlanning}|${seed.prompt}`;
    const t = setTimeout(() => {
      if (startedSeeds.has(key)) return;
      startedSeeds.add(key);
      void send(seed.prompt);
    }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const template = seed ? getTemplate(seed.templateId) : undefined;
  const awaitingStream =
    busy && !chatHistory.at(-1)?.isStreaming;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="flex h-full w-[380px] shrink-0 flex-col border-r border-gray-300 bg-background-100">
        <header className="flex h-14 items-center justify-between border-b border-gray-300 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-900 hover:text-gray-1000"
          >
            <span aria-hidden>←</span>
            <span className="font-medium">Projects</span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-300 px-4 py-3">
          <span className="truncate text-sm font-medium text-gray-1000">
            {initialName?.trim() || "New project"}
          </span>
          {template && <Badge tone="neutral">{template.name}</Badge>}
          {seed?.advancedPlanning && <Badge tone="info">Advanced planning</Badge>}
        </div>

        {/* Conversation */}
        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {chatHistory.length === 0 && !busy && (
            <p className="text-[13px] text-gray-700">
              {initialChatId
                ? "Resumed project. Send a message to keep building."
                : "Starting…"}
            </p>
          )}

          {chatHistory.map((m, i) => (
            <MessageRow
              key={i}
              message={m}
              index={i}
              onChatData={handleChatData}
              onComplete={handleComplete}
              onError={handleStreamError}
            />
          ))}

          {awaitingStream && (
            <div className="flex items-center gap-2 text-[13px] text-gray-700">
              <Spinner className="h-3.5 w-3.5" /> v0 is working…
            </div>
          )}

          {error && (
            <div className="rounded-md border border-red-700/30 bg-red-100 px-3 py-2 text-[13px] text-red-700">
              {error}
            </div>
          )}
        </div>

        <Composer disabled={busy} onSend={send} />
      </aside>

      {/* Preview */}
      <main className="h-full flex-1">
        <PreviewFrame preview={preview} busy={busy} />
      </main>
    </div>
  );
}

function MessageRow({
  message,
  index,
  onChatData,
  onComplete,
  onError,
}: {
  message: ChatMessage;
  index: number;
  onChatData: (data: { id?: string; object?: string }) => void;
  onComplete: (index: number, content: MessageBinaryFormat) => void;
  onError: (message: string) => void;
}) {
  const isUser = message.type === "user";
  return (
    <div className={cn("flex flex-col gap-1", isUser && "items-end")}>
      <span className="text-[11px] uppercase tracking-wide text-gray-600">
        {isUser ? "You" : "v0"}
      </span>
      <div
        className={cn(
          "max-w-full rounded-lg px-3 py-2 text-[13px] leading-relaxed",
          isUser
            ? "whitespace-pre-wrap bg-gray-1000 text-background-100"
            : "border border-gray-300 bg-background-200 text-gray-1000",
        )}
      >
        {message.isStreaming && message.stream ? (
          <StreamingMessage
            stream={message.stream}
            messageId={`msg-${index}`}
            role="assistant"
            components={messageComponents}
            onChatData={onChatData}
            onComplete={(content) => onComplete(index, content)}
            onError={onError}
            showLoadingIndicator
          />
        ) : (
          <MessageRenderer
            content={message.content}
            role={message.type}
            messageId={`msg-${index}`}
          />
        )}
      </div>
    </div>
  );
}

function Composer({
  disabled,
  onSend,
}: {
  disabled: boolean;
  onSend: (text: string) => void;
}) {
  const [value, setValue] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSend(text);
    setValue("");
  }

  return (
    <form onSubmit={submit} className="border-t border-gray-300 p-3">
      <Textarea
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit(e);
          }
        }}
        placeholder={disabled ? "Waiting for v0…" : "Reply, or ask for a change…"}
        disabled={disabled}
      />
      <div className="mt-2 flex justify-end">
        <Button type="submit" size="sm" disabled={disabled || !value.trim()}>
          {disabled ? <Spinner className="h-3.5 w-3.5" /> : "Send"}
        </Button>
      </div>
    </form>
  );
}
