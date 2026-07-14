/**
 * Verify that every template's `templateId` resolves against the v0 template
 * system — so the create flow doesn't blow up with an opaque error when a
 * template id is wrong (e.g. a chat id or a stale/placeholder value, which
 * makes v0.chats.init return 404 "Template not found").
 *
 * There's no read-only "get template" endpoint, so the only way to validate a
 * templateId is to init from it. This script therefore creates a throwaway chat
 * per template and deletes it again.
 *
 * Run (Node 24 strips TS types natively):
 *   node --env-file=.env.local scripts/verify-templates.ts
 *
 * Exit code is non-zero if any template fails to init, so it's safe to wire
 * into CI / a preflight check.
 */
import { v0 } from "v0-sdk";
import { templates } from "../src/lib/templates.ts";

async function main() {
  if (!process.env.V0_API_KEY) {
    console.error(
      "V0_API_KEY not set. Use: node --env-file=.env.local scripts/verify-templates.ts",
    );
    process.exit(1);
  }

  console.log(`Verifying ${templates.length} template(s)…\n`);

  let failures = 0;
  for (const t of templates) {
    if (!t.templateId) {
      console.log(`• ${t.id.padEnd(20)} create (no template) — OK`);
      continue;
    }

    try {
      const chat = await v0.chats.init({
        type: "template",
        templateId: t.templateId,
        chatPrivacy: "private",
      });
      console.log(
        `✓ ${t.id.padEnd(20)} init ${t.templateId} → chat ${chat.id} "${chat.name ?? "(unnamed)"}"`,
      );
      // Clean up the throwaway chat this check created.
      await v0.chats.delete({ chatId: chat.id }).catch(() => {});
    } catch (err) {
      failures++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${t.id.padEnd(20)} init ${t.templateId} — ${message}`);
    }
  }

  console.log();
  if (failures > 0) {
    console.error(
      `${failures} template(s) have a templateId that does not resolve. ` +
        `Fix templateId in src/lib/templates.ts (use the trailing id from the ` +
        `v0.app/templates/… URL, or blank it to fall back to create).`,
    );
    process.exit(1);
  }
  console.log("All templates verified.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
