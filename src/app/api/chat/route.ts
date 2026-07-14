import { NextResponse } from "next/server";
import {
  hasApiKey,
  createChat,
  sendMessage,
  initChat,
  getChat,
} from "@/lib/v0";
import { log, debugPreview } from "@/lib/log";
import { buildSystem, buildModelConfiguration, SPEC_MARKER } from "@/lib/model";
import { getTemplate } from "@/lib/templates";

// v0 generation (especially with Advanced Planning) can run long.
export const maxDuration = 800;

interface ChatBody {
  message: string;
  chatId?: string;
  templateId?: string;
  advancedPlanning?: boolean;
}

/**
 * Has the Advanced Planning spec already been emitted in this chat? Checked
 * server-side (via getById) rather than from client-sent history, so the model
 * switch is driven by the authoritative chat state.
 */
async function specEmitted(chatId: string): Promise<boolean> {
  try {
    const chat = await getChat(chatId);
    return (chat.messages ?? []).some(
      (m) =>
        m.role === "assistant" &&
        typeof m.content === "string" &&
        m.content.includes(SPEC_MARKER),
    );
  } catch {
    return false;
  }
}

/**
 * Thin proxy over the v0 Platform API. We build the target chat + system +
 * model tier, then return v0's raw experimental_stream directly — the client
 * renders it with @v0-sdk/react (StreamingMessage). No server-side parsing,
 * polling, or bridging.
 */
export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody;
  const { message, chatId, templateId, advancedPlanning = false } = body;

  log("info", "POST /api/chat", {
    chatId: chatId ?? "(new)",
    templateId,
    advancedPlanning,
    msg: debugPreview(message),
  });

  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "V0_API_KEY is not set. Add it to .env.local (a Premium/Team v0 plan is required).",
      },
      { status: 503 },
    );
  }

  try {
    const system = buildSystem(advancedPlanning);
    // Planning runs on Max; drop to Pro once the plan is in place. With Advanced
    // Planning that's when the spec marker has appeared in the chat; otherwise
    // fall back to "after the first turn" (a follow-up has a chatId).
    const planReady = advancedPlanning
      ? chatId
        ? await specEmitted(chatId)
        : false
      : Boolean(chatId);
    const modelConfiguration = buildModelConfiguration({
      advancedPlanning,
      planReady,
    });

    log("info", "model decision", {
      advancedPlanning,
      planReady,
      model: modelConfiguration.modelId,
      thinking: modelConfiguration.thinking,
      reason: advancedPlanning
        ? planReady
          ? "spec emitted → refine"
          : "planning (awaiting spec)"
        : chatId
          ? "follow-up → refine"
          : "first turn → planning",
    });

    // Resolve the target chat: existing chatId (follow-up) / init from a
    // template (new + template) / create from scratch (new + blank).
    let targetChatId = chatId;
    if (!targetChatId) {
      const template = getTemplate(templateId);
      if (template.templateId) {
        const initialized = await initChat({
          type: "template",
          templateId: template.templateId,
          chatPrivacy: "private",
        });
        targetChatId = initialized.id;
      }
    }

    const stream = (
      targetChatId
        ? await sendMessage({
            chatId: targetChatId,
            message,
            system,
            modelConfiguration,
            responseMode: "experimental_stream",
          })
        : await createChat({
            message,
            system,
            modelConfiguration,
            chatPrivacy: "private",
            responseMode: "experimental_stream",
          })
    ) as unknown as ReadableStream<Uint8Array>;

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        // Known already for template/follow-up turns so the client can route
        // before the stream reveals it; absent for a from-scratch create.
        ...(targetChatId ? { "X-Chat-Id": targetChatId } : {}),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("error", "chat request failed", {
      message: msg,
      stack: error instanceof Error ? error.stack : undefined,
    });
    // V0Error messages are already descriptive ("v0.chats.… failed (…)").
    return NextResponse.json(
      { error: msg.startsWith("v0.") ? msg : `v0 request failed: ${msg}` },
      { status: 500 },
    );
  }
}
