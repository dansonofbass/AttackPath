"use client";
import { useEffect, useRef, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import type { AnalysisResult, SimulationResult } from "@/lib/types";
import { controls, scenarios, simulate } from "@/lib/demo-data/simulation";
import { Badge, Button, Card, Kpis, Notice } from "@/components/shared/ui";
import { PathGraph } from "@/components/attack-paths/attack-paths-page";
export function WhatIfPage({
  analysis: a,
  lastResult,
  onResult,
}: {
  analysis: AnalysisResult;
  lastResult: SimulationResult | null;
  onResult: (s: SimulationResult) => void;
}) {
  const [scenario, setScenario] = useState(
    lastResult
      ? Math.max(
          0,
          scenarios.findIndex((s) => s.id === lastResult.scenarioId),
        )
      : 0,
  );
  const [enabled, setEnabled] = useState<string[]>(lastResult?.controls ?? []);
  const [result, setResult] = useState<SimulationResult | null>(lastResult);
  const [active, setActive] = useState(lastResult ? 6 : -1);
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearInterval(timer.current);
    },
    [],
  );
  const reset = () => {
    if (timer.current) clearInterval(timer.current);
    setRunning(false);
    setActive(-1);
    setResult(null);
  };
  const path = a.attackPaths.find((p) => p.id === scenarios[scenario].path)!;
  const run = () => {
    reset();
    const next = simulate(scenario, enabled, new Date().toISOString());
    setResult(next);
    setRunning(true);
    setActive(0);
    let i = 0;
    const stop = next.blockedAt ?? 6;
    timer.current = setInterval(() => {
      i++;
      setActive(i);
      if (i >= stop) {
        clearInterval(timer.current!);
        setRunning(false);
        onResult({ ...next, completedAt: new Date().toISOString() });
      }
    }, 400);
  };
  return (
    <div className="space-y-5">
      <Notice>
        <b className="text-ink">Defensive, non-executing graph simulation.</b>{" "}
        No packets, exploits, credentials or target connections. Results
        describe modeled reachability, not confirmed compromise.
      </Notice>
      <div className="grid items-start gap-4 xl:grid-cols-[310px_minmax(0,1fr)]">
        <Card title="Scenario builder">
          <label className="text-xs">
            Scenario
            <select
              className="field mt-2"
              value={scenario}
              onChange={(e) => {
                reset();
                setScenario(Number(e.target.value));
              }}
            >
              {scenarios.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.id} · {s.name}
                </option>
              ))}
            </select>
          </label>
          <div className="my-5 space-y-2">
            {controls.map((c) => (
              <label
                key={c.id}
                className={`flex items-start justify-between gap-3 rounded-md border p-3 text-xs leading-5 ${enabled.includes(c.id) ? "border-blue/40 bg-blue/5" : "border-border bg-background"}`}
              >
                <span>
                  {c.label}
                  {!c.scenarios.includes(scenario) && (
                    <span className="block text-[10px] text-muted">
                      Not relevant to this scenario
                    </span>
                  )}
                </span>
                <input
                  type="checkbox"
                  className="mt-1 shrink-0"
                  checked={enabled.includes(c.id)}
                  onChange={(e) => {
                    reset();
                    setEnabled((v) =>
                      e.target.checked
                        ? [...v, c.id]
                        : v.filter((x) => x !== c.id),
                    );
                  }}
                />
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                reset();
                setEnabled([]);
              }}
            >
              Baseline
            </Button>
            <Button
              onClick={() => {
                reset();
                setEnabled(controls.map((c) => c.id));
              }}
            >
              Hardened
            </Button>
            <Button
              aria-label="Reset simulation"
              onClick={() => {
                reset();
                setEnabled([]);
              }}
            >
              <RotateCcw size={14} />
            </Button>
          </div>
          <Button
            className="mt-3 w-full"
            variant="primary"
            disabled={running}
            onClick={run}
          >
            <Play size={14} />
            {running ? "Simulating…" : "Run Simulation"}
          </Button>
        </Card>
        <div className="min-w-0 space-y-4">
          <Card
            title={`${scenarios[scenario].id} · ${scenarios[scenario].name}`}
          >
            <div className="mb-5 flex items-center justify-between text-xs">
              <span className="text-muted">
                {running
                  ? "Traversing modeled relationships"
                  : result
                    ? "Simulation complete"
                    : "Ready to simulate"}
              </span>
              {result && !running && <Badge severity={result.residualRisk} />}
            </div>
            <PathGraph
              stages={path.stages}
              active={active}
              blockedAt={result?.blockedAt ?? null}
            />
            <p className="mt-4 text-xs leading-6 text-muted">
              {result && !running
                ? result.reason
                : "Enable defensive controls, then run a traversal to identify where the path can be interrupted."}
            </p>
          </Card>
          <Kpis
            items={[
              {
                label: "Reachability",
                value: result && !running ? `${result.reachability}%` : "—",
              },
              {
                label: "Residual risk",
                value: result && !running ? result.residualRisk : "—",
              },
              {
                label: "Blocked stages",
                value:
                  result && !running
                    ? `${result.blockedAt === null ? 0 : 7 - result.blockedAt}/7`
                    : "—",
              },
              { label: "Controls applied", value: enabled.length },
              {
                label: "Observed evidence",
                value: 2,
                detail: "Bundled legacy sample stages",
              },
            ]}
          />
          <Card title="Simulation event log">
            <div
              aria-live="polite"
              className="space-y-3 font-mono text-[11px] leading-5 text-muted"
            >
              {active < 0 ? (
                <p>No simulation run. Select a scenario and controls.</p>
              ) : (
                path.stages
                  .slice(0, Math.min(active + 1, (result?.blockedAt ?? 6) + 1))
                  .map((s, i) => (
                    <p key={s.id}>
                      <span
                        className={
                          result?.blockedAt === i ? "text-high" : "text-blue"
                        }
                      >
                        {result?.blockedAt === i ? "BLOCKED" : "REACHED"}
                      </span>{" "}
                      · {s.label} · {s.title} [{s.evidenceType}]
                    </p>
                  ))
              )}
              {result && !running && (
                <p className="border-t border-border pt-3">{result.reason}</p>
              )}
            </div>
          </Card>
          <Card title="Model interpretation">
            <p className="text-xs leading-6 text-muted">
              {path.interpretation} Source finding: Plugin {path.findingId}.
              Unrelated controls do not alter the result. Residual risk and
              reachability are illustrative graph metrics, not a probability of
              exploitation.
            </p>
          </Card>
        </div>
      </div>
      <Card title="Control effect matrix">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Control</th>
                <th>Effect</th>
                <th>Attack stage</th>
                <th>Relevant scenarios</th>
              </tr>
            </thead>
            <tbody>
              {controls.map((c) => (
                <tr key={c.id}>
                  <td>{c.label}</td>
                  <td>{c.effect}</td>
                  <td>
                    {
                      ["Entry", "Boundary", "Service", "Condition", "Movement"][
                        c.stage
                      ]
                    }
                  </td>
                  <td className="technical">
                    {c.scenarios.map((i) => scenarios[i].id).join(", ")}
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
