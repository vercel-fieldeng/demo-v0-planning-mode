/**
 * Demo/verify the Advanced Planning difference: run the SAME prompt with
 * planning OFF and ON and show that OFF builds immediately while ON interviews
 * first. Uses the exact system + modelConfiguration the app's /api/chat route
 * builds, so this mirrors runtime behavior.
 *
 * Run (Node 24 strips TS types natively):
 *   node --env-file=.env.local scripts/compare-planning.ts
 *   node --env-file=.env.local scripts/compare-planning.ts "your own prompt"
 *
 * Creates two throwaway chats and deletes them afterward.
 */
import { v0, type ChatDetail } from "v0-sdk";
import { buildSystem, buildModelConfiguration, DEMO_PROMPT } from "../src/lib/model.ts";

const PROMPT = process.argv[2] ?? DEMO_PROMPT;

async function run(label: string, advancedPlanning: boolean) {
  const chat = (await v0.chats.create({
    message: PROMPT,
    system: buildSystem(advancedPlanning),
    modelConfiguration: buildModelConfiguration({ advancedPlanning, planReady: false }),
    responseMode: "sync",
    chatPrivacy: "private",
  })) as ChatDetail;
  const lastAssistant = [...(chat.messages ?? [])]
    .reverse()
    .find((m) => m.role === "assistant" && m.type === "message");
  const built = Boolean(chat.latestVersion?.id);
  console.log(`\n===== ${label} =====`);
  console.log(`model=${buildModelConfiguration({ advancedPlanning, planReady: false }).modelId}  thinking=${advancedPlanning}  system=${advancedPlanning ? "PLANNING" : "none"}`);
  console.log(`outcome: ${built ? `BUILT an app (version ${chat.latestVersion?.status})` : "ASKED a question (no build)"}`);
  console.log(
    "reply:",
    String(lastAssistant?.content ?? chat.text)
      .replace(/\s+/g, " ")
      .slice(0, 200),
  );
  await v0.chats.delete({ chatId: chat.id }).catch(() => {});
}

async function main() {
  if (!process.env.V0_API_KEY) {
    console.error("V0_API_KEY not set.");
    process.exit(1);
  }
  console.log(`Prompt: "${PROMPT}"`);
  await run("ADVANCED PLANNING OFF", false);
  await run("ADVANCED PLANNING ON", true);
  console.log(
    "\nExpected: OFF builds immediately; ON asks a clarifying question first.",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
