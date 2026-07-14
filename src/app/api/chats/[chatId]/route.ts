import { NextResponse } from "next/server";
import { getChat, hasApiKey } from "@/lib/v0";

/**
 * Current state of a chat's latest version — used by the client to pick up the
 * fresh demo URL once a build finishes streaming (the stream itself doesn't
 * carry the final, built demo).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  if (!hasApiKey()) {
    return NextResponse.json({ error: "No API key" }, { status: 503 });
  }
  try {
    const chat = await getChat(chatId);
    return NextResponse.json({
      id: chat.id,
      demo: chat.latestVersion?.demoUrl,
      status: chat.latestVersion?.status,
      webUrl: chat.webUrl,
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
