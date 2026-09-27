"use client";
import { Copy, FileText } from "lucide-react";
import type { AnalysisResult, Finding } from "@/lib/types";
import { Button, Card, Status } from "@/components/shared/ui";
import { formatDate, formatSize } from "@/lib/format";
import { FindingsPage } from "@/components/findings/findings-page";
export function ScansPage({
  analysis: a,
  onFinding,
  onTask,
  notify,
}: {
  analysis: AnalysisResult;
  onFinding: (f: Finding) => void;
  onTask: (f: Finding) => void;
  notify: (s: string) => void;
}) {
  return (
    <div className="space-y-5">
      <Card
        title="Current Vulnerability Scan"
        action={<Status good>Analyzed</Status>}
      >
        <div className="flex items-start gap-4">
          <FileText size={34} className="shrink-0 text-blue" />
          <div className="min-w-0">
            <h2 className="break-all font-medium">{a.source.filename}</h2>
            <p className="mt-2 text-xs text-muted">
              Imported PDF · {formatSize(a.source.fileSize)} · Demo analysis
            </p>
          </div>
        </div>
        <dl className="mt-6 grid gap-5 text-xs sm:grid-cols-3">
          {[
            ["Uploaded", formatDate(a.source.uploadedAt)],
            ["Analyzed", formatDate(a.source.analysisTime)],
            [
              "Evidence",
              `${a.findings.length} findings · 5 legacy sample hosts`,
            ],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="mb-2 text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex items-center gap-3 rounded-md border border-border bg-background p-3">
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-1">Local SHA-256</p>
            <p className="technical break-all">{a.source.sha256}</p>
          </div>
          <Button
            aria-label="Copy SHA-256"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(a.source.sha256);
                notify("SHA-256 copied.");
              } catch {
                notify("Copy unavailable. Select and copy the hash manually.");
              }
            }}
          >
            <Copy size={14} />
          </Button>
        </div>
      </Card>
      <FindingsPage analysis={a} onSelect={onFinding} onTask={onTask} />
    </div>
  );
}
