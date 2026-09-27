"use client";
import { useState } from "react";
import { RefreshCcw, Download, Database, RotateCcw } from "lucide-react";
import type { AnalysisResult } from "@/lib/types";
import {
  Button,
  Card,
  Kpis,
  Notice,
  SearchField,
  Status,
} from "@/components/shared/ui";
import { useSourceSync, syncStages } from "@/hooks/use-source-sync";
import { downloadJson } from "@/lib/export-json";
import { formatDate } from "@/lib/format";
export function SourceSyncPage({
  analysis: a,
  notify,
}: {
  analysis: AnalysisResult;
  notify: (s: string) => void;
}) {
  const sync = useSourceSync(notify);
  const [tab, setTab] = useState("Assets");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const db = a.infrastructure.database;
  const sources = [
    {
      name: "Active Directory",
      count:
        db["AD Users"].length +
        db["AD Groups"].length +
        db["AD Computers"].length +
        db.GPO.length,
      detail: "Users, groups, computers and policy",
    },
    {
      name: "Firewall",
      count: db["Firewall Rules"].length,
      detail: "Policies, services and rule metadata",
    },
    {
      name: "Network",
      count: db.Interfaces.length + db.DNS.length + db["Network Links"].length,
      detail: "Interfaces, VLANs, DNS and links",
    },
    {
      name: "EDR",
      count: db.EDR.length,
      detail: "Endpoint health and containment policy",
    },
    {
      name: "Antivirus",
      count: db.Antivirus.length,
      detail: "Definitions and protection status",
    },
    { name: "SIEM", count: 4, detail: "Synthetic incident correlation rules" },
    {
      name: "Threat Intelligence",
      count: db["Threat Intelligence"].length,
      detail: "Mock threat indicators, CVE context and correlation",
    },
  ];
  const rows = db[tab].filter((r) =>
    JSON.stringify(r).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <Notice>
        <b className="text-ink">Simulated Source Integration.</b> All connectors
        and database records are local synthetic data. No directory, firewall or
        endpoint service is contacted.
      </Notice>
      <Kpis
        items={[
          { label: "Source connectors", value: sources.length },
          {
            label: "Synchronized",
            value: Object.values(sync.state).filter((s) => s.progress === 100)
              .length,
          },
          { label: "Mock assets", value: db.Assets.length },
          { label: "Firewall rules", value: db["Firewall Rules"].length },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => sources.forEach((s) => sync.sync(s.name, s.count))}
        >
          <RefreshCcw size={14} />
          Sync All
        </Button>
        <Button
          onClick={() => {
            downloadJson(
              a.source.filename,
              { source: a.source, database: db },
              "mock-database",
            );
            notify("Mock database exported.");
          }}
        >
          <Download size={14} />
          Export Mock DB
        </Button>
        <Button onClick={sync.reset}>
          <RotateCcw size={14} />
          Reset Sync Data
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((s) => {
          const state = sync.state[s.name];
          const running = state && state.progress < 100;
          return (
            <Card key={s.name}>
              <div className="flex items-start justify-between">
                <Database size={21} className="text-blue" />
                <Status good={state?.progress === 100}>
                  {state?.progress === 100
                    ? "Synced"
                    : running
                      ? "Syncing"
                      : "Not synced"}
                </Status>
              </div>
              <h2 className="mt-4 text-sm font-semibold">{s.name}</h2>
              <p className="mt-2 text-xs text-muted">{s.detail}</p>
              <p className="mt-4 text-xs">
                {s.count.toLocaleString()} available records
              </p>
              <div className="mb-2 mt-4 h-1 rounded bg-border">
                <div
                  className="h-full rounded bg-blue transition-[width]"
                  style={{ width: `${state?.progress ?? 0}%` }}
                />
              </div>
              <p className="min-h-8 text-[10px] text-muted">
                {running
                  ? syncStages[Math.min(4, Math.floor(state.progress / 20))]
                  : state?.last
                    ? `${state.records.toLocaleString()} records · ${formatDate(state.last)}`
                    : "Ready to synchronize"}
              </p>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => sync.test(s.name)}>
                  Test Connection
                </Button>
                <Button
                  disabled={!!running}
                  onClick={() => sync.sync(s.name, s.count)}
                >
                  Sync
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <Card title="Synchronization event log">
        <div className="max-h-40 space-y-2 overflow-auto font-mono text-[10px] text-muted">
          {sync.logs.length ? (
            sync.logs.map((s, i) => <p key={i}>{s}</p>)
          ) : (
            <p>No source synchronized. Run a mock sync to record activity.</p>
          )}
        </div>
      </Card>
      <Card
        title="Mock source database"
        action={<Status>Synthetic records</Status>}
      >
        <div
          className="mb-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Database tables"
        >
          {Object.keys(db).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setPage(0);
                setQuery("");
              }}
              className={`rounded-md border px-3 py-2 text-[11px] ${t === tab ? "border-blue/50 bg-blue/10 text-blue" : "border-border text-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <SearchField
          value={query}
          onChange={(s) => {
            setQuery(s);
            setPage(0);
          }}
          placeholder={`Search ${tab.toLowerCase()}`}
        />
        <div className="table-scroll mt-4" role="tabpanel">
          <table className="data-table">
            <thead>
              <tr>
                {Object.keys(db[tab][0] ?? {}).map((k) => (
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(page * 12, page * 12 + 12).map((row, i) => (
                <tr key={i}>
                  {Object.entries(row).map(([k, v]) => (
                    <td key={k}>{String(v)}</td>
                  ))}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={8}>No matching records.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between gap-3 text-xs text-muted">
          <span>
            {rows.length.toLocaleString()} matching records · page {page + 1}
          </span>
          <div className="flex gap-2">
            <Button disabled={!page} onClick={() => setPage((x) => x - 1)}>
              Previous
            </Button>
            <Button
              disabled={(page + 1) * 12 >= rows.length}
              onClick={() => setPage((x) => x + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
