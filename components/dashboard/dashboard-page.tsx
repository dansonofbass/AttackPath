import { FileText, Route, ArrowRight, ShieldAlert } from "lucide-react";
import type { AnalysisResult, AppPage, Finding } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Kpis,
  Status,
  TextLink,
} from "@/components/shared/ui";
import { severityCounts, severityColor } from "@/lib/severity";
import { formatDate, formatTime } from "@/lib/format";
import { FindingsTable } from "@/components/findings/findings-page";
export function DashboardPage({
  analysis: a,
  onNavigate,
  onFinding,
  onAsset,
}: {
  analysis: AnalysisResult;
  onNavigate: (p: AppPage) => void;
  onFinding: (f: Finding) => void;
  onAsset: (id: string) => void;
}) {
  const counts = severityCounts(a.findings);
  const observed = a.assets.filter((a) => a.provenance === "Legacy sample");
  const exposure = observed
    .map((asset) => ({
      ...asset,
      counts: severityCounts(
        a.findings.filter((f) => asset.findings.includes(f.id)),
      ),
      score: Math.min(
        100,
        a.findings
          .filter((f) => asset.findings.includes(f.id))
          .reduce(
            (n, f) =>
              n +
              (f.severity === "Critical"
                ? 25
                : f.severity === "High"
                  ? 12
                  : f.severity === "Medium"
                    ? 3
                    : 0),
            0,
          ),
      ),
    }))
    .sort((x, y) => y.score - x.score);
  return (
    <div className="space-y-5">
      <Kpis
        items={[
          {
            label: "Findings",
            value: a.findings.length,
            detail: "Normalized sample evidence",
          },
          {
            label: "Critical",
            value: counts.Critical,
            color: "var(--critical)",
            detail: "Immediate review required",
          },
          {
            label: "High",
            value: counts.High,
            color: "var(--high)",
            detail: "Prioritize remediation",
          },
          {
            label: "Affected hosts",
            value: observed.length,
            detail: "Observed in legacy sample",
          },
          {
            label: "High-risk assets",
            value: observed.filter(
              (x) => x.risk === "Critical" || x.risk === "High",
            ).length,
            detail: "Critical / high exposure",
          },
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {[
          "Nessus",
          "Active Directory",
          "Firewall",
          "SIEM",
          "EDR",
          "Antivirus",
        ].map((name, i) => (
          <button
            key={name}
            onClick={() => onNavigate(i === 0 ? "scans" : "sync")}
            className="rounded-lg border border-border bg-surface p-3.5 text-left hover:border-blue/50"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium">{name}</span>
              <span
                className={`size-1.5 rounded-full ${i === 0 ? "bg-safe" : "bg-blue"}`}
              />
            </div>
            <p className="text-[10px] text-muted">
              {i === 0 ? "Bundled sample evidence" : "Simulated connector"}
            </p>
            <div className="mt-3 h-0.5 bg-border">
              <div className="h-full w-2/3 bg-blue/60" />
            </div>
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card
          title="Latest Report Analysis"
          action={<Status good>Analysis complete</Status>}
        >
          <div className="flex items-start gap-3">
            <FileText size={23} className="shrink-0 text-blue" />
            <div className="min-w-0">
              <p
                className="truncate text-sm font-medium"
                title={a.source.filename}
              >
                {a.source.filename}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {formatDate(a.source.analysisTime)} · Local PDF workspace
              </p>
            </div>
          </div>
          <div className="my-5 grid grid-cols-3 divide-x divide-border rounded-lg border border-border bg-background py-4">
            {[
              ["Findings", a.findings.length],
              ["Affected assets", observed.length],
              ["Attack paths", a.attackPaths.length],
            ].map(([label, n]) => (
              <div className="px-4" key={label}>
                <p className="font-display text-xl">{n}</p>
                <p className="mt-1 text-[10px] text-muted">{label}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3 rounded-md border border-critical/20 bg-critical/5 p-3">
            <ShieldAlert className="shrink-0 text-critical" size={18} />
            <div>
              <p className="text-xs font-medium">
                Priority exposure · MS17-010 / EternalBlue
              </p>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                Plugin 97833 · CVSS 9.8 · TCP/445
                <br />
                192.168.15.112 · 192.168.15.113
              </p>
            </div>
          </div>
          <div className="mt-4">
            <TextLink onClick={() => onNavigate("attack-paths")}>
              Explore attack paths
            </TextLink>
          </div>
        </Card>
        <Card title="Severity profile">
          <div className="space-y-4">
            {(["Critical", "High", "Medium", "Low", "None"] as const).map(
              (s) => (
                <div key={s}>
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="flex items-center gap-2">
                      <span
                        className="size-1.5 rounded-full"
                        style={{ background: severityColor(s) }}
                      />
                      {s === "None" ? "Informational / None" : s}
                    </span>
                    <span>
                      {counts[s]}{" "}
                      <span className="ml-2 text-muted">
                        {Math.round((counts[s] / a.findings.length) * 100)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/50">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(counts[s] / a.findings.length) * 100}%`,
                        background: severityColor(s),
                      }}
                    />
                  </div>
                </div>
              ),
            )}
          </div>
          <p className="mt-5 border-t border-border pt-4 text-[11px] leading-5 text-muted">
            Source severity is preserved. Informational observations provide
            context and are not automatically classified as vulnerabilities.
          </p>
        </Card>
      </div>
      <Card
        title="Priority findings"
        action={
          <TextLink onClick={() => onNavigate("findings")}>
            View all findings
          </TextLink>
        }
      >
        <FindingsTable
          findings={a.remediation.slice(0, 5)}
          onSelect={onFinding}
        />
      </Card>
      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <Card title="Asset exposure">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Critical</th>
                  <th>High</th>
                  <th>Medium</th>
                  <th>Low</th>
                  <th>Total</th>
                  <th>Exposure</th>
                </tr>
              </thead>
              <tbody>
                {exposure.map((x) => (
                  <tr key={x.id}>
                    <td>
                      <button
                        className="technical text-blue"
                        onClick={() => onAsset(x.id)}
                      >
                        {x.ip}
                      </button>
                      <p className="mt-1 text-[10px] text-muted">
                        {x.hostname}
                      </p>
                    </td>
                    <td className="text-critical">{x.counts.Critical}</td>
                    <td className="text-high">{x.counts.High}</td>
                    <td>{x.counts.Medium}</td>
                    <td>{x.counts.Low}</td>
                    <td>{x.findings.length}</td>
                    <td>
                      <Badge severity={x.risk} />
                      <p className="mt-1 text-[10px] text-muted">
                        {x.score}/100 model score
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Analysis activity">
          {[
            "Report imported locally",
            "Sample findings normalized",
            "Affected assets correlated",
            "Critical exposure identified",
            "Attack-path hypotheses generated",
            "Synthetic infrastructure prepared",
            "Remediation priorities calculated",
            "Downloadable report ready",
          ].map((s, i) => (
            <div
              key={s}
              className="flex gap-3 border-b border-border/50 py-2.5 last:border-0"
            >
              <span className="technical text-[10px] text-muted">
                {formatTime(
                  new Date(
                    new Date(a.source.analysisTime).getTime() - (7 - i) * 500,
                  ).toISOString(),
                )}
              </span>
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-blue" />
              <span className="text-xs">{s}</span>
            </div>
          ))}
        </Card>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-blue/25 bg-blue/5 p-5">
        <div className="flex items-center gap-3">
          <Route className="text-blue" size={23} />
          <div>
            <h2 className="text-sm font-medium">
              Understand where exposure could lead.
            </h2>
            <p className="mt-1 text-xs text-muted">
              Explore {a.attackPaths.length} evidence-linked hypotheses and test
              defensive controls.
            </p>
          </div>
        </div>
        <Button onClick={() => onNavigate("what-if")}>
          Open What-If
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
