import type { AnalysisResult } from "./types";
import { download } from "./download";
import { exportName } from "./format";
export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return (
    '"' +
    (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replaceAll('"', '""') +
    '"'
  );
}
export function findingsCsv(a: AnalysisResult) {
  const rows = [
    [
      "Plugin",
      "Title",
      "Severity",
      "CVSS",
      "CVEs",
      "Hosts",
      "Ports",
      "Solution",
      "Uploaded source",
      "Analysis timestamp",
      "Evidence origin",
    ],
    ...a.findings.map((f) => [
      f.id,
      f.title,
      f.severity,
      f.cvss,
      f.cves.join("; "),
      [...new Set(f.hosts.map((h) => h.ip))].join("; "),
      f.hosts.map((h) => `${h.ip} ${h.protocol}/${h.port}`).join("; "),
      f.solution,
      a.source.filename,
      a.source.analysisTime,
      f.provenance,
    ]),
  ];
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
}
export function downloadCsv(a: AnalysisResult) {
  download(
    `${exportName(a.source.filename)}.csv`,
    "\uFEFF" + findingsCsv(a),
    "text/csv;charset=utf-8",
  );
}
