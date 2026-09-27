"use client";
import { useState } from "react";
import type { AnalysisResult, AttackPathStage, Finding } from "@/lib/types";
import { Badge, Button, Card, Kpis, Notice } from "@/components/shared/ui";
export function PathGraph({
  stages,
  active = -1,
  blockedAt = null,
  onStage,
}: {
  stages: AttackPathStage[];
  active?: number;
  blockedAt?: number | null;
  onStage?: (stage: AttackPathStage) => void;
}) {
  return (
    <div className="graph-grid overflow-x-auto rounded-lg border border-border bg-background">
      <svg
        viewBox={`0 0 ${stages.length * 180 + 20} 200`}
        className="min-w-[1050px] w-full"
        role="img"
        aria-label="Attack path: solid observed evidence, dashed inferred or synthetic relationships"
      >
        <defs>
          <marker
            id="path-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0 0L10 5L0 10" fill="#54748d" />
          </marker>
        </defs>
        {stages.map((s, i) => {
          const x = i * 180 + 20;
          const blocked = blockedAt === i && active >= i;
          const protectedNode =
            blockedAt !== null && i > blockedAt && active >= blockedAt;
          const color = blocked
            ? "var(--high)"
            : protectedNode
              ? "var(--safe)"
              : active === i
                ? "var(--blue-light)"
                : s.evidenceType === "observed"
                  ? "var(--critical)"
                  : "#486078";
          return (
            <g key={s.id}>
              {i > 0 && (
                <line
                  x1={x - 28}
                  x2={x - 4}
                  y1={95}
                  y2={95}
                  stroke="#54748d"
                  strokeDasharray={s.evidenceType === "observed" ? "" : "4 4"}
                  markerEnd="url(#path-arrow)"
                />
              )}
              <g
                role={onStage ? "button" : undefined}
                tabIndex={onStage ? 0 : undefined}
                aria-label={`${s.label}: ${s.title}, ${s.evidenceType}`}
                onClick={() => onStage?.(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onStage?.(s);
                  }
                }}
                className={
                  onStage
                    ? "cursor-pointer outline-none focus:brightness-150"
                    : ""
                }
              >
                <rect
                  x={x}
                  y={42}
                  width={152}
                  height={108}
                  rx={7}
                  fill="#111922"
                  stroke={color}
                  strokeWidth={active === i ? 2 : 1.3}
                  strokeDasharray={s.evidenceType === "observed" ? "" : "5 4"}
                />
                <text
                  x={x + 12}
                  y={65}
                  fill="#8f9cab"
                  fontSize={8}
                  letterSpacing={1}
                >
                  {String(i + 1).padStart(2, "0")} · {s.label}
                </text>
                <text x={x + 12} y={91} fill="#e8edf2" fontSize={11}>
                  {s.title.slice(0, 23)}
                </text>
                <text x={x + 12} y={112} fill="#8f9cab" fontSize={8}>
                  {s.detail.slice(0, 30)}
                </text>
                <text x={x + 12} y={135} fill={color} fontSize={8}>
                  {blocked
                    ? "BLOCKED"
                    : protectedNode
                      ? "PROTECTED"
                      : active >= i && active >= 0
                        ? "REACHED"
                        : s.evidenceType.toUpperCase()}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function AttackPathsPage({
  analysis: a,
  onFinding,
}: {
  analysis: AnalysisResult;
  onFinding: (f: Finding) => void;
}) {
  const [selected, setSelected] = useState(a.attackPaths[0].id);
  const [stage, setStage] = useState<AttackPathStage | null>(null);
  const p = a.attackPaths.find((p) => p.id === selected)!;
  const f = a.findings.find((f) => f.id === p.findingId)!;
  return (
    <div className="space-y-5">
      <Kpis
        items={[
          { label: "Total paths", value: a.attackPaths.length },
          {
            label: "Critical",
            value: a.attackPaths.filter((p) => p.severity === "Critical")
              .length,
            color: "var(--critical)",
          },
          {
            label: "High",
            value: a.attackPaths.filter((p) => p.severity === "High").length,
            color: "var(--high)",
          },
          {
            label: "Observed evidence",
            value: p.stages.filter((s) => s.evidenceType === "observed").length,
            detail: "Selected path stages",
          },
          {
            label: "Inferred steps",
            value: p.stages.filter((s) => s.evidenceType === "inferred").length,
            detail: "Selected path stages",
          },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card title="Path library">
          <div className="max-h-[680px] space-y-2 overflow-y-auto">
            {a.attackPaths.map((path) => (
              <button
                key={path.id}
                onClick={() => {
                  setSelected(path.id);
                  setStage(null);
                }}
                className={`w-full rounded-lg border p-3 text-left ${selected === path.id ? "border-blue/60 bg-blue/10" : "border-border bg-background hover:border-blue/40"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-[10px] text-blue">
                    {path.id}
                  </span>
                  <Badge severity={path.severity} />
                </div>
                <p className="mt-2 text-xs font-medium">{path.title}</p>
                <p className="technical mt-2 text-[10px] text-muted">
                  {path.target}
                </p>
              </button>
            ))}
          </div>
        </Card>
        <div className="min-w-0 space-y-4">
          <Card
            title={`${p.id} · ${p.title}`}
            action={<Button onClick={() => onFinding(f)}>Open finding</Button>}
          >
            <div className="mb-5 flex flex-wrap gap-4 text-xs text-muted">
              <span>
                Target <b className="technical text-ink">{p.target}</b>
              </span>
              <span>
                Model confidence <b className="text-ink">{p.confidence}%</b>
              </span>
              <Badge severity={p.severity} />
            </div>
            <PathGraph
              stages={p.stages}
              onStage={(s) => {
                setStage(s);
              }}
            />
            <div className="my-4 flex flex-wrap gap-5 text-[10px] text-muted">
              <span>━━ Observed in legacy sample</span>
              <span>┄┄ Inferred / synthetic relationship</span>
            </div>
            {stage && (
              <Notice>
                <b className="text-ink">
                  {stage.label}: {stage.title}
                </b>{" "}
                · {stage.detail} · {stage.evidenceType}
              </Notice>
            )}
            <p className="mt-4 text-xs leading-6 text-muted">
              {p.interpretation}
            </p>
          </Card>
          <Card title="Evidence & interpretation">
            <div className="mb-4 flex flex-wrap gap-3 text-xs">
              <span>
                Plugin <b>{f.id}</b>
              </span>
              <span>
                CVSS <b>{f.cvss ?? "N/A"}</b>
              </span>
              <span>{f.cves.join(" · ") || "No CVE listed"}</span>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Stage</th>
                    <th>Type</th>
                    <th>Source</th>
                    <th>Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {p.stages.map((s) => (
                    <tr key={s.id}>
                      <td>{s.label}</td>
                      <td
                        className={
                          s.evidenceType === "observed"
                            ? "text-blue"
                            : "text-muted"
                        }
                      >
                        {s.evidenceType}
                      </td>
                      <td>
                        {s.evidenceType === "observed"
                          ? `Legacy plugin ${f.id}`
                          : "Synthetic model"}
                      </td>
                      <td>{s.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
