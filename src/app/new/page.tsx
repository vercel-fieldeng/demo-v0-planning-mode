import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { CreateProjectForm } from "@/components/create-project-form";

export default function NewProjectPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader showCreate={false} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-[13px] text-gray-700 hover:text-gray-1000"
          >
            ← Back to projects
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-1000">
            Create a new project
          </h1>
          <p className="mt-1 text-sm text-gray-700">
            Describe what you want to build and pick a starting point.
          </p>
        </div>

        <CreateProjectForm />
      </main>
    </div>
  );
}
