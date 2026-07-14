# v0 Advanced Planning Modes

A Next.js 16 front-end over the **v0 Platform API**. A user describes an app,
picks a template, optionally enables **Advanced Planning**, and watches v0 build
it — progress and clarifying questions stream into a sidebar while the generated
app renders live in an iframe.

- **Landing** (`/`) lists previously created projects. Each project *is* a v0
  chat, fetched live via `v0.chats.find()` — there is no database.
- **New** (`/new`) collects a prompt, a template, and the "Use Advanced
  Planning" toggle.
- **Builder** (`/projects/[chatId]`) streams v0's output — rendered live by
  `@v0-sdk/react` — into the sidebar, and shows the live preview.

## Stack

- Next.js 16 (App Router, React 19, Tailwind v4)
- `v0-sdk` — the v0 Platform API client (server side)
- `@v0-sdk/react` — headless components that render v0's message stream (client side)
- Geist design tokens + `geist` fonts

---

## What happens when a user builds with a template

This is the core flow. Follow it end to end.

### 1. The user picks a template and writes a prompt

On `/new`, the form ([`create-project-form.tsx`](src/components/create-project-form.tsx))
collects three things and navigates to `/projects/new?prompt=…&template=…&planning=…`:

- **prompt** — what they want to build, in plain language
- **template** — one entry from [`src/lib/templates.ts`](src/lib/templates.ts)
- **Use Advanced Planning** — a checkbox (see the next section)

### 2. Templates are v0 templates, initialized (not prompt presets)

Each template maps to a **v0 template-system template** via its `templateId` —
the trailing id from a `v0.app/templates/<slug>-<id>` URL:

```ts
// src/lib/templates.ts
{ id: "image-transformer", name: "Image Transformer", …, templateId: "fm90jwvZrDb" }
```

When a build starts, the server route
([`src/app/api/chat/route.ts`](src/app/api/chat/route.ts)) instantiates it with
`v0.chats.init`:

```ts
const initialized = await v0.chats.init({ type: "template", templateId });
// initialized.id is the new project's chat id — known immediately
```

The **`blank`** template has an empty `templateId`; instead of `init` it uses
`v0.chats.create` to start from scratch. (`templateId` is a template id, not a
chat id — `fork`/`getById` would 404 on it. Verify templates with
`scripts/verify-templates.ts`.)

> **⚠️ Change this to a template from your own account.** The second entry in the
> `templates` array (`image-transformer`) points at a template that must exist on
> the v0 account whose `V0_API_KEY` you're using. Open the template in v0 and copy
> the **last segment of its URL** as the `templateId` — for
> `https://v0.app/templates/image-transformer-template-fm90jwvZrDb` the id is
> `fm90jwvZrDb` (the `image-transformer-template-` part is just a slug). It is
> **not** a chat id. Then run `scripts/verify-templates.ts` to confirm it resolves.

### 3. The prompt is streamed back and rendered by `@v0-sdk/react`

We send the user's prompt into the chat in streaming mode and return v0's **raw
stream straight to the browser** — no server-side parsing:

```ts
const stream = await v0.chats.sendMessage({
  chatId,
  message,
  system,             // see Advanced Planning below
  modelConfiguration, // see Model switching below
  responseMode: "experimental_stream",
});
return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
```

