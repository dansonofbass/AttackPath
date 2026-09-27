"use client";
import { useMemo, useRef, useState } from "react";
import { Download, RotateCcw, Globe, Server } from "lucide-react";
import type { AnalysisResult, Asset, Finding } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Empty,
  Kpis,
  SearchField,
  Status,
} from "@/components/shared/ui";
import { readLocal, writeLocal } from "@/lib/storage";
import { downloadJson } from "@/lib/export-json";
import { sortFindings } from "@/lib/severity";
type Position = Record<string, { x: number; y: number }>;
export function InfrastructurePage({
  analysis: a,
  initialAsset,
  onFinding,
  notify,
}: {
  analysis: AnalysisResult;
  initialAsset?: string;
  onFinding: (f: Finding) => void;
  notify: (s: string) => void;
}) {
  const [selected, setSelected] = useState(initialAsset ?? "internet");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [positions, setPositions] = useState<Position>(() =>
    readLocal("ap-topology-v1", {}),
  );
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{
    id: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
  } | null>(null);
  const asset = a.assets.find((x) => x.id === selected);
  const node = a.infrastructure.nodes.find((n) => n.id === selected);
  const list = useMemo(
    () =>
      a.assets.filter((x) =>
        `${x.hostname} ${x.ip} ${x.type} ${x.zone} ${x.site}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [a, query],
  );
  const synthetic = a.assets.filter((x) => x.provenance === "Synthetic");
  const zoneAssets = node
    ? a.assets
        .filter((x) => x.zone === node.zone)
        .sort(
          (x, y) =>
            ["Critical", "High", "Medium", "Low", "None"].indexOf(x.risk) -
            ["Critical", "High", "Medium", "Low", "None"].indexOf(y.risk),
        )
    : [];
  const pos = (id: string) =>
    positions[id] ?? a.infrastructure.nodes.find((n) => n.id === id)!;
  const move = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current || !svg.current) return;
    const r = svg.current.getBoundingClientRect();
    const d = drag.current;
    setPositions((p) => ({
      ...p,
      [d.id]: {
        x: Math.max(
          5,
          Math.min(705, d.x + ((e.clientX - d.startX) * 880) / r.width),
        ),
        y: Math.max(
          30,
          Math.min(475, d.y + ((e.clientY - d.startY) * 570) / r.height),
        ),
      },
    }));
  };
  return (
    <div className="space-y-5">
      <Kpis
        items={[
          {
            label: "Assets",
            value: a.assets.length,
            detail: `${synthetic.length} synthetic + 5 sample hosts`,
          },
          {
            label: "Networks",
            value: a.infrastructure.sites.length,
            detail: "Synthetic sites",
          },
          {
            label: "Critical assets",
            value: a.assets.filter((x) => x.risk === "Critical").length,
            color: "var(--critical)",
          },
          {
            label: "High-risk assets",
            value: a.assets.filter((x) => ["Critical", "High"].includes(x.risk))
              .length,
          },
          {
            label: "EDR coverage",
            value: `${Math.round((synthetic.filter((x) => x.edr).length / synthetic.length) * 100)}%`,
            detail: "Synthetic estate only",
          },
          {
            label: "AV coverage",
            value: `${Math.round((synthetic.filter((x) => x.antivirus).length / synthetic.length) * 100)}%`,
            detail: "Synthetic estate only",
          },
        ]}
      />
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <Card
          title="Network topology"
          action={
            <Button
              onClick={() =>
                downloadJson(
                  a.source.filename,
                  {
                    source: a.source,
                    assets: a.assets,
                    infrastructure: a.infrastructure,
                  },
                  "infrastructure",
                )
              }
            >
              <Download size={14} />
              Export model
            </Button>
          }
        >
          <p className="mb-4 text-xs text-muted">
            Select a component to inspect it. Drag nodes to arrange your
            workspace.
          </p>
          <div className="graph-grid overflow-x-auto rounded-lg border border-border bg-background">
            <svg
              ref={svg}
              viewBox="0 0 880 570"
              className="min-w-[680px] w-full touch-none"
              aria-label="Interactive synthetic network topology"
              onPointerMove={move}
              onPointerUp={() => {
                if (drag.current) {
                  writeLocal("ap-topology-v1", positions);
                  drag.current = null;
                }
              }}
              onPointerCancel={() => {
                drag.current = null;
              }}
            >
              <text x="25" y="25" fill="#6f7c89" fontSize="9" letterSpacing="2">
                SYNTHETIC NETWORK RELATIONSHIPS
              </text>
              {a.infrastructure.links.map(([from, to]) => {
                const x = pos(from),
                  y = pos(to);
                return (
                  <path
                    key={from + to}
                    d={`M${x.x + 80} ${x.y + 40} L${y.x + 80} ${y.y + 40}`}
                    stroke="#34536c"
                    strokeWidth="1.5"
                    fill="none"
                    strokeDasharray="5 4"
                  />
                );
              })}
              {a.infrastructure.nodes.map((n) => {
                const p = pos(n.id);
                return (
                  <g
                    key={n.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Select ${n.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelected(n.id);
                      }
                    }}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      setSelected(n.id);
                      svg.current?.setPointerCapture(e.pointerId);
                      drag.current = {
                        id: n.id,
                        x: p.x,
                        y: p.y,
                        startX: e.clientX,
                        startY: e.clientY,
                      };
                    }}
                    transform={`translate(${p.x},${p.y})`}
                    className="cursor-grab outline-none focus:brightness-150"
                  >
                    <rect
                      width="160"
                      height="82"
                      rx="8"
                      fill={selected === n.id ? "#172d3e" : "#111922"}
                      stroke={selected === n.id ? "#76b7e8" : "#344351"}
                      strokeWidth={selected === n.id ? 2 : 1}
                    />
                    <circle
                      cx="140"
                      cy="17"
                      r="3"
                      fill={n.id === "internet" ? "#8f9cab" : "#4d9bd6"}
                    />
                    <text
                      x="13"
                      y="22"
                      fill="#6f7c89"
                      fontSize="8"
                      letterSpacing="1"
                    >
                      {n.zone}
                    </text>
                    <text x="13" y="43" fill="#e8edf2" fontSize="12">
                      {n.title}
                    </text>
                    <text x="13" y="64" fill="#8f9cab" fontSize="9">
                      {a.assets.filter((x) => x.zone === n.zone).length}{" "}
                      assigned assets
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => setSelected("internet")}>
              <Globe size={14} />
              Select Internet
            </Button>
            <Button
              onClick={() => {
                setPositions({});
                writeLocal("ap-topology-v1", {});
                notify("Topology layout reset.");
              }}
            >
              <RotateCcw size={14} />
              Reset Layout
            </Button>
          </div>
        </Card>
        <Card
          title={
            asset ? "Asset details" : (node?.title ?? "Selected component")
          }
        >
          {asset ? (
            <div className="max-h-[650px] overflow-y-auto pr-2">
              <AssetDetails asset={asset} analysis={a} onFinding={onFinding} />
            </div>
          ) : (
            <>
              <Status>Synthetic component</Status>
              <p className="my-4 text-xs leading-6 text-muted">
                {node?.id === "internet"
                  ? "External logical boundary. No internal assets are assigned directly to this node."
                  : `${zoneAssets.length} assets assigned to ${node?.zone}. Security-tool coverage and relationships are synthetic.`}
              </p>
              <div className="max-h-[440px] space-y-2 overflow-y-auto">
                {zoneAssets.slice(0, 40).map((x) => (
                  <button
                    key={x.id}
                    onClick={() => setSelected(x.id)}
                    className="w-full rounded border border-border bg-background p-3 text-left hover:border-blue"
                  >
                    <p className="truncate text-xs font-medium">{x.hostname}</p>
                    <p className="technical my-2 text-muted">{x.ip}</p>
                    <Badge severity={x.risk} />
                  </button>
                ))}
              </div>
              {zoneAssets.length > 40 && (
                <p className="mt-3 text-xs text-muted">
                  Showing 40; search the full inventory below.
                </p>
              )}
            </>
          )}
        </Card>
      </div>
      <Card title="Identity landscape">
        <p className="mb-4 text-xs text-muted">
          Synthetic forest {a.infrastructure.identity.forest} |{" "}
          {a.infrastructure.identity.privilegedAccounts} privileged accounts |{" "}
          {a.infrastructure.identity.serviceAccounts.toLocaleString()} service
          accounts | {a.infrastructure.identity.trusts} trusts
        </p>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Controllers</th>
                <th>Users</th>
                <th>Groups</th>
                <th>Organizational units</th>
              </tr>
            </thead>
            <tbody>
              {a.infrastructure.identity.domains.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>{d.controllers}</td>
                  <td>{d.users.toLocaleString()}</td>
                  <td>{d.groups}</td>
                  <td>{d.organizationalUnits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Asset inventory">
        <div className="mb-4">
          <SearchField
            value={query}
            onChange={(q) => {
              setQuery(q);
              setPage(0);
            }}
            placeholder="Search hostname, IP, type, zone or site"
          />
        </div>
        {!list.length ? (
          <Empty title="No matching assets" />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>IP</th>
                  <th>Type / Zone</th>
                  <th>Site</th>
                  <th>Risk</th>
                  <th>Findings</th>
                  <th>EDR / AV</th>
                </tr>
              </thead>
              <tbody>
                {list.slice(page * 20, page * 20 + 20).map((x) => (
                  <tr key={x.id}>
                    <td>
                      <button
                        onClick={() => setSelected(x.id)}
                        className="text-left text-blue"
                      >
                        {x.hostname}
                      </button>
                      <p className="mt-1 text-[10px] text-muted">
                        {x.provenance}
                      </p>
                    </td>
                    <td className="technical">{x.ip}</td>
                    <td>
                      {x.type}
                      <p className="mt-1 text-muted">{x.zone}</p>
                    </td>
                    <td>{x.site}</td>
                    <td>
                      <Badge severity={x.risk} />
                    </td>
                    <td>{x.findings.length}</td>
                    <td>
                      {x.provenance === "Legacy sample"
                        ? "Unknown"
                        : `${x.edr ? "On" : "Gap"} / ${x.antivirus ? "On" : "Gap"}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span>
            {list.length.toLocaleString()} assets · Page {page + 1} of{" "}
            {Math.max(1, Math.ceil(list.length / 20))}
          </span>
          <div className="flex gap-2">
            <Button disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button
              disabled={(page + 1) * 20 >= list.length}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
function AssetDetails({
  asset: x,
  analysis: a,
  onFinding,
}: {
  asset: Asset;
  analysis: AnalysisResult;
  onFinding: (f: Finding) => void;
}) {
  return (
    <>
      <Server size={25} className="mb-4 text-blue" />
      <h3 className="break-words text-sm font-semibold">{x.hostname}</h3>
      <p className="my-3">
        <Badge severity={x.risk} />
      </p>
      <dl className="space-y-3 text-xs">
        {[
          ["IP", x.ip],
          ["Type", x.type],
          ["Zone", x.zone],
          ["Site", x.site],
          ["OS", x.os],
          ["Source", x.provenance],
          [
            "EDR",
            x.provenance === "Legacy sample"
              ? "Unknown"
              : x.edr
                ? "Covered"
                : "Coverage gap",
          ],
          [
            "Antivirus",
            x.provenance === "Legacy sample"
              ? "Unknown"
              : x.antivirus
                ? "Covered"
                : "Coverage gap",
          ],
          ["Relationships", `Member of ${x.zone}; routing inferred`],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="mb-1 text-muted">{k}</dt>
            <dd className="break-words">{v}</dd>
          </div>
        ))}
      </dl>
      <h4 className="mb-2 mt-5 text-xs font-semibold">Services</h4>
      <p className="technical leading-6 text-muted">
        {x.services
          .map((s) => `${s.protocol.toUpperCase()}/${s.port}`)
          .join(" · ")}
      </p>
      <h4 className="mb-2 mt-5 text-xs font-semibold">Linked findings</h4>
      {x.findings.length ? (
        a.findings
          .filter((f) => x.findings.includes(f.id))
          .sort(sortFindings)
          .map((f) => (
            <button
              className="mb-2 block text-left text-xs text-blue"
              key={f.id}
              onClick={() => onFinding(f)}
            >
              {f.id} · {f.title}
            </button>
          ))
      ) : (
        <p className="text-xs text-muted">
          No observed findings mapped to this synthetic IP.
        </p>
      )}
    </>
  );
}
