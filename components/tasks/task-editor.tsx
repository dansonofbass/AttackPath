"use client";
import { useState } from "react";
import type { RemediationTask } from "@/lib/types";
import { Modal } from "@/components/shared/modal";
import { Badge, Button } from "@/components/shared/ui";
export function TaskEditor({
  task,
  onClose,
  onSave,
  onDelete,
}: {
  task: RemediationTask;
  onClose: () => void;
  onSave: (t: RemediationTask) => void;
  onDelete?: () => void;
}) {
  const [draft, setDraft] = useState(task);
  const update = <K extends keyof RemediationTask>(
    key: K,
    value: RemediationTask[K],
  ) => setDraft((t) => ({ ...t, [key]: value }));
  return (
    <Modal title="Remediation task" onClose={onClose}>
      <div className="mb-5 flex flex-wrap gap-3">
        <Badge severity={task.severity} />
        <span className="technical">
          {task.id} Ã‚· Plugin {task.findingId}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({ ...draft, summary: draft.summary.trim() });
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <label className="text-xs sm:col-span-2">
          Summary
          <input
            className="field mt-2"
            required
            maxLength={240}
            value={draft.summary}
            onChange={(e) => update("summary", e.target.value)}
          />
        </label>
        <label className="text-xs">
          Assignee
          <input
            className="field mt-2"
            required
            value={draft.assignee}
            onChange={(e) => update("assignee", e.target.value)}
          />
        </label>
        <label className="text-xs">
          Due date
          <input
            className="field mt-2"
            required
            type="date"
            value={draft.dueDate}
            onChange={(e) => update("dueDate", e.target.value)}
          />
        </label>
        <label className="text-xs">
          Priority
          <select
            className="field mt-2"
            aria-label="Priority"
            value={draft.priority}
            onChange={(e) => update("priority", e.target.value)}
          >
            {["Highest", "High", "Medium", "Low"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Status
          <select
            className="field mt-2"
            aria-label="Status"
            value={draft.status}
            onChange={(e) =>
              update("status", e.target.value as RemediationTask["status"])
            }
          >
            {["Open", "In Progress", "Blocked", "Resolved"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="text-xs sm:col-span-2">
          Asset
          <input
            className="field mt-2"
            required
            value={draft.asset}
            onChange={(e) => update("asset", e.target.value)}
          />
        </label>
        <label className="text-xs sm:col-span-2">
          Description
          <textarea
            aria-label="Description"
            rows={7}
            className="field mt-2"
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </label>
        <div className="flex justify-between gap-3 border-t border-border pt-5 sm:col-span-2">
          <div>
            {onDelete && (
              <Button type="button" onClick={onDelete}>
                Delete task
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={!draft.summary.trim()}
            >
              Save Task
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
