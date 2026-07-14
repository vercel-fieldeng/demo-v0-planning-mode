import { createClient } from "v0-sdk";
import { v0Call, debugPreview } from "@/lib/log";

/**
 * Server-only v0 Platform API client. The API key never reaches the browser.
 * A "project" in this app is a v0 chat, so all listing/reads go through chats.
 *
 * Every call below is wrapped in `v0Call` so we get a full, timed log trail and
 * operation-tagged errors (see lib/log.ts). Prefer these helpers over touching
 * `v0.chats.*` directly.
 */
export const v0 = createClient({
  apiKey: process.env.V0_API_KEY,
});

export function hasApiKey(): boolean {
  return Boolean(process.env.V0_API_KEY);
}

/** List previously created chats (our "projects"), newest first. v0 caps limit at 60. */
export async function listChats(limit = 60) {
  const capped = Math.min(limit, 60);
  const res = await v0Call("chats.find", { limit: capped }, () =>
    v0.chats.find({ limit: capped }),
  );
  const data = [...res.data];
  data.sort((a, b) => {
    const at = new Date(a.updatedAt ?? a.createdAt).getTime();
    const bt = new Date(b.updatedAt ?? b.createdAt).getTime();
    return bt - at;
  });
  return data;
}

/** Fetch a single chat + its latest version (for the builder view). */
export async function getChat(chatId: string) {
  return v0Call("chats.getById", { chatId }, () => v0.chats.getById({ chatId }));
}

type CreateParams = Parameters<typeof v0.chats.create>[0];
type SendMessageParams = Parameters<typeof v0.chats.sendMessage>[0];
type UpdateParams = Parameters<typeof v0.chats.update>[0];

/** Create a chat from scratch. Streaming params return a ReadableStream. */
export async function createChat(params: CreateParams) {
  return v0Call(
    "chats.create",
    {
      model: params.modelConfiguration?.modelId,
      thinking: params.modelConfiguration?.thinking,
      systemLen: params.system?.length ?? 0,
      responseMode: params.responseMode,
      msg: debugPreview(params.message),
    },
    () => v0.chats.create(params),
  );
}

/** Send a message into an existing chat. Streaming params return a ReadableStream. */
export async function sendMessage(params: SendMessageParams) {
  return v0Call(
    "chats.sendMessage",
    {
      chatId: params.chatId,
      model: params.modelConfiguration?.modelId,
      thinking: params.modelConfiguration?.thinking,
      systemLen: params.system?.length ?? 0,
      responseMode: params.responseMode,
      msg: debugPreview(params.message),
    },
    () => v0.chats.sendMessage(params),
  );
}

type InitParams = Parameters<typeof v0.chats.init>[0];

/** Initialize a chat from a v0 template-system template (or other init source). */
export async function initChat(params: InitParams) {
  const meta: Record<string, unknown> = { type: params.type };
  if ("templateId" in params) meta.templateId = params.templateId;
  return v0Call("chats.init", meta, () => v0.chats.init(params));
}

/** Update a chat (e.g. rename). */
export async function updateChat(params: UpdateParams) {
  return v0Call(
    "chats.update",
    { chatId: params.chatId, name: params.name },
    () => v0.chats.update(params),
  );
}

/** Delete a chat. */
export async function deleteChat(chatId: string) {
  return v0Call("chats.delete", { chatId }, () => v0.chats.delete({ chatId }));
}
