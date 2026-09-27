import Image from "next/image";
import { Info, ArrowUpRight, Search } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Severity } from "@/lib/types";
import { severityColor } from "@/lib/severity";
export function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3.5 py-2 text-xs font-medium transition-colors ${variant === "primary" ? "border-blue bg-blue text-[#09131b] hover:bg-[#76b7e8]" : variant === "ghost" ? "border-transparent text-muted hover:bg-panel hover:text-ink" : "border-border bg-panel text-ink hover:border-[#4c6376] hover:bg-[#1a2835]"} ${className}`}
    >
      {children}
    </button>
  );
}
export function Card({
  children,
  className = "",
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  action?: ReactNode;
}) {
  return (
    <section
      className={`min-w-0 rounded-[10px] border border-border bg-surface ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "w-[196px] max-w-full" : "w-[240px] max-w-full"}>
      <Image
        src="/logo.png"
        unoptimized
        alt="AttackPath"
        width={2172}
        height={724}
        priority
        className="h-auto w-full rounded-md"
      />
      {!compact && (
        <p className="mt-2 text-[10px] uppercase tracking-[.1em] text-muted">
          Security exposure intelligence
        </p>
      )}
    </div>
  );
}
export function Badge({ severity }: { severity: Severity }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-medium"
      style={{
        color: severityColor(severity),
        borderColor: `color-mix(in srgb, ${severityColor(severity)} 28%, transparent)`,
        background: `color-mix(in srgb, ${severityColor(severity)} 8%, transparent)`,
      }}
    >
      <span className="size-1 rounded-full bg-current" />
      {severity === "Info" ? "Informational" : severity}
    </span>
  );
}
export function Status({
  children,
  good = false,
}: {
  children: ReactNode;
  good?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] ${good ? "text-safe" : "text-muted"}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-blue/20 bg-blue/5 px-4 py-3 text-xs leading-relaxed text-muted">
      <Info size={15} className="mt-0.5 shrink-0 text-blue" />
      <div>{children}</div>
    </div>
  );
}
export function Kpis({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    detail?: string;
    color?: string;
  }[];
}) {
  return (
    <div
      className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(var(--cols),minmax(0,1fr))]"
      style={{ "--cols": items.length } as React.CSSProperties}
    >
      {items.map((x) => (
        <div
          key={x.label}
          className="rounded-lg border border-border bg-surface p-4"
        >
          <p className="eyebrow tracking-wider">{x.label}</p>
          <p
            className="mt-3 truncate font-display text-2xl font-semibold tabular-nums"
            style={{ color: x.color }}
          >
            {typeof x.value === "number" ? x.value.toLocaleString() : x.value}
          </p>
          <p className="mt-2 text-[10px] text-muted">
            {x.detail ?? "Current security model"}
          </p>
        </div>
      ))}
    </div>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <label className="relative block min-w-48 flex-1">
      <Search size={15} className="absolute left-3 top-3 text-muted" />
      <span className="sr-only">{label}</span>
      <input
        className="field pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
export function Empty({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="py-12 text-center">
      <Search size={24} className="mx-auto mb-3 text-muted" />
      <p className="font-medium">{title}</p>
      <p className="mt-2 text-xs text-muted">{detail}</p>
    </div>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-xs text-blue hover:text-[#a9d2f1]"
    >
      {children}
      <ArrowUpRight size={13} />
    </button>
  );
}
