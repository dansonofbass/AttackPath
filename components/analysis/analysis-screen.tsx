"use client";
import {
  CheckCircle2,
  Circle,
  LoaderCircle,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { analysisStages, useReportAnalysis } from "@/hooks/use-report-analysis";
import type { AnalysisResult, AnalysisReport } from "@/lib/types";
import { Button, Kpis } from "@/components/shared/ui";
import { WorkspaceHeader } from "@/components/upload/upload-workspace";
export function AnalysisScreen({
  report,
  result,
  onComplete,
  onOpen,
  onRetry,
  user,
  onSignOut,
}: {
  report: AnalysisReport;
  result: AnalysisResult | null;
  onComplete: (r: AnalysisResult) => void;
  onOpen: () => void;
  onRetry: () => void;
  user: string;
  onSignOut: () => void;
}) {
  const { progress, error, currentStage } = useReportAnalysis(
    report,
    !result,
    onComplete,
  );
  return (
    <main className="workflow-bg min-h-dvh">
      <WorkspaceHeader user={user} onSignOut={onSignOut} />
      <div className="mx-auto max-w-[850px] px-5 py-14">
        <div className="text-center">
          {result ? (
            <ShieldCheck className="mx-auto mb-5 text-safe" size={48} />
          ) : (
            <p className="font-display text-5xl text-blue" aria-live="polite">
              {progress}
              <span className="text-2xl">%</span>
            </p>
          )}
          <h1 className="mt-5 text-2xl font-semibold">
            {result ? "Analysis complete" : "Analyzing vulnerability report"}
          </h1>
          <p className="mt-3 text-sm text-muted">
            {result
              ? "Demo analysis prepared. Generate your security exposure model."
              : "Building security exposure model"}
          </p>
          <p className="mt-3 break-all text-xs text-muted">{report.filename}</p>
        </div>
        <div
          role="progressbar"
          aria-label="Report analysis"
          aria-valuenow={result ? 100 : progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="my-8 h-1.5 overflow-hidden rounded-full bg-panel"
        >
          <div
            className="h-full bg-blue transition-[width] duration-300"
            style={{ width: `${result ? 100 : progress}%` }}
          />
        </div>
        {error ? (
          <div role="alert" className="text-center">
            <p className="mb-4 text-critical">{error}</p>
            <Button onClick={onRetry}>Return to upload</Button>
          </div>
        ) : result ? (
          <div className="enter">
            <Kpis
              items={[
                { label: "Findings", value: result.findings.length },
                {
                  label: "Affected assets",
                  value: result.assets.filter(
                    (a) => a.provenance === "Legacy sample",
                  ).length,
                },
                { label: "Attack paths", value: result.attackPaths.length },
              ]}
            />
            <p className="my-6 text-center text-xs leading-6 text-muted">
              Deterministic legacy sample evidence, synthetic infrastructure,
              and inferred attack relationships.
              <br />
              {"isDemo" in report
                ? "Demo report using sample data. No PDF was uploaded."
                : "The uploaded PDF was not parsed for security findings."}
            </p>
            <div className="text-center">
              <Button variant="primary" onClick={onOpen}>
                Generate Security Model
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {analysisStages.map((s, i) => {
              const done = i < currentStage;
              const active = i === currentStage;
              return (
                <div
                  key={s}
                  className={`flex items-center gap-3 rounded-lg border p-3.5 text-xs ${active ? "border-blue/40 bg-blue/10 text-ink" : "border-transparent text-muted"}`}
                >
                  {done ? (
                    <CheckCircle2 size={17} className="shrink-0 text-safe" />
                  ) : active ? (
                    <LoaderCircle
                      size={17}
                      className="shrink-0 animate-spin text-blue"
                    />
                  ) : (
                    <Circle size={17} className="shrink-0 text-[#455363]" />
                  )}
                  <span>
                    <span className="mr-2 text-[10px] opacity-60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-8 text-center text-[11px] text-muted">
          Simulated analysis pipeline Â· Local processing only
        </p>
      </div>
    </main>
  );
}
