"use client";
import { useState } from "react";
import { Download, Plus, Ticket } from "lucide-react";
import type { JiraConfig, RemediationTask } from "@/lib/types";
import {
  Badge,
  Button,
  Card,
  Empty,
  Kpis,
  Notice,
  SearchField,
} from "@/components/shared/ui";
import { downloadJson } from "@/lib/export-json";
export function TasksPage({
  tasks,
  config,
  activity,
  onEdit,
  onCreate,
  onIssue,
  onConfig,
  notify,
}: {
  tasks: RemediationTask[];
  config: JiraConfig;
  activity: string[];
  onEdit: (t: RemediationTask) => void;
  onCreate: () => void;
  onIssue: (id: string) => void;
  onConfig: (c: JiraConfig) => void;
  notify: (s: string) => void;
}) {
  const [draft, setDraft] = useState(config);
  const [query, setQuery] = useState("");
  const list = tasks.filter((t) =>
    JSON.stringify(t).toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <Notice>
        Mock Jira is local to this prototype. A production integration requires
        a server-side proxy; credentials never belong in this browser.
      </Notice>
      <Kpis
        items={[
          {
            label: "Open tasks",
            value: tasks.filter((t) => t.status !== "Resolved").length,
          },
          {
            label: "Jira linked",
            value: tasks.filter((t) => t.jiraKey).length,
          },
          {
            label: "Critical / High",
            value: tasks.filter((t) =>
              ["Critical", "High"].includes(t.severity),
            ).length,
          },
          { label: "Project", value: config.projectKey },
          { label: "Mode", value: "Mock" },
        ]}
      />
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Jira integration">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              onConfig({
                ...draft,
                projectKey: draft.projectKey.toUpperCase(),
              });
            }}
          >
            <label className="text-xs">
              Mode
              <select className="field mt-2" value="mock" onChange={() => {}}>
                <option value="mock">Mock / Prototype</option>
                <option value="live" disabled>
                  Live via Server Proxy (backend required)
                </option>
              </select>
            </label>
            <label className="text-xs">
              Jira Base URL
              <input
                type="url"
                required
                className="field mt-2"
                value={draft.baseUrl}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, baseUrl: e.target.value }))
                }
              />
            </label>
            <label className="text-xs">
              Project Key
              <input
                required
                pattern="[A-Za-z][A-Za-z0-9]{1,9}"
                title="2–10 letters or numbers, starting with a letter"
                className="field mt-2"
                value={draft.projectKey}
                onChange={(e) =>
                  setDraft((c) => ({
                    ...c,
                    projectKey: e.target.value.toUpperCase(),
                  }))
                }
              />
            </label>
            <label className="text-xs">
              Proxy Endpoint
              <input
                className="field mt-2"
                value={draft.proxyEndpoint}
                onChange={(e) =>
                  setDraft((c) => ({ ...c, proxyEndpoint: e.target.value }))
                }
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button type="submit">Save Configuration</Button>
              <Button
                type="button"
                onClick={() =>
                  notify(
                    "Mock Jira connection ready. No network request was made.",
                  )
                }
              >
                Test
              </Button>
              <Button
                type="button"
                onClick={() => {
                  downloadJson("tasks", { config, tasks, activity }, "tasks");
                  notify("Tasks exported.");
                }}
              >
                <Download size={14} />
                Export Tasks
              </Button>
            </div>
          </form>
        </Card>
        <Card title="Task activity">
          <div className="max-h-52 space-y-3 overflow-auto text-xs leading-5 text-muted">
            {activity.length ? (
              activity.map((s, i) => <p key={i}>{s}</p>)
            ) : (
              <p>No task activity yet. Create a task from a finding.</p>
            )}
          </div>
        </Card>
      </div>
      <Card
        title="Remediation task queue"
        action={
          <Button variant="primary" onClick={onCreate}>
            <Plus size={14} />
            Create from finding
          </Button>
        }
      >
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search task, assignee, status or Jira key"
        />
        {!list.length ? (
          <Empty
            title={
              tasks.length ? "No matching tasks" : "No remediation tasks yet"
            }
            detail="Create a task from Findings or Remediation to assign and track corrective work."
          />
        ) : (
          <div className="table-scroll mt-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Severity</th>
                  <th>Asset</th>
                  <th>Owner / Due</th>
                  <th>Status</th>
                  <th>Jira</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td className="max-w-72">
                      <button
                        className="text-left text-blue"
                        onClick={() => onEdit(t)}
                      >
                        {t.id}
                      </button>
                      <p className="mt-1 truncate" title={t.summary}>
                        {t.summary}
                      </p>
                      <p className="mt-1 text-muted">Priority: {t.priority}</p>
                    </td>
                    <td>
                      <Badge severity={t.severity} />
                    </td>
                    <td className="technical max-w-44 break-words">
                      {t.asset}
                    </td>
                    <td>
                      {t.assignee}
                      <p className="mt-1 text-muted">{t.dueDate}</p>
                    </td>
                    <td>{t.status}</td>
                    <td>
                      {t.jiraKey ? (
                        <>
                          <span className="technical text-blue">
                            {t.jiraKey}
                          </span>
                          <p className="mt-1 text-muted">{t.jiraStatus}</p>
                        </>
                      ) : (
                        <Button onClick={() => onIssue(t.id)}>
                          <Ticket size={13} />
                          Create Jira Issue
                        </Button>
                      )}
                    </td>
                    <td>
                      <Button onClick={() => onEdit(t)}>Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
