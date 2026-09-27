"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  Activity,
  ScanSearch,
  Route,
  Network,
  RefreshCcw,
  Bug,
  Wrench,
  ClipboardList,
  FlaskConical,
  FileText,
  LogOut,
  UploadCloud,
  Menu,
  X,
  CheckCircle2,
  UserRound,
} from "lucide-react";
import type {
  AnalysisResult,
  AppPage,
  Finding,
  RemediationTask,
  SimulationResult,
} from "@/lib/types";
import { Button, Logo, Notice } from "@/components/shared/ui";
import { Modal } from "@/components/shared/modal";
import {
  FindingDetail,
  FindingsPage,
} from "@/components/findings/findings-page";
import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { ScansPage } from "@/components/scans/scans-page";
import { AttackPathsPage } from "@/components/attack-paths/attack-paths-page";
import { InfrastructurePage } from "@/components/infrastructure/infrastructure-page";
import { LiveMonitoringPage } from "@/components/live/live-monitoring-page";
import { SourceSyncPage } from "@/components/sync/source-sync-page";
import { RemediationPage } from "@/components/remediation/remediation-page";
import { TasksPage } from "@/components/tasks/tasks-page";
import { TaskEditor } from "@/components/tasks/task-editor";
import { WhatIfPage } from "@/components/simulation/what-if-page";
import { ReportsPage } from "@/components/reports/reports-page";
import { newTask, useTasks } from "@/hooks/use-tasks";
import { formatTime } from "@/lib/format";
const groups = [
  {
    title: "Operations",
    items: [
      { id: "dashboard", name: "Dashboard", Icon: LayoutDashboard },
      { id: "live", name: "Live Attack Monitoring", Icon: Activity },
      { id: "scans", name: "Vulnerability Scans", Icon: ScanSearch },
      { id: "attack-paths", name: "Attack Paths", Icon: Route },
    ],
  },
  {
    title: "Assets & Sources",
    items: [
      { id: "infrastructure", name: "Infrastructure", Icon: Network },
      { id: "sync", name: "AD / Firewall Sync", Icon: RefreshCcw },
    ],
  },
  {
    title: "Response",
    items: [
      { id: "findings", name: "Findings", Icon: Bug },
      { id: "remediation", name: "Remediation", Icon: Wrench },
      { id: "tasks", name: "Tasks & Jira", Icon: ClipboardList },
      { id: "what-if", name: "What-If", Icon: FlaskConical },
    ],
  },
  {
    title: "Reporting",
    items: [{ id: "reports", name: "Reports", Icon: FileText }],
  },
] as const;
const titles: Record<AppPage, [string, string]> = {
  dashboard: ["Security Dashboard", "Operations overview"],
  live: [
    "Live Attack Monitoring",
    "Correlate simulated telemetry with imported exposure context.",
  ],
  scans: [
    "Vulnerability Scans",
    "Current report metadata and normalized sample findings.",
  ],
  "attack-paths": [
    "Attack Paths",
    "Explore evidence-linked attack-path hypotheses.",
  ],
  infrastructure: [
    "Infrastructure",
    "Synthetic topology and enterprise asset inventory.",
  ],
  sync: [
    "AD / Firewall Sync",
    "Simulated source integration and inventory synchronization.",
  ],
  findings: ["Findings", "Search, filter and inspect vulnerability evidence."],
  remediation: [
    "Remediation",
    "Prioritized corrective actions derived from sample findings.",
  ],
  tasks: ["Tasks & Jira", "Turn vulnerability findings into remediation work."],
  "what-if": ["What-If", "Defensive attack-path simulation."],
  reports: ["Reports", "Export the current security exposure model."],
};
export function ApplicationShell({
  analysis,
  user,
  onNew,
  onSignOut,
}: {
  analysis: AnalysisResult;
  user: string;
  onNew: () => void;
  onSignOut: () => void;
}) {
  const [page, setPage] = useState<AppPage>("dashboard");
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [finding, setFinding] = useState<Finding | null>(null);
  const [task, setTask] = useState<RemediationTask | null>(null);
  const [asset, setAsset] = useState<string>();
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [toast, setToast] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 4500);
  }, []);
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const tasks = useTasks(notify);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mobileRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = mobileRef.current;
    if (drawer) {
      d?.showModal();
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        d?.close();
        document.body.style.overflow = old;
      };
    }
    d?.close();
  }, [drawer]);
  const navigate = (p: AppPage) => {
    setPage(p);
    setDrawer(false);
    requestAnimationFrame(() => titleRef.current?.focus());
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const create = (f: Finding) => {
    setFinding(null);
    setTask(newTask(f));
  };
  const sidebar = (
    <>
      <div className="flex items-center justify-between px-4 pb-6 pt-5">
        <Logo compact />
        <button
          className="min-[900px]:hidden"
          aria-label="Close navigation"
          onClick={() => setDrawer(false)}
        >
          <X size={18} />
        </button>
      </div>
      <div className="mx-3 mb-5 rounded-md border border-border bg-surface p-3">
        <p className="eyebrow text-[9px]">Analyzed report</p>
        <p
          className="mt-2 truncate text-[11px]"
          title={analysis.source.filename}
        >
          {analysis.source.filename}
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-[10px] text-safe">
          <CheckCircle2 size={11} />
          Analysis complete
        </p>
      </div>
      <nav aria-label="Main navigation" className="flex-1 space-y-5 px-3">
        {groups.map((g) => (
          <section key={g.title}>
            <h2 className="eyebrow mb-2 px-3 text-[9px]">{g.title}</h2>
            {g.items.map(({ id, name, Icon }) => (
              <button
                key={id}
                aria-current={page === id ? "page" : undefined}
                onClick={() => navigate(id)}
                className={`my-0.5 flex w-full items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-left text-xs transition-colors ${page === id ? "border-blue bg-[#172735] text-ink" : "border-transparent text-muted hover:bg-panel hover:text-ink"}`}
              >
                <Icon size={16} strokeWidth={1.6} />
                <span>{name}</span>
                {page === id && (
                  <span className="ml-auto size-1 rounded-full bg-blue" />
                )}
              </button>
            ))}
          </section>
        ))}
      </nav>
      <div className="mt-6 border-t border-border px-3 pb-5 pt-3">
        <button
          onClick={() => {
            setDrawer(false);
            setConfirm(true);
          }}
          className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-xs text-blue hover:bg-panel"
        >
          <UploadCloud size={16} />
          Analyze Another Report
        </button>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-xs text-muted hover:bg-panel"
        >
          <LogOut size={16} />
          Sign Out
        </button>
        <p className="px-3 pt-2 text-[9px] tracking-wider text-muted">
          LOCAL PROTOTYPE · v1.0
        </p>
      </div>
    </>
  );
  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-[244px] shrink-0 flex-col overflow-y-auto border-r border-border bg-[#0d141b] min-[900px]:flex">
        {sidebar}
      </aside>
      <dialog
        ref={mobileRef}
        aria-label="Navigation"
        onCancel={(e) => {
          e.preventDefault();
          setDrawer(false);
        }}
        onClick={(e) => {
          if (
            e.target === mobileRef.current &&
            e.clientX > mobileRef.current.getBoundingClientRect().right
          )
            setDrawer(false);
        }}
        className="fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(292px,86vw)] max-w-none border-r border-border bg-[#0d141b] p-0 shadow-2xl"
      >
        <div className="flex min-h-full flex-col">{sidebar}</div>
      </dialog>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 items-center justify-between gap-3 border-b border-border px-5 sm:px-7">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              aria-expanded={drawer}
              onClick={() => setDrawer(true)}
              className="rounded border border-border p-2 min-[900px]:hidden"
            >
              <Menu size={18} />
            </button>
            <span className="text-[11px] text-muted">
              Workspace <span className="mx-2 text-[#475665]">/</span>
              <span className="text-ink">{titles[page][0]}</span>
            </span>
          </div>
          <div className="flex min-w-0 items-center gap-4">
            <div className="hidden max-w-64 text-right sm:block">
              <p
                className="truncate text-[10px] text-muted"
                title={analysis.source.filename}
              >
                {analysis.source.filename}
              </p>
              <p className="mt-1 text-[9px] text-muted">
                Analyzed {formatTime(analysis.source.analysisTime)}
              </p>
            </div>
            <span className="h-6 border-l border-border" />
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full border border-border bg-panel text-muted">
                <UserRound size={13} />
              </span>
              <span className="text-xs">{user}</span>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-[1800px] px-4 pb-10 pt-7 sm:px-7">
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-3">
              <h1
                ref={titleRef}
                tabIndex={-1}
                className="text-2xl font-semibold tracking-tight outline-none"
              >
                {titles[page][0]}
              </h1>
              <span className="hidden rounded border border-blue/25 bg-blue/5 px-2 py-0.5 text-[9px] uppercase tracking-wider text-blue sm:block">
                Prototype
              </span>
            </div>
            <p className="text-xs text-muted">{titles[page][1]}</p>
          </div>
          {[
            "dashboard",
            "findings",
            "scans",
            "attack-paths",
            "infrastructure",
          ].includes(page) && (
            <div className="mb-5">
              <Notice>
                Demo security model: findings are observed in the bundled legacy
                Nessus sample. The uploaded PDF is not parsed; infrastructure is
                synthetic and attack relationships are inferred.
              </Notice>
            </div>
          )}
          <div className="enter" key={page}>
            {page === "dashboard" && (
              <DashboardPage
                analysis={analysis}
                onNavigate={navigate}
                onFinding={setFinding}
                onAsset={(id) => {
                  setAsset(id);
                  navigate("infrastructure");
                }}
              />
            )}
            {page === "findings" && (
              <FindingsPage
                analysis={analysis}
                onSelect={setFinding}
                onTask={create}
              />
            )}
            {page === "scans" && (
              <ScansPage
                analysis={analysis}
                onFinding={setFinding}
                onTask={create}
                notify={notify}
              />
            )}
            {page === "attack-paths" && (
              <AttackPathsPage analysis={analysis} onFinding={setFinding} />
            )}
            {page === "infrastructure" && (
              <InfrastructurePage
                analysis={analysis}
                initialAsset={asset}
                onFinding={setFinding}
                notify={notify}
              />
            )}
            {page === "live" && (
              <LiveMonitoringPage analysis={analysis} onNavigate={navigate} />
            )}
            {page === "sync" && (
              <SourceSyncPage analysis={analysis} notify={notify} />
            )}
            {page === "remediation" && (
              <RemediationPage
                analysis={analysis}
                onFinding={setFinding}
                onTask={create}
              />
            )}
            {page === "tasks" && (
              <TasksPage
                {...tasks}
                onEdit={setTask}
                onCreate={() => navigate("findings")}
                onIssue={tasks.createIssue}
                onConfig={tasks.saveConfig}
                notify={notify}
              />
            )}
            {page === "what-if" && (
              <WhatIfPage
                analysis={analysis}
                lastResult={simulation}
                onResult={setSimulation}
              />
            )}
            {page === "reports" && (
              <ReportsPage
                analysis={analysis}
                simulation={simulation}
                tasks={tasks.tasks}
                notify={notify}
              />
            )}
          </div>
        </main>
      </div>
      {finding && (
        <FindingDetail
          finding={finding}
          onClose={() => setFinding(null)}
          onTask={create}
        />
      )}
      {task && (
        <TaskEditor
          task={task}
          onClose={() => setTask(null)}
          onSave={(t) => {
            tasks.save(t);
            setTask(null);
          }}
          onDelete={
            tasks.tasks.some((t) => t.id === task.id)
              ? () => {
                  tasks.remove(task.id);
                  setTask(null);
                }
              : undefined
          }
        />
      )}
      {confirm && (
        <Modal title="Start a new analysis?" onClose={() => setConfirm(false)}>
          <p className="text-sm leading-7 text-muted">
            The current analysis will be cleared from the active workspace.
            Local remediation tasks, mock source sync and topology layout will
            remain.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <Button onClick={() => setConfirm(false)}>Cancel</Button>
            <Button variant="primary" onClick={onNew}>
              Start New Analysis
            </Button>
          </div>
        </Modal>
      )}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 right-5 z-50 max-w-[calc(100vw-40px)] rounded-lg border border-blue/40 bg-[#152635] px-5 py-3 text-xs shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
