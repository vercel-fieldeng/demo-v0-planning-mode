"use server";

import { revalidatePath } from "next/cache";
import { updateChat, deleteChat } from "@/lib/v0";

/** Rename a chat (our "project"). Reflected on the landing page after revalidation. */
export async function renameChatAction(chatId: string, name: string) {
  const trimmed = name.trim();
  if (!chatId) throw new Error("Missing chat id.");
  if (!trimmed) throw new Error("Name can't be empty.");

  await updateChat({ chatId, name: trimmed });
  revalidatePath("/");
}

/** Delete a chat. Reflected on the landing page after revalidation. */
export async function deleteChatAction(chatId: string) {
  if (!chatId) throw new Error("Missing chat id.");

  await deleteChat(chatId);
  revalidatePath("/");
}
