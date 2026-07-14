"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "./ui";
import { ProjectCardMenu } from "./project-card-menu";

export interface ProjectCardData {
  id: string;
  name?: string;
  createdAt: string;
  updatedAt?: string;
  hasScreenshot: boolean;
  status?: "pending" | "completed" | "failed";
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

const statusTone = {
  completed: "success",
  pending: "warning",
  failed: "error",
} as const;

export function ProjectCard({ project }: { project: ProjectCardData }) {
  const [imgOk, setImgOk] = React.useState(project.hasScreenshot);
  const name = project.name?.trim() || "Untitled project";
  const time = relativeTime(project.updatedAt ?? project.createdAt);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-400 bg-background-100 transition-colors hover:border-gray-500">
      <div className="absolute right-2 top-2 z-10">
        <ProjectCardMenu chatId={project.id} name={project.name ?? ""} />
      </div>
      <Link
        href={`/projects/${project.id}`}
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-video overflow-hidden bg-background-200">
          {imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/screenshot/${project.id}`}
              alt=""
              className="h-full w-full object-cover object-top"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <span className="text-2xl text-gray-600" aria-hidden>
                ◐
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-gray-300 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-1000">{name}</p>
            <p className="text-[12px] text-gray-700">{time}</p>
          </div>
          {project.status && (
            <Badge tone={statusTone[project.status]}>{project.status}</Badge>
          )}
        </div>
      </Link>
    </div>
  );
}
