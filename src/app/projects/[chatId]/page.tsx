import { Builder, type BuilderSeed, type ChatMessage } from "@/components/builder";
import type { MessageBinaryFormat } from "@v0-sdk/react";
import { getChat } from "@/lib/v0";
import { DEFAULT_TEMPLATE_ID } from "@/lib/templates";

export const dynamic = "force-dynamic";

type V0Chat = Awaited<ReturnType<typeof getChat>>;

/**
 * Map a chat's stored messages into renderable turns: assistant turns carry
 * v0's `experimental_content` (MessageBinaryFormat) for rich rendering; user
 * turns carry their plain text. Fork/duplicate boilerplate (non-`message`
 * types) and empty turns are dropped.
 */
function chatToMessages(chat: V0Chat): ChatMessage[] {
  return (chat.messages ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") && m.type === "message",
    )
    .map<ChatMessage>((m) =>
      m.role === "user"
        ? { type: "user", content: (m.content ?? "").trim() }
        : {
            type: "assistant",
            content: (m.experimental_content ?? []) as MessageBinaryFormat,
          },
    )
    .filter((m) =>
      typeof m.content === "string"
        ? m.content.length > 0
        : (m.content as unknown[]).length > 0,
    );
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ chatId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { chatId } = await params;

  // New project: seed the builder from the create-modal query params.
  if (chatId === "new") {
    const sp = await searchParams;
    const prompt = typeof sp.prompt === "string" ? sp.prompt : "";
    const seed: BuilderSeed = {
      prompt,
      templateId: typeof sp.template === "string" ? sp.template : DEFAULT_TEMPLATE_ID,
      advancedPlanning: sp.planning === "1",
    };
    return <Builder seed={seed} />;
  }

  // Existing project: load current state from v0 (falling back gracefully).
  const chat = await getChat(chatId).catch(() => null);

  return (
    <Builder
      initialChatId={chat?.id ?? chatId}
      initialName={chat?.name ?? "Project"}
      initialMessages={chat ? chatToMessages(chat) : undefined}
      initialPreview={{
        demoUrl: chat?.latestVersion?.demoUrl,
        status: chat?.latestVersion?.status,
      }}
    />
  );
}
