"use client";
import { useState } from "react";
import type { Finding, JiraConfig, RemediationTask } from "@/lib/types";
import { readLocal, writeLocal } from "@/lib/storage";
export function newTask(f: Finding): RemediationTask {
  return {
    id: `APT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    findingId: f.id,
    severity: f.severity,
    priority:
      f.severity === "Critical"
        ? "Highest"
        : f.severity === "High"
          ? "High"
          : f.severity === "Medium"
            ? "Medium"
            : "Low",
    asset: [...new Set(f.hosts.map((h) => h.ip))].join(", "),
    summary: `Remediate: ${f.title}`,
    description: `Legacy sample Plugin ${f.id}.\n\n${f.synopsis}\n\nRecommended solution:\n${f.solution}\n\nValidate remediation with a follow-up authorized scan.`,
    assignee: "Security Engineering",
    dueDate: new Date(
      Date.now() +
        86400000 *
          (f.severity === "Critical" ? 3 : f.severity === "High" ? 7 : 14),
    )
      .toISOString()
      .slice(0, 10),
    status: "Open",
    createdAt: new Date().toISOString(),
  };
}
const defaultConfig: JiraConfig = {
  mode: "mock",
  baseUrl: "https://example.atlassian.net",
  projectKey: "SEC",
  proxyEndpoint: "/api/jira/issues",
};
export function useTasks(notify: (s: string) => void) {
  const [tasks, setTasks] = useState<RemediationTask[]>(() =>
    readLocal("ap-tasks-v1", []),
  );
  const [config, setConfig] = useState<JiraConfig>(() =>
    readLocal("ap-jira-v1", defaultConfig),
  );
  const [activity, setActivity] = useState<string[]>(() =>
    readLocal("ap-task-activity-v1", []),
  );
  const log = (s: string) => {
    const next = [`${new Date().toLocaleString()} · ${s}`, ...activity].slice(
      0,
      50,
    );
    setActivity(next);
    writeLocal("ap-task-activity-v1", next);
  };
  const commit = (next: RemediationTask[], message: string) => {
    setTasks(next);
    const saved = writeLocal("ap-tasks-v1", next);
    log(message);
    notify(
      saved
        ? message
        : "Saved for this session; browser storage is unavailable.",
    );
  };
  return {
    tasks,
    config,
    activity,
    save: (t: RemediationTask) =>
      commit(
        tasks.some((x) => x.id === t.id)
          ? tasks.map((x) => (x.id === t.id ? t : x))
          : [t, ...tasks],
        `Task ${t.id} saved.`,
      ),
    remove: (id: string) =>
      commit(
        tasks.filter((t) => t.id !== id),
        `Task ${id} deleted.`,
      ),
    saveConfig: (c: JiraConfig) => {
      setConfig(c);
      writeLocal("ap-jira-v1", c);
      notify("Jira configuration saved locally.");
    },
    createIssue: (id: string) => {
      if (config.mode !== "mock") {
        notify(
          "Live integration requires a backend proxy and is disabled in this prototype.",
        );
        return;
      }
      const task = tasks.find((t) => t.id === id);
      if (!task || task.jiraKey) return;
      const last = readLocal("ap-jira-sequence-v1", 100);
      const sequence = last + 1;
      writeLocal("ap-jira-sequence-v1", sequence);
      const key = `${config.projectKey}-${sequence}`;
      commit(
        tasks.map((t) =>
          t.id === id
            ? { ...t, jiraKey: key, jiraStatus: "Created (mock)" }
            : t,
        ),
        `Mock Jira issue ${key} created.`,
      );
    },
  };
}
