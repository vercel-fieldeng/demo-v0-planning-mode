"use client";

import * as React from "react";
import { Spinner, Badge } from "./ui";

export interface PreviewState {
  demoUrl?: string;
  status?: "pending" | "completed" | "failed";
}

export function PreviewFrame({
  preview,
  busy,
}: {
  preview: PreviewState;
  busy: boolean;
}) {
  const { demoUrl, status } = preview;

  return (
    <div className="relative h-full w-full overflow-hidden bg-background-200">
      {/* Preview toolbar */}
      <div className="flex h-10 items-center justify-between border-b border-gray-300 bg-background-100 px-4">
        <div className="flex items-center gap-2 text-[12px] text-gray-700">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
          <span className="truncate font-mono">
            {demoUrl ? new URL(demoUrl).host : "preview"}
          </span>
        </div>
        {status && (
          <Badge
            tone={
              status === "completed"
                ? "success"
                : status === "failed"
                  ? "error"
                  : "warning"
            }
          >
            {status === "pending" && <Spinner className="h-3 w-3" />}
            {status}
          </Badge>
        )}
      </div>

      {/* Preview body */}
      <div className="relative h-[calc(100%-2.5rem)] w-full">
        {demoUrl ? (
          <PreviewIframe key={demoUrl} src={demoUrl} />
        ) : (
          <Placeholder
            label={
              status === "failed"
                ? "Generation failed"
                : busy
                  ? "Building your app…"
                  : "Waiting for the first version…"
            }
            failed={status === "failed"}
          />
        )}
      </div>
    </div>
  );
}

function PreviewIframe({ src }: { src: string }) {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <>
      <iframe
        src={src}
        title="App preview"
        className="h-full w-full border-0 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        onLoad={() => setLoaded(true)}
      />
      {!loaded && <Placeholder label="Loading preview…" />}
    </>
  );
}

function Placeholder({
  label,
  failed = false,
}: {
  label: string;
  failed?: boolean;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background-200">
      {!failed ? (
        <Spinner className="h-6 w-6 text-gray-700" />
      ) : (
        <span className="text-2xl text-red-700" aria-hidden>
          ⚠
        </span>
      )}
      <p className="text-[13px] text-gray-700">{label}</p>
    </div>
  );
}
