"use client";
import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  ScanSearch,
  ArrowRight,
  Network,
  Route,
  Play,
} from "lucide-react";
import { Button, Logo } from "@/components/shared/ui";
import { validatePdf } from "@/lib/file-validation";
import { formatSize } from "@/lib/format";
import type { UploadedReport } from "@/lib/types";
export function WorkspaceHeader({
  user,
  onSignOut,
}: {
  user: string;
  onSignOut: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-10">
      <Logo compact />
      <div className="flex items-center gap-4">
        <span className="hidden text-xs text-muted sm:block">{user}</span>
        <Button variant="ghost" onClick={onSignOut}>
          Sign Out
        </Button>
      </div>
    </header>
  );
}
export function UploadWorkspace({
  report,
  onSelect,
  onAnalyze,
  onDemo,
  user,
  onSignOut,
}: {
  report: UploadedReport | null;
  onSelect: (r: UploadedReport | null) => void;
  onAnalyze: () => void;
  onDemo: () => void;
  user: string;
  onSignOut: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState("");
  const select = (file: File | undefined) => {
    const result = validatePdf(file);
    if (!result.valid) {
      setError(result.error!);
      return;
    }
    setError("");
    onSelect({
      file: file!,
      filename: file!.name,
      size: file!.size,
      mimeType: file!.type || "application/pdf",
      uploadedAt: new Date().toISOString(),
    });
  };
  return (
    <main className="workflow-bg min-h-dvh">
      <WorkspaceHeader user={user} onSignOut={onSignOut} />
      <div className="enter mx-auto max-w-[850px] px-5 pb-12 pt-16 sm:pt-24">
        <div className="mb-9">
          <p className="eyebrow mb-4 text-blue">Vulnerability analysis</p>
          <h1 className="max-w-2xl text-3xl font-semibold leading-[1.18] tracking-tight sm:text-[42px]">
            Turn vulnerability reports
            <br className="hidden sm:block" /> into attack paths.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-muted">
            Upload a PDF report to explore vulnerability insights, affected
            assets, infrastructure relationships, attack paths and remediation
            priorities.
          </p>
        </div>
        <section className="mb-5 flex flex-col gap-4 rounded-xl border border-violet-400/25 bg-violet-400/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-medium text-violet-200">
              No PDF? Explore the demo.
            </h2>
            <p className="mt-2 text-xs leading-5 text-muted">
              Watch a sample analysis and explore the report. No upload
              required.
            </p>
          </div>
          <button
            type="button"
            onClick={onDemo}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-violet-300/40 bg-violet-300 px-4 py-3 text-xs font-semibold text-[#211338] transition-colors hover:bg-violet-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-300"
          >
            <Play size={15} />
            View Demo Report
            <ArrowRight size={15} />
          </button>
        </section>
        <input
          ref={input}
          className="sr-only"
          tabIndex={-1}
          type="file"
          aria-label="Select PDF report"
          accept=".pdf,application/pdf"
          onChange={(e) => {
            select(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {report ? (
          <section className="rounded-xl border border-blue/30 bg-surface p-6">
            <div className="flex items-start gap-4">
              <FileText className="shrink-0 text-blue" size={35} />
              <div className="min-w-0 flex-1">
                <h2 className="break-all font-medium">{report.filename}</h2>
                <p className="mt-2 text-xs text-muted">
                  {formatSize(report.size)} Â· PDF Document
                </p>
                <p className="mt-3 text-xs text-safe">Ready for analysis</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  onSelect(null);
                  setError("");
                }}
              >
                Remove
              </Button>
            </div>
            <div className="mt-6 flex justify-end border-t border-border pt-5">
              <Button variant="primary" onClick={onAnalyze}>
                <ScanSearch size={16} />
                Analyze Report
                <ArrowRight size={15} />
              </Button>
            </div>
          </section>
        ) : (
          <button
            onClick={() => input.current?.click()}
            onDragEnter={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node))
                setDrag(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              if (e.dataTransfer.files.length !== 1) {
                setError("Select one PDF report at a time.");
                return;
              }
              select(e.dataTransfer.files[0]);
            }}
            className={`flex w-full flex-col items-center rounded-xl border border-dashed px-6 py-14 transition-colors ${drag ? "border-blue bg-blue/10" : "border-[#3b4e5f] bg-surface/70 hover:border-blue hover:bg-surface"}`}
          >
            <div className="mb-5 flex size-14 items-center justify-center rounded-xl border border-border bg-panel">
              <UploadCloud size={27} strokeWidth={1.5} className="text-blue" />
            </div>
            <span className="text-base font-medium">
              Drop your PDF report here
            </span>
            <span className="mt-2 text-sm text-muted">
              or <span className="text-blue">click to browse</span>
            </span>
            <span className="mt-6 text-[11px] text-muted">
              PDF only Â· Maximum 25 MB
            </span>
          </button>
        )}
        {error && (
          <p role="alert" className="mt-3 text-sm text-critical">
            {error}
          </p>
        )}
        <div className="mt-5 flex items-start gap-2 text-xs leading-5 text-muted">
          <ShieldCheck size={17} className="shrink-0 text-safe" />
          <p>
            <b className="font-medium text-ink">Prototype mode.</b> Uploaded
            files remain in this browser and are not transmitted to a server.
            Any valid PDF starts a simulated analysis using the bundled security
            demo dataset; PDF contents are not parsed.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 border-t border-border pt-7 sm:grid-cols-3">
          {[
            [
              ScanSearch,
              "Understand exposure",
              "Inspect normalized vulnerability evidence.",
            ],
            [
              Network,
              "Connect the context",
              "Explore a synthetic infrastructure model.",
            ],
            [
              Route,
              "Prioritize the response",
              "Test controls and track remediation.",
            ],
          ].map(([Icon, title, detail]) => {
            const I = Icon as typeof ScanSearch;
            return (
              <div key={String(title)}>
                <I size={18} className="mb-3 text-muted" />
                <h3 className="text-xs font-medium">{String(title)}</h3>
                <p className="mt-2 text-xs leading-5 text-muted">
                  {String(detail)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
