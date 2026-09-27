"use client";
import { useState } from "react";
import {
  Download,
  FileText,
  Braces,
  Table2,
  AlignLeft,
  LoaderCircle,
} from "lucide-react";
import type {
  AnalysisResult,
  RemediationTask,
  SimulationResult,
} from "@/lib/types";
import { Button, Card, Notice, Status } from "@/components/shared/ui";
import { downloadJson } from "@/lib/export-json";
import { downloadCsv } from "@/lib/export-csv";
import { downloadTxt } from "@/lib/export-txt";
import { formatDate, formatSize } from "@/lib/format";
export function ReportsPage({
  analysis: a,
  simulation,
  tasks,
  notify,
}: {
  analysis: AnalysisResult;
  simulation: SimulationResult | null;
  tasks: RemediationTask[];
  notify: (s: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const pdf = async () => {
    setBusy(true);
    try {
      const { generateReport } = await import("@/lib/report-generator");
      const r = await generateReport(a, simulation, tasks);
      r.document.save(r.filename);
      notify("Security assessment PDF exported.");
    } catch {
      notify("PDF export failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <Card
        title="Current analysis"
        action={<Status good>Ready to export</Status>}
      >
        <h2 className="break-all text-lg font-medium">{a.source.filename}</h2>
        <p className="mt-3 text-xs text-muted">
          {formatSize(a.source.fileSize)} · Analyzed{" "}
          {formatDate(a.source.analysisTime)}
        </p>
        <p className="mt-4 text-xs">
          {a.findings.length} findings · {a.attackPaths.length} attack paths ·{" "}
          {tasks.length} remediation tasks
        </p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-blue/40">
          <FileText size={28} className="text-blue" />
          <p className="eyebrow mt-5">Security assessment</p>
          <h2 className="mt-2 text-lg font-semibold">
            A complete view of your exposure model.
          </h2>
          <p className="my-4 text-xs leading-6 text-muted">
            Executive summary, severity profile, critical findings, affected
            assets, attack paths, prioritized remediation and your latest
            simulation. Paginated and ready to share.
          </p>
          <Button variant="primary" disabled={busy} onClick={pdf}>
            {busy ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}{" "}
            {busy ? "Preparing PDF…" : "Download Security Assessment"}
          </Button>
        </Card>
        <div className="space-y-4">
          {[
            {
              title: "JSON Export",
              detail:
                "Normalized analysis, infrastructure, tasks and latest simulation.",
              Icon: Braces,
              action: () =>
                downloadJson(a.source.filename, { ...a, simulation, tasks }),
            },
            {
              title: "CSV Export",
              detail:
                "One row per finding, including CVEs, hosts, ports and solution.",
              Icon: Table2,
              action: () => downloadCsv(a),
            },
            {
              title: "Text Report",
              detail: "Readable remediation priorities with source metadata.",
              Icon: AlignLeft,
              action: () => downloadTxt(a, simulation),
            },
          ].map(({ title, detail, Icon, action }) => (
            <Card key={title}>
              <div className="flex items-center gap-4">
                <Icon size={23} className="shrink-0 text-blue" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-medium">{title}</h2>
                  <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
                </div>
                <Button
                  onClick={() => {
                    action();
                    notify(`${title} downloaded.`);
                  }}
                  aria-label={`Download ${title}`}
                >
                  <Download size={15} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Notice>
        Exports include actual uploaded-file metadata and deterministic demo
        security data. The uploaded PDF is not parsed. Observed legacy evidence,
        synthetic context, inferred relationships and What-If results are
        labeled separately.
      </Notice>
    </div>
  );
}
