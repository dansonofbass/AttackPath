import type { AnalysisResult, Finding } from "@/lib/types";
import { Badge, Button, Card, Kpis } from "@/components/shared/ui";
export function RemediationPage({
  analysis: a,
  onFinding,
  onTask,
}: {
  analysis: AnalysisResult;
  onFinding: (f: Finding) => void;
  onTask: (f: Finding) => void;
}) {
  return (
    <div className="space-y-5">
      <Kpis
        items={[
          { label: "Corrective actions", value: a.remediation.length },
          {
            label: "Critical priorities",
            value: a.remediation.filter((f) => f.severity === "Critical")
              .length,
            color: "var(--critical)",
          },
          {
            label: "Affected hosts",
            value: new Set(
              a.remediation.flatMap((f) => f.hosts.map((h) => h.ip)),
            ).size,
          },
        ]}
      />
      <Card title="Prioritized corrective actions">
        <p className="mb-4 text-xs text-muted">
          Historical vendor solutions from the legacy sample. Review
          applicability before operational use.
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Finding</th>
                <th>Affected assets</th>
                <th>Recommended remediation</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {a.remediation.map((f) => (
                <tr
                  key={f.id}
                  onClick={() => onFinding(f)}
                  className="cursor-pointer"
                >
                  <td>
                    <Badge severity={f.severity} />
                  </td>
                  <td className="max-w-64">
                    <button
                      className="block max-w-full truncate text-left hover:text-blue"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFinding(f);
                      }}
                    >
                      {f.title}
                    </button>
                    <p className="mt-1 text-muted">
                      Plugin {f.id} · CVSS {f.cvss ?? "N/A"}
                    </p>
                  </td>
                  <td className="technical">
                    {[...new Set(f.hosts.map((h) => h.ip))].join(", ")}
                  </td>
                  <td className="max-w-80">
                    <p className="truncate">{f.solution}</p>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
