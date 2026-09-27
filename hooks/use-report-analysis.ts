"use client";
import { useEffect, useState } from "react";
import type { AnalysisResult, UploadedReport } from "@/lib/types";
import { fileHash } from "@/lib/file-hash";
export const analysisStages = [
  "Reading PDF report",
  "Validating report structure",
  "Extracting Nessus findings",
  "Normalizing severity, CVE and CVSS data",
  "Discovering affected assets",
  "Mapping exposed services and ports",
  "Correlating infrastructure relationships",
  "Building attack paths",
  "Prioritizing remediation",
  "Preparing defensive simulations",
  "Generating dashboard",
  "Preparing downloadable report",
];
export function useReportAnalysis(
  report: UploadedReport | null,
  running: boolean,
  onComplete: (result: AnalysisResult) => void,
) {
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!running || !report) return;
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const points = [5, 11, 18, 27, 36, 48, 59, 68, 77, 85, 92, 97];
    const metadata = fileHash(report.file);
    points.forEach((p, i) =>
      timers.push(setTimeout(() => setProgress(p), i * 450)),
    );
    timers.push(
      setTimeout(async () => {
        try {
          const sha256 = await metadata;
          const { createDemoAnalysis } = await import("@/lib/demo-data");
          const result = createDemoAnalysis({
            filename: report.filename,
            fileSize: report.size,
            mimeType: report.mimeType,
            uploadedAt: report.uploadedAt,
            analysisTime: new Date().toISOString(),
            sha256,
          });
          if (!cancelled) {
            setProgress(100);
            onComplete(result);
          }
        } catch {
          if (!cancelled)
            setError(
              "Analysis could not complete. Please return to upload and try again.",
            );
        }
      }, 5700),
    );
    metadata.catch(() => {});
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [report, running, onComplete]);
  return {
    progress,
    error,
    currentStage: Math.min(11, Math.floor(progress / 8.34)),
  };
}
