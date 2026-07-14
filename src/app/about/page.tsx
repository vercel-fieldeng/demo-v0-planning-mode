import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui";

export const metadata = {
  title: "How it works — v0 Studio",
  description: "How v0 Studio turns a prompt and a template into a live app.",
};

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-gray-300 py-10">
      {eyebrow && (
        <p className="mb-2 text-[12px] font-medium uppercase tracking-wide text-blue-700">
          {eyebrow}
        </p>
      )}
      <h2 className="text-xl font-semibold tracking-tight text-gray-1000">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-gray-900">
        {children}
      </div>
    </section>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-gray-400 bg-background-200 text-[13px] font-semibold text-gray-1000">
        {n}
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-semibold text-gray-1000">{title}</h3>
        <div className="mt-1 space-y-2 text-[14px] leading-relaxed text-gray-900">
          {children}
        </div>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[12px] text-gray-1000">
      {children}
    </code>
  );
}

function Pre({ children }: { children: string }) {
  return (
    <pre className="scrollbar-thin overflow-x-auto rounded-lg border border-gray-300 bg-background-200 p-4 font-mono text-[12px] leading-relaxed text-gray-1000">
      {children}
    </pre>
  );
}

export default function AboutPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <div className="pb-2">
          <Link
            href="/"
            className="text-[13px] text-gray-700 hover:text-gray-1000"
          >
            ← Back to projects
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-1000">
            How v0 Studio works
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-gray-900">
            v0 Studio is a thin, branded front-end over the{" "}
            <strong className="font-semibold text-gray-1000">
              v0 Platform API
            </strong>
            . You describe an app, pick a template, and optionally turn on{" "}
            <strong className="font-semibold text-gray-1000">
              Advanced Planning
            </strong>
            . v0 builds it while progress and questions stream into a sidebar and
            the result renders live in an iframe. There is no database — every
            project you see <em>is</em> a v0 chat.
          </p>
        </div>

        <Section eyebrow="The core flow" title="Building with a template">
          <div className="space-y-6">
            <Step n={1} title="Pick a template and write a prompt">
              <p>
                On the <Code>/new</Code> page you choose a template, describe what
                you want in plain language, and optionally toggle{" "}
                <strong className="font-semibold text-gray-1000">
                  Use Advanced Planning
                </strong>
                .
              </p>
            </Step>
            <Step n={2} title="Templates are v0 templates, not prompt presets">
              <p>
                Each template points at a{" "}
                <strong className="font-semibold text-gray-1000">
                  v0 template-system template
                </strong>{" "}
                (its <Code>templateId</Code>, the trailing id from a{" "}
                <Code>v0.app/templates/…</Code> URL). When a build starts we
                instantiate it with{" "}
                <strong className="font-semibold text-gray-1000">
                  <Code>v0.chats.init()</Code>
                </strong>
                , which returns the new chat immediately, so we know the
                project&apos;s id right away and route you to it. The{" "}
                <Code>Blank app</Code> template has no <Code>templateId</Code>, so
                it uses <Code>v0.chats.create()</Code> to start from scratch.
              </p>
            </Step>
            <Step n={3} title="Your prompt streams back live, rendered by @v0-sdk/react">
              <p>
                We kick off generation with <Code>v0.chats.sendMessage()</Code>{" "}
                (or <Code>v0.chats.create()</Code> for a blank app) in streaming
                mode, and the route returns v0&apos;s{" "}
                <strong className="font-semibold text-gray-1000">
                  raw stream straight to the browser
                </strong>
                . The client renders it with{" "}
                <Code>@v0-sdk/react</Code>&apos;s <Code>StreamingMessage</Code>,
                so the thinking steps, tasks, and code blocks appear as they
                arrive. The chat id arrives right away (a response header, or the
                stream&apos;s <Code>onChatData</Code>) so we can route you to the
                project; when the build finishes we fetch the chat once more for
                the live preview URL. A planning question just streams the
                question and produces no preview.
              </p>
            </Step>
            <Step n={4} title="Follow-up turns refine the app">
              <p>
                Every reply — answering a question or requesting a change — goes
                to the same chat. The template and planning settings ride along on
                every turn, so behavior stays consistent through the whole
                conversation.
              </p>
            </Step>
          </div>
        </Section>

        <Section
          eyebrow="The planning toggle"
          title="Advanced Planning: on vs. off"
        >
          <p>
            The <strong className="font-semibold text-gray-1000">Use
            Advanced Planning</strong> checkbox decides how much v0 interrogates
            your request before it starts building.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-400 bg-background-100 p-4">
              <Badge tone="neutral">Off</Badge>
              <h3 className="mt-2 text-sm font-semibold text-gray-1000">
                Build directly
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-gray-900">
                <li>No system instruction is sent.</li>
                <li>
                  Thinking is <Code>false</Code>.
                </li>
                <li>v0 builds from your prompt immediately.</li>
                <li>Best for well-specified prompts.</li>
              </ul>
            </div>
            <div className="rounded-lg border border-blue-700/40 bg-blue-100 p-4">
              <Badge tone="info">On</Badge>
              <h3 className="mt-2 text-sm font-semibold text-gray-1000">
                Interview first, then build
              </h3>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] text-gray-900">
                <li>
                  v0 acts as a Technical PM / UI Architect and{" "}
                  <strong className="font-semibold text-gray-1000">
                    always asks at least one clarifying question first
                  </strong>
                  {" "}— it never builds on the first turn, even for a detailed
                  request.
                </li>
                <li>
                  It asks <strong className="font-semibold text-gray-1000">one
                  plain-English question per turn</strong>, offering concrete
                  alternatives.
                </li>
                <li>
                  When it has enough detail it emits a structured spec beginning
                  with <Code>### V0 COMPONENT SPECIFICATION</Code>.
                </li>
                <li>
                  Thinking is <Code>true</Code>.
                </li>
              </ul>
            </div>
          </div>

          <p className="rounded-lg border border-gray-300 bg-background-100 p-3 text-[13px] text-gray-900">
            <strong className="font-semibold text-gray-1000">See it yourself:</strong>{" "}
            on <Code>/new</Code>, click <em>Use the demo prompt</em> and create it
            once with the toggle off (v0 builds immediately) and once with it on
            (v0 interviews first). The same comparison is scriptable via{" "}
            <Code>scripts/compare-planning.ts</Code>.
          </p>
        </Section>

        <Section eyebrow="Cost & quality" title="Model switching: Max → Pro">
          <p>
            Planning is the reasoning-heavy phase, so it runs on a stronger model.
            Once the plan is settled we drop to a cheaper model for iteration.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="success">Planning → v0-max</Badge>
            <Badge tone="neutral">Refinement → v0-pro</Badge>
          </div>
          <p>
            The switch is driven by whether the plan is ready. With{" "}
            <strong className="font-semibold text-gray-1000">
              Advanced Planning on
            </strong>
            , &quot;ready&quot; means the{" "}
            <Code>### V0 COMPONENT SPECIFICATION</Code> marker has appeared in a
            previous assistant turn — the turn that emits the spec still runs on
            Max, and everything after it runs on Pro. With{" "}
            <strong className="font-semibold text-gray-1000">
              Advanced Planning off
            </strong>{" "}
            there is no spec, so it simply uses Max for the first prompt and Pro
            for follow-ups.
          </p>
          <Pre>{`Advanced Planning ON
turn 1  user prompt              → Max   (interview begins)
turn 2  answer question          → Max   (still planning)
turn 3  answer question          → Max   ← emits ### V0 COMPONENT SPECIFICATION
turn 4  "make the header dark"   → Pro   (spec now in history)

Advanced Planning OFF
turn 1  user prompt              → Max
turn 2  "make the header dark"   → Pro`}</Pre>
        </Section>

        <Section eyebrow="Under the hood" title="How the request is served">
          <p>
            The browser talks to a single route, <Code>/api/chat</Code>. For each
            turn it picks the target chat (<strong className="font-semibold text-gray-1000">init
            from a template</strong>, create from scratch, or continue an
            existing chat), the system instruction, and the model tier — then
            calls the v0 SDK in streaming mode and{" "}
            <strong className="font-semibold text-gray-1000">
              returns v0&apos;s raw stream directly
            </strong>{" "}
            (no server-side parsing). The browser renders that stream with{" "}
            <Code>@v0-sdk/react</Code> (<Code>StreamingMessage</Code> for the live
            turn, <Code>Message</Code> for history), reads the chat id from a
            response header / <Code>onChatData</Code>, and fetches{" "}
            <Code>GET /api/chats/[id]</Code> for the built demo URL.
          </p>
        </Section>

        <div className="border-t border-gray-300 py-10">
          <Link
            href="/new"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-gray-1000 px-4 text-sm font-medium text-background-100 transition-colors hover:bg-gray-900"
          >
            <span aria-hidden>+</span> Create a project
          </Link>
        </div>
      </main>
    </div>
  );
}
