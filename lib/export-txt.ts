import type { AnalysisResult, SimulationResult } from "./types";
import { download } from "./download";
import { exportName } from "./format";
export function textReport(
  a: AnalysisResult,
  simulation: SimulationResult | null,
) {
  return [
    `AttackPath AI - Remediation Report`,
    `Source: ${a.source.filename}`,
    `Uploaded: ${a.source.uploadedAt}`,
    `Analyzed: ${a.source.analysisTime}`,
    `SHA-256: ${a.source.sha256}`,
    `Findings: ${a.findings.length}; observed sample hosts: ${a.assets.filter((x) => x.provenance === "Legacy sample").length}`,
    `PROTOTYPE: PDF contents were not parsed. Findings come from the bundled legacy Nessus sample; infrastructure and relationships are synthetic. Historical vendor solutions require review.`,
    ...a.remediation.map(
      (f) =>
        `\n[${f.severity}] Plugin ${f.id} - ${f.title}\nCVSS: ${f.cvss ?? "N/A"}\nCVEs: ${f.cves.join(", ") || "None"}\nHosts: ${f.hosts.map((h) => `${h.ip} ${h.protocol}/${h.port}`).join(", ")}\nSolution: ${f.solution}`,
    ),
    `\nSimulation: ${simulation ? `${simulation.scenario}; reachability ${simulation.reachability}%; residual risk ${simulation.residualRisk}; ${simulation.reason}` : "No simulation has been run."}`,
  ].join("\n");
}
export function downloadTxt(a: AnalysisResult, s: SimulationResult | null) {
  download(`${exportName(a.source.filename)}.txt`, textReport(a, s));
}
