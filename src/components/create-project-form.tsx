"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button, Checkbox, Textarea, cn } from "./ui";
import { templates, DEFAULT_TEMPLATE_ID } from "@/lib/templates";
import { DEMO_PROMPT } from "@/lib/model";

export function CreateProjectForm() {
  const router = useRouter();
  const [prompt, setPrompt] = React.useState("");
  const [templateId, setTemplateId] = React.useState(DEFAULT_TEMPLATE_ID);
  const [advancedPlanning, setAdvancedPlanning] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim()) return;
    setSubmitting(true);
    const params = new URLSearchParams({
      prompt: prompt.trim(),
      template: templateId,
      planning: advancedPlanning ? "1" : "0",
    });
    router.push(`/projects/new?${params.toString()}`);
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label
          htmlFor="prompt"
          className="mb-1.5 block text-[13px] font-medium text-gray-900"
        >
          What do you want to build?
        </label>
        <Textarea
          id="prompt"
          autoFocus
          rows={5}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A project management tool for small design studios with a kanban board, task assignments, and a calendar view"
        />
        <button
          type="button"
          onClick={() => setPrompt(DEMO_PROMPT)}
          className="mt-1.5 text-[12px] text-gray-700 underline underline-offset-2 hover:text-gray-1000"
        >
          Use the demo prompt
        </button>
        <p className="mt-1 text-[12px] text-gray-600">
          Tip: run the demo prompt once with Advanced Planning off (v0 builds
          immediately) and once with it on (v0 interviews first) to compare.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-[13px] font-medium text-gray-900">
          Start from a template
        </label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {templates.map((t) => {
            const selected = t.id === templateId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateId(t.id)}
                className={cn(
                  "flex flex-col gap-1.5 rounded-lg border p-4 text-left transition-colors",
                  selected
                    ? "border-blue-700 bg-blue-100"
                    : "border-gray-400 bg-background-100 hover:border-gray-500",
                )}
              >
                <span className="text-xl leading-none" aria-hidden>
                  {t.glyph}
                </span>
                <span className="text-sm font-medium text-gray-1000">
                  {t.name}
                </span>
                <span className="text-[12px] leading-snug text-gray-700">
                  {t.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-300 bg-background-200 p-4">
        <Checkbox
          id="advanced-planning"
          checked={advancedPlanning}
          onChange={setAdvancedPlanning}
          label="Use Advanced Planning"
          description="v0 thinks through the requirements and may ask clarifying questions before building."
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!prompt.trim() || submitting}>
          Create project
        </Button>
      </div>
    </form>
  );
}
