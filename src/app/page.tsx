import { listChats, hasApiKey } from "@/lib/v0";
import { CreateProjectButton } from "@/components/create-project-button";
import { SiteHeader } from "@/components/site-header";
import { ProjectCard, type ProjectCardData } from "@/components/project-card";

export const dynamic = "force-dynamic";

function Notice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-amber-700/30 bg-amber-100 p-6 text-center">
      <h2 className="text-sm font-semibold text-amber-700">{title}</h2>
      <div className="mt-2 text-[13px] text-gray-900">{children}</div>
    </div>
  );
}

async function ProjectGrid() {
  let chats;
  try {
    chats = await listChats();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return (
      <Notice title="Couldn't load projects from v0">
        <p>{message}</p>
        <p className="mt-2 text-gray-700">
          Check that your <code className="font-mono">V0_API_KEY</code> is valid
          and on a Premium/Team plan.
        </p>
      </Notice>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-gray-400 bg-background-100 p-10 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-gray-100 text-xl text-gray-700">
          ✦
        </div>
        <h2 className="text-base font-semibold text-gray-1000">
          No projects yet
        </h2>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-gray-700">
          Create your first project — describe what you want and pick a template
          to get started.
        </p>
        <div className="mt-5 flex justify-center">
          <CreateProjectButton label="Create your first project" />
        </div>
      </div>
    );
  }

  const cards: ProjectCardData[] = chats.map((c) => ({
    id: c.id,
    name: c.name,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    status: c.latestVersion?.status,
    hasScreenshot: Boolean(c.latestVersion?.screenshotUrl),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-1000">
              Projects
            </h1>
            <p className="mt-1 text-sm text-gray-700">
              Apps you&apos;ve built with v0.
            </p>
          </div>
        </div>

        {hasApiKey() ? (
          <ProjectGrid />
        ) : (
          <Notice title="Set up your v0 API key">
            Add <code className="font-mono">V0_API_KEY</code> to{" "}
            <code className="font-mono">.env.local</code> and restart the dev
            server. A Premium or Team v0 plan with usage-based billing is
            required.
          </Notice>
        )}
      </main>
    </div>
  );
}
