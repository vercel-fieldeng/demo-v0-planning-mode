import { NextRequest } from "next/server";
import { getChat } from "@/lib/v0";
import { log } from "@/lib/log";

/**
 * Proxy for a chat's screenshotUrl. v0's screenshotUrl requires an
 * `Authorization: Bearer` header and cannot be used directly as an <img> src,
 * so we fetch it server-side (where the key lives) and stream the bytes back.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> },
) {
  const { chatId } = await params;
  const apiKey = process.env.V0_API_KEY;
  if (!apiKey) return new Response("No API key", { status: 503 });

  try {
    const chat = await getChat(chatId);
    const url = chat.latestVersion?.screenshotUrl;
    if (!url) return new Response("No screenshot", { status: 404 });

    const upstream = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream error", { status: 502 });
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "image/png",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err) {
    log("warn", "screenshot proxy failed", {
      chatId,
      message: err instanceof Error ? err.message : String(err),
    });
    return new Response("Not found", { status: 404 });
  }
}
