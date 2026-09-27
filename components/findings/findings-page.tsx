"use client";
import { useMemo, useState } from "react";
import type { AnalysisResult, Finding } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Empty,
  SearchField,
} from "@/components/shared/ui";
import { Modal } from "@/components/shared/modal";
import { severities, sortFindings } from "@/lib/severity";
export function FindingsTable({
  findings,
  onSelect,
  onTask,
}: {
  findings: Finding[];
  onSelect: (f: Finding) => void;
  onTask?: (f: Finding) => void;
}) {
  if (!findings.length)
    return (
      <Empty
        title="No findings match your filters"
        detail="Try a different keyword, severity or asset."
      />
    );
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            <th>Severity</th>
            <th>Finding</th>
            <th>Plugin</th>
            <th>CVSS</th>
            <th>Assets</th>
            {onTask && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {findings.map((f) => (
            <tr
              key={f.id}
              onClick={() => onSelect(f)}
              className="cursor-pointer"
            >
              <td>
                <Badge severity={f.severity} />
              </td>
              <td className="max-w-[400px]">
                <button
                  className="block max-w-full truncate text-left font-medium hover:text-blue"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(f);
                  }}
                >
                  {f.title}
                </button>
                <p className="mt-1 max-w-[350px] truncate text-[10px] text-muted">
                  {f.cves.join(" · ") || "No CVE listed"}
                </p>
              </td>
              <td className="technical text-muted">{f.id}</td>
              <td className="font-mono">{f.cvss?.toFixed(1) ?? "—"}</td>
              <td>{new Set(f.hosts.map((h) => h.ip)).size}</td>
              {onTask && (
                <td>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTask(f);
                    }}
                  >
                    Create Task
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function FindingDetail({
  finding: f,
  onClose,
  onTask,
}: {
  finding: Finding;
  onClose: () => void;
  onTask: (f: Finding) => void;
}) {
  return (
    <Modal title={f.title} onClose={onClose}>
      <div className="mb-5 flex flex-wrap gap-3">
        <Badge severity={f.severity} />
        <span className="technical">Plugin {f.id}</span>
        <span className="technical">CVSS {f.cvss ?? "N/A"}</span>
      </div>
      <p className="mb-6 text-xs text-muted">
        Observed evidence in the bundled legacy Nessus sample. Historical source
        severity and remediation are retained.
      </p>
      <h3 className="mb-2 text-sm font-semibold">Affected hosts & services</h3>
      <div className="mb-5 flex flex-wrap gap-2">
        {f.hosts.map((h) => (
          <span
            key={`${h.ip}-${h.protocol}-${h.port}`}
            className="technical rounded border border-border bg-background px-2 py-1"
          >
            {h.ip} · {h.protocol.toUpperCase()}/{h.port}
          </span>
        ))}
      </div>
      {[
        ["CVEs", f.cves.join(", ") || "None listed"],
        ["Synopsis", f.synopsis],
        ["Description", f.description],
        ["Recommended solution", f.solution],
      ].map(([label, value]) => (
        <section key={label} className="mb-5">
          <h3 className="mb-2 text-sm font-semibold">{label}</h3>
          <p className="whitespace-pre-wrap text-sm leading-7 text-muted">
            {value}
          </p>
        </section>
      ))}
      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button onClick={onClose}>Close</Button>
        <Button variant="primary" onClick={() => onTask(f)}>
          Create Remediation Task
        </Button>
      </div>
    </Modal>
  );
}
export function FindingsPage({
  analysis,
  onSelect,
  onTask,
}: {
  analysis: AnalysisResult;
  onSelect: (f: Finding) => void;
  onTask: (f: Finding) => void;
}) {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("All");
  const [asset, setAsset] = useState("All");
  const filtered = useMemo(
    () =>
      analysis.findings
        .filter(
          (f) =>
            (severity === "All" || f.severity === severity) &&
            (asset === "All" || f.hosts.some((h) => h.ip === asset)) &&
            JSON.stringify(f).toLowerCase().includes(query.toLowerCase()),
        )
        .sort(sortFindings),
    [analysis, query, severity, asset],
  );
  return (
    <Card>
      <div className="mb-5 flex flex-wrap gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search finding, plugin, CVE, IP or port"
        />
        <label>
          <span className="sr-only">Severity</span>
          <select
            className="field"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="All">All severities</option>
            {severities.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Asset</span>
          <select
            className="field"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
          >
            <option value="All">All assets</option>
            {analysis.assets
              .filter((a) => a.provenance === "Legacy sample")
              .map((a) => (
                <option key={a.id}>{a.ip}</option>
              ))}
          </select>
        </label>
      </div>
      <div className="mb-3 flex justify-between text-xs text-muted">
        <span>{filtered.length} findings</span>
        <span>Severity → CVSS descending</span>
      </div>
      <FindingsTable findings={filtered} onSelect={onSelect} onTask={onTask} />
    </Card>
  );
}
