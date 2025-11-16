"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadedFileRecord } from "@/lib/canvas/types";
import { Loader2, UploadCloud, FileText, Waves, Trash2 } from "lucide-react";
import { useId } from "react";

const formatBytes = (bytes: number): string => {
  if (!bytes || Number.isNaN(bytes)) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
};

export type UploadsPanelProps = {
  uploads: UploadedFileRecord[];
  isUploading: boolean;
  busyFileIds: Set<string>;
  onSelectFiles: (files: FileList | null) => void;
  onRemoveFile: (file: UploadedFileRecord) => void;
};

export function UploadsPanel({
  uploads,
  isUploading,
  busyFileIds,
  onSelectFiles,
  onRemoveFile,
}: UploadsPanelProps) {
  const inputId = useId();

  return (
    <section className="mb-8 rounded-2xl border bg-card/60 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold">Uploaded files</h3>
          <p className="text-sm text-muted-foreground">
            Share documents or audio clips so the agent can read or transcribe them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            id={inputId}
            type="file"
            className="hidden"
            multiple
            onChange={(event) => {
              onSelectFiles(event.currentTarget.files);
              event.currentTarget.value = "";
            }}
          />
          <Button asChild variant="outline" className="gap-2">
            <label htmlFor={inputId} className="inline-flex items-center gap-2 cursor-pointer">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="h-4 w-4" />
              )}
              {isUploading ? "Uploading..." : "Upload files"}
            </label>
          </Button>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {uploads.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            No files uploaded yet. Drag & drop or click &quot;Upload files&quot; to get started.
            Accepted formats: PDF, TXT, Markdown, MP3, WAV, M4A.
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-background/60">
            {uploads.map((file) => {
              const isBusy = busyFileIds.has(file.id);
              const Icon = file.category === "audio" ? Waves : FileText;
              const hasSummary = Boolean(file.summary);
              const hasTranscript = Boolean(file.transcript);
              return (
                <li key={file.id} className="flex flex-col gap-2 px-4 py-3 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="rounded-full bg-muted/70 p-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-medium leading-tight">{file.originalName}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.category} • {formatBytes(file.size)} • stored at {file.storagePath}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-xs font-semibold capitalize",
                              file.status === "ready" && "bg-green-100 text-green-700",
                              file.status === "processing" && "bg-amber-100 text-amber-700",
                              file.status === "error" && "bg-red-100 text-red-700",
                              file.status === "uploaded" && "bg-blue-100 text-blue-700",
                            )}
                          >
                            {file.status}
                          </span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-slate-900"
                            disabled={isBusy}
                            onClick={() => onRemoveFile(file)}
                          >
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      {(hasSummary || hasTranscript || file.error) && (
                        <div className="mt-2 space-y-2 text-muted-foreground">
                          {hasSummary && (
                            <p className="text-xs leading-snug">
                              <span className="font-semibold text-foreground">Summary:</span> {file.summary}
                            </p>
                          )}
                          {hasTranscript && (
                            <p className="text-xs leading-snug line-clamp-3">
                              <span className="font-semibold text-foreground">Transcript:</span> {file.transcript}
                            </p>
                          )}
                          {file.error && (
                            <p className="text-xs leading-snug text-red-600">
                              <span className="font-semibold">Error:</span> {file.error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

export default UploadsPanel;
