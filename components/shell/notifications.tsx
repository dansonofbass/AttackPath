"use client";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  ShieldAlert,
  Route,
  Wrench,
  X,
} from "lucide-react";
import type { AppPage } from "@/lib/types";

const initialNotifications = [
  {
    id: "findings",
    title: "Vulnerabilities need review",
    detail: "Inspect the sample findings and affected assets.",
    page: "findings" as AppPage,
    label: "Warning",
    Icon: ShieldAlert,
    color: "text-amber-300",
  },
  {
    id: "paths",
    title: "Potential attack paths identified",
    detail: "Review the sample attack paths and exposed services.",
    page: "attack-paths" as AppPage,
    label: "Warning",
    Icon: Route,
    color: "text-orange-300",
  },
  {
    id: "remediation",
    title: "Review remediation priorities",
    detail: "Explore recommended fixes for the sample findings.",
    page: "remediation" as AppPage,
    label: "Action needed",
    Icon: Wrench,
    color: "text-blue",
  },
];

export function Notifications({
  onNavigate,
}: {
  onNavigate: (page: AppPage) => void;
}) {
  const [items, setItems] = useState(initialNotifications);
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  return (
    <div
      ref={container}
      className="relative shrink-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node))
          setOpen(false);
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`Notifications (${items.length})`}
        aria-expanded={open}
        aria-controls="workspace-notifications"
        onClick={() => setOpen(!open)}
        className="relative flex size-9 items-center justify-center rounded-lg border border-border bg-panel text-muted transition-colors hover:border-blue/40 hover:text-ink focus-visible:outline-2 focus-visible:outline-blue"
      >
        <Bell size={17} />
        {items.length > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex size-[18px] items-center justify-center rounded-full border-2 border-[#0d141b] bg-amber-300 text-[9px] font-bold text-[#211b0b]">
            {items.length}
          </span>
        )}
      </button>
      {open && (
        <section
          id="workspace-notifications"
          aria-label="Notifications"
          className="fixed right-3 top-[72px] z-50 w-[min(380px,calc(100vw-24px))] overflow-hidden rounded-xl border border-border bg-[#111c27] shadow-2xl sm:absolute sm:right-0 sm:top-12"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-4">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="mt-1 text-[10px] text-muted">
                Demo alerts · Refreshed each sign-in
              </p>
            </div>
            <button
              type="button"
              disabled={!items.length}
              onClick={() => setItems([])}
              className="flex items-center gap-1.5 rounded p-2 text-[11px] text-blue hover:bg-panel disabled:opacity-40"
            >
              <CheckCheck size={14} />
              Clear all
            </button>
          </div>
          <div className="max-h-[min(440px,65dvh)] overflow-y-auto">
            {items.length ? (
              items.map(({ id, title, detail, page, label, Icon, color }) => (
                <div
                  key={id}
                  className="flex items-start border-b border-border/60 last:border-0"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onNavigate(page);
                    }}
                    className="flex min-w-0 flex-1 items-start gap-3 p-4 text-left transition-colors hover:bg-panel"
                  >
                    <Icon size={18} className={`mt-1 shrink-0 ${color}`} />
                    <div className="min-w-0">
                      <p
                        className={`mb-1 text-[9px] uppercase tracking-wider ${color}`}
                      >
                        {label}
                      </p>
                      <p className="text-xs font-medium leading-5">{title}</p>
                      <p className="mt-1 text-[11px] leading-5 text-muted">
                        {detail}
                      </p>
                      <span className="mt-2 flex items-center gap-1 text-[10px] text-blue">
                        View details
                        <ChevronRight size={12} />
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    aria-label={`Dismiss ${title}`}
                    onClick={() => {
                      setItems((current) =>
                        current.filter((item) => item.id !== id),
                      );
                      trigger.current?.focus();
                    }}
                    className="mr-2 mt-3 rounded p-2 text-muted hover:bg-panel hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div role="status" className="px-5 py-10 text-center">
                <CheckCheck size={28} className="mx-auto mb-3 text-safe" />
                <p className="text-sm">All caught up</p>
                <p className="mt-2 text-xs text-muted">
                  No notifications. Demo alerts return next sign-in.
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
