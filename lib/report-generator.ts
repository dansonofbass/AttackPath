import type {
  AnalysisResult,
  RemediationTask,
  SimulationResult,
} from "./types";
import { severityCounts } from "./severity";
import { exportName } from "./format";
export async function generateReport(
  a: AnalysisResult,
  simulation: SimulationResult | null,
  tasks: RemediationTask[],
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = 26;
  const width = 172;
  const ascii = (s: string) =>
    s
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7E\n]/g, "-");
  const newPage = () => {
    doc.addPage();
    y = 26;
  };
  const line = (text: string, size = 10, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(42, 56, 69);
    const lines = doc.splitTextToSize(ascii(text), width) as string[];
    for (const l of lines) {
      if (y > 270) newPage();
      doc.text(l, 19, y);
      y += size * 0.45 + 1;
    }
    y += 2;
  };
  const heading = (title: string) => {
    if (y > 245) newPage();
    y += 6;
    doc.setDrawColor(200, 212, 222);
    doc.line(19, y - 4, 191, y - 4);
    line(title, 14, true);
  };
  doc.setFillColor(14, 25, 36);
  doc.rect(0, 0, 210, 54, "F");
  doc.setTextColor(232, 237, 242);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(23);
  doc.text("AttackPath AI", 19, 24);
  doc.setFontSize(12);
  doc.setTextColor(118, 183, 232);
  doc.text("SECURITY EXPOSURE ASSESSMENT", 19, 37);
  y = 67;
  line(`Source: ${a.source.filename}`, 12, true);
  line(`Analysis: ${a.source.analysisTime}`);
  line(
    `Uploaded: ${a.source.uploadedAt} | File size: ${a.source.fileSize.toLocaleString()} bytes`,
  );
  line(`SHA-256: ${a.source.sha256}`, 8);
  const counts = severityCounts(a.findings);
  heading("Executive Summary");
  line(
    `The demo model contains ${a.findings.length} findings across ${a.assets.filter((x) => x.provenance === "Legacy sample").length} observed sample hosts, ${a.attackPaths.length} potential attack paths and ${a.assets.filter((x) => x.provenance === "Synthetic").length} synthetic infrastructure assets.`,
  );
  line(
    "Prioritize the critical SMB, Windows DNS and Schannel conditions. Review exposure boundaries, patch applicability and endpoint coverage, then validate corrective actions with an authorized follow-up scan.",
  );
  heading("Severity Summary");
  for (const [s, count] of Object.entries(counts)) line(`${s}: ${count}`, 10);
  line(
    "Source risk ratings and CVSS values are retained independently from the historical sample.",
  );
  heading("Report Notes");
  line(
    "FRONTEND PROTOTYPE. The uploaded PDF is a local workflow trigger; its contents have not been parsed. Observed evidence refers exclusively to the bundled legacy Nessus sample. Infrastructure, source connectors and live events are synthetic. Attack-path progression and impacts are inferred, not proof of compromise. No exploits or network probes are executed. Historical vendor recommendations require current applicability review.",
  );
  newPage();
  heading("Critical Findings");
  for (const f of a.findings.filter((f) => f.severity === "Critical")) {
    line(`${f.id} | ${f.title}`, 11, true);
    line(`Severity: ${f.severity} | CVSS: ${f.cvss ?? "N/A"}`);
    line(`CVEs: ${f.cves.join(", ")}`);
    line(
      `Affected: ${f.hosts.map((h) => `${h.ip} ${h.protocol}/${h.port}`).join(", ")}`,
    );
    line(f.synopsis);
    line(`Solution: ${f.solution}`, 9);
  }
  if (y > 210) newPage();
  heading("Affected Assets");
  for (const asset of a.assets.filter((x) => x.provenance === "Legacy sample"))
    line(
      `${asset.hostname} | ${asset.ip} | ${asset.os} | ${asset.risk} | ${asset.findings.length} findings`,
    );
  heading("Attack Paths");
  for (const path of a.attackPaths) {
    if (y > 230) newPage();
    line(`${path.id} | ${path.title} | ${path.severity}`, 11, true);
    line(
      `Target ${path.target}; source plugin ${path.findingId}; model confidence ${path.confidence}%.`,
      9,
    );
    line(
      "Observed: sample service and finding. Synthetic: entry and boundary. Inferred: access, movement and impact.",
      9,
    );
  }
  newPage();
  heading("Remediation Priorities");
  for (const f of a.remediation) {
    line(`[${f.severity}] ${f.id} - ${f.title}`, 10, true);
    line(f.solution, 9);
  }
  heading("Remediation Work");
  line(
    `${tasks.length} locally tracked tasks; ${tasks.filter((t) => t.status === "Resolved").length} resolved; ${tasks.filter((t) => t.jiraKey).length} linked to mock Jira.`,
  );
  for (const t of tasks)
    line(
      `${t.id}: ${t.summary} | ${t.status} | ${t.assignee} | due ${t.dueDate}`,
      9,
    );
  heading("Simulation Summary");
  if (simulation) {
    line(`${simulation.scenarioId} - ${simulation.scenario}`, 11, true);
    line(
      `Completed ${simulation.completedAt}; reachability ${simulation.reachability}%; residual risk ${simulation.residualRisk}.`,
    );
    line(`Controls: ${simulation.controls.join(", ") || "Baseline (none)"}`);
    line(simulation.reason);
  } else line("No What-If simulation has been run in this workspace.");
  for (let p = 1; p <= doc.getNumberOfPages(); p++) {
    doc.setPage(p);
    if (p > 1) {
      doc.setFontSize(8);
      doc.setTextColor(91, 111, 129);
      doc.text("ATTACKPATH AI / SECURITY EXPOSURE ASSESSMENT", 19, 13);
    }
    doc.setDrawColor(214, 222, 229);
    doc.line(19, 281, 191, 281);
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 130);
    doc.text("Prototype / Legacy sample evidence / Synthetic model", 19, 287);
    doc.text(`${p} / ${doc.getNumberOfPages()}`, 191, 287, { align: "right" });
  }
  return { document: doc, filename: `${exportName(a.source.filename)}.pdf` };
}
