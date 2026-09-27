import type { Finding, Severity } from "./types";
export const severities: Severity[] = [
  "Critical",
  "High",
  "Medium",
  "Low",
  "Info",
  "None",
];
export const severityRank = (s: Severity) => severities.indexOf(s);
export const sortFindings = (a: Finding, b: Finding) =>
  severityRank(a.severity) - severityRank(b.severity) ||
  (b.cvss ?? -1) - (a.cvss ?? -1);
export const severityColor = (s: Severity) =>
  `var(--${s === "None" || s === "Info" ? "text-muted" : s.toLowerCase()})`;
export const severityCounts = (f: Finding[]) =>
  Object.fromEntries(
    severities.map((s) => [s, f.filter((x) => x.severity === s).length]),
  ) as Record<Severity, number>;
