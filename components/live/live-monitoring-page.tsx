"use client";
import { useState } from "react";
import { Pause, Play, Plus, Trash2, Route } from "lucide-react";
import type { AnalysisResult, AppPage } from "@/lib/types";
import { incidents } from "@/lib/demo-data/incidents";
import { useLiveMonitor } from "@/hooks/use-live-monitor";
import {
  Badge,
  Button,
  Card,
  Empty,
  Kpis,
  Notice,
  Status,
} from "@/components/shared/ui";
import { PathGraph } from "@/components/attack-paths/attack-paths-page";
import { formatTime } from "@/lib/format";
export function LiveMonitoringPage({
  analysis: a,
  onNavigate,
}: {
  analysis: AnalysisResult;
  onNavigate: (p: AppPage) => void;
}) {
  const monitor = useLiveMonitor();
  const [selected, setSelected] = useState(incidents[0]);
  const path = a.attackPaths.find((p) => p.id === selected.pathId)!;
  return (
    <div className="space-y-5">
      <Notice>
        <b className="text-ink">PROTOTYPE LIVE MODE</b> · Events are synthetic
        and non-executing. No traffic is generated and no real systems are
        contacted.
      </Notice>
      <div className="flex flex-wrap items-center gap-3">
        <Status good={!monitor.paused}>
          {monitor.paused ? "Stream paused" : "Simulated event stream"}
        </Status>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={monitor.auto}
            onChange={(e) => monitor.setAuto(e.target.checked)}
          />
          Auto Refresh
        </label>
        <Button onClick={monitor.inject}>
          <Plus size={14} />
          Inject Mock Event
        </Button>
        <Button onClick={() => monitor.setPaused((x) => !x)}>
          {monitor.paused ? <Play size={14} /> : <Pause size={14} />}{" "}
          {monitor.paused ? "Resume" : "Pause"}
        </Button>
        <Button onClick={monitor.clear}>
          <Trash2 size={14} />
          Clear Feed
        </Button>
        <Button onClick={() => onNavigate("attack-paths")}>
          <Route size={14} />
          Open Attack Paths
        </Button>
      </div>
      <Kpis
        items={[
          {
            label: "Events / min",
            value: monitor.rate,
            detail: "Events in last 60 seconds",
          },
          {
            label: "Active detections",
            value: incidents.filter((i) => i.status === "ACTIVE").length,
          },
          { label: "Correlated paths", value: incidents.length },
          {
            label: "High-risk assets",
            value: a.assets.filter(
              (x) =>
                x.provenance === "Legacy sample" &&
                ["Critical", "High"].includes(x.risk),
            ).length,
          },
          {
            label: "Last event",
            value: monitor.events[0] ? formatTime(monitor.events[0].time) : "—",
          },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Card title="Active incidents">
          <div className="space-y-3">
            {incidents.map((i) => (
              <button
                key={i.id}
                onClick={() => setSelected(i)}
                className={`w-full rounded-lg border p-3 text-left ${i.id === selected.id ? "border-blue bg-blue/10" : "border-border bg-background"}`}
              >
                <div className="flex justify-between gap-2">
                  <span className="technical text-blue">{i.id}</span>
                  <Badge severity={i.severity} />
                </div>
                <p className="my-3 text-xs font-medium">{i.title}</p>
                <p className="technical text-muted">{i.asset}</p>
                <div className="mt-3 flex justify-between text-[10px] text-muted">
                  <span>{i.status}</span>
                  <span>{i.confidence}% confidence</span>
                </div>
              </button>
            ))}
          </div>
        </Card>
        <div className="min-w-0 space-y-4">
          <Card
            title={`${selected.id} · Correlated activity`}
            action={<Status>Simulated</Status>}
          >
            <p className="mb-4 text-xs text-muted">{selected.summary}</p>
            <PathGraph stages={path.stages} />
            <p className="mt-4 text-xs leading-6 text-muted">
              Observed nodes reference legacy sample findings. Live signals are
              simulated; inferred impact does not confirm compromise.
            </p>
            <div className="mt-4 flex flex-wrap gap-6 text-xs">
              <span>
                Asset <b className="technical">{selected.asset}</b>
              </span>
              <span>
                Confidence <b>{selected.confidence}%</b>
              </span>
              <span>
                First simulated observation{" "}
                <b>{formatTime(a.source.analysisTime)}</b>
              </span>
            </div>
          </Card>
          <Card
            title="Recent event feed"
            action={
              <span className="text-xs text-muted">
                {monitor.events.length} retained events
              </span>
            }
          >
            {!monitor.events.length ? (
              <Empty
                title="Event feed cleared"
                detail="Inject a mock event or resume automatic refresh."
              />
            ) : (
              <div className="max-h-80 overflow-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Type</th>
                      <th>Source → destination</th>
                      <th>Asset / Stage</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monitor.events.map((e) => (
                      <tr key={e.id}>
                        <td className="technical">{formatTime(e.time)}</td>
                        <td className="text-blue">{e.type}</td>
                        <td>
                          <span className="technical">
                            {e.source} → {e.destination}
                          </span>
                          <p className="mt-1 text-muted">{e.message}</p>
                        </td>
                        <td>
                          <span className="technical">{e.asset}</span>
                          <p className="mt-1 text-muted">{e.stage}</p>
                        </td>
                        <td>{e.confidence}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <Card title="Correlation engine log">
            <div className="max-h-36 space-y-2 overflow-auto font-mono text-[10px] leading-5 text-muted">
              {monitor.events.slice(0, 10).map((e) => (
                <p key={e.id}>
                  [{formatTime(e.time)}] SIMULATED {e.type} :: {e.message} ::{" "}
                  {e.stage} :: {e.confidence}%
                </p>
              ))}
              {!monitor.events.length && <p>No simulation events.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