The client ([`builder.tsx`](src/components/builder.tsx)) fetches that stream and
renders it with `@v0-sdk/react`'s `StreamingMessage`, so thinking steps, tasks,
and code blocks appear as they arrive. The chat id comes back immediately (an
`X-Chat-Id` response header, or the stream's `onChatData`) so we route to
`/projects/[chatId]`. When the build finishes, the client fetches
`GET /api/chats/[id]` once for the finished preview URL. A planning question
just streams the question and produces no preview.

Rendering lives in [`message-renderer.tsx`](src/components/message-renderer.tsx):
the SDK is headless, so we pass a small `components` map (Tailwind/Geist token
classes) to style markdown and the thinking/task sections. History on reload is
rendered the same way, from each message's `experimental_content`.

### 4. Follow-up turns

Every follow-up (answering a question or asking for a change) is a
`sendMessage` to the same `chatId`. The client resends `templateId` and
`advancedPlanning` on every turn, so behavior stays consistent through the
conversation.

---

## Advanced Planning: on vs. off

The **"Use Advanced Planning"** checkbox changes *how much v0 interrogates the
request before building*. It controls the **system instruction** and the
**`thinking`** model flag, both derived in [`src/lib/model.ts`](src/lib/model.ts).

### Off (default) — build directly

- **No system instruction** is sent (`buildSystem(false)` → `undefined`).
- `thinking: false`.
- v0 builds immediately. (For a vague prompt like "build me an app", v0 will
  still ask for direction on its own — that's v0's default, not this toggle.)

### On — interview first, then build

- The **`PLANNING_SYSTEM`** instruction turns v0 into a Technical PM / UI
  Architect that **always asks at least one clarifying question first** — it
  never builds on the first turn, even for a detailed request — one plain-English
  question at a time, then emits a structured spec beginning with the marker
  **`### V0 COMPONENT SPECIFICATION`**.
- `thinking: true`.

**Demo it:** on `/new`, click *Use the demo prompt*, then create it once with the
toggle off (builds immediately) and once on (interviews first). The same
comparison is scriptable:

```bash
node --env-file=.env.local scripts/compare-planning.ts
```

---

## Model switching (Max → Pro)

Planning is the reasoning-heavy phase, so it runs on a **stronger model**; once
the plan is settled we drop to a **cheaper model** for iteration. Tiers live in
[`src/lib/model.ts`](src/lib/model.ts):

```ts
const PLANNING_MODEL = "v0-max"; // planning / interview
const REFINE_MODEL   = "v0-pro"; // once the plan is in place
```

The switch is driven by `planReady`, computed per request in the route:

```ts
const planReady = advancedPlanning
  ? (chatId ? await specEmitted(chatId) : false) // ON: has the spec been emitted in this chat?
  : Boolean(chatId);                             // OFF: after the first turn (a follow-up has a chatId)

modelConfiguration = { modelId: planReady ? REFINE_MODEL : PLANNING_MODEL, thinking: advancedPlanning };
```

`specEmitted(chatId)` reads the chat back with `v0.chats.getById()` and scans its
assistant messages for the `### V0 COMPONENT SPECIFICATION` marker (`SPEC_MARKER`,
exported from `model.ts` so the detector and prompt can't drift). The
spec-emitting turn is still "planning" (Max); everything after runs on Pro. With
the toggle off there's no spec, so it's simply Max for the first prompt and Pro
for follow-ups. Watch the `model decision` log line to see the choice per turn.

> **Note on `modelId`:** the v0 API reference lists `modelConfiguration.modelId`
> as supported; the `v0-sdk` 0.16.4 *types* tag it `@deprecated`, which is a stale
> annotation (editor strikethrough only, no runtime effect). Our usage is correct.

---

## Logging

Every server-side v0 call goes through `v0Call` in
[`src/lib/log.ts`](src/lib/log.ts), which prints a timestamped
request → success/failure trail (with timing and the parsed error body) to the
`next dev` terminal, and rethrows a clear, operation-tagged error. Always on —
this is a demo and the full trail is the point.

---

## Setup

1. Copy the env template and add your key (Premium/Team v0 plan required):

   ```bash
   cp .env.local.example .env.local
   # then edit .env.local and set V0_API_KEY=...
   ```

2. Install and run:

   ```bash
   pnpm install
   pnpm dev
   ```

   Open http://localhost:3000.

### Utility scripts

```bash
# Confirm each template's templateId resolves (creates + deletes a throwaway chat):
node --env-file=.env.local scripts/verify-templates.ts

# Compare Advanced Planning on vs. off for the same prompt:
node --env-file=.env.local scripts/compare-planning.ts
```

---

## How the pieces map

| Concern | File |
| --- | --- |
| v0 client + logged call wrappers | `src/lib/v0.ts` |
| Templates (init sources) | `src/lib/templates.ts` |
| Advanced Planning prompt, model tiers, demo prompt | `src/lib/model.ts` |
| Structured logging (`v0Call`) | `src/lib/log.ts` |
| Chat route (init / create / sendMessage → raw stream) | `src/app/api/chat/route.ts` |
| Chat state (built demo URL) | `src/app/api/chats/[chatId]/route.ts` |
| Screenshot proxy (auth'd `screenshotUrl`) | `src/app/api/screenshot/[chatId]/route.ts` |
| Landing + project grid | `src/app/page.tsx` |
| New-project page + form | `src/app/new/page.tsx`, `src/components/create-project-form.tsx` |
| Builder (sidebar + preview) | `src/components/builder.tsx` |
| Message rendering (`@v0-sdk/react`) | `src/components/message-renderer.tsx` |
