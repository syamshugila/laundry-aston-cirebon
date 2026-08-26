"use client";
// Komponen tampilan kecil yang dipakai berulang di banyak halaman.
import Link from "next/link";
import type { ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
import { STATUS_CLASS, STATUS_LABEL, STATUS_STEP } from "@/lib/status";
import type { OrderStatus } from "@/lib/types";
import { sisaWaktu } from "@/lib/format";

export function StatusPill({ status, showStep = false }: { status: OrderStatus; showStep?: boolean }) {
  return (
    <span className={`pill ${STATUS_CLASS[status]}`}>
      {showStep && <span className="mr-1 opacity-60">{STATUS_STEP[status]}</span>}
      {STATUS_LABEL[status]}
    </span>
  );
}

export function SlaBadge({ promisedAt, done }: { promisedAt?: number | null; done?: boolean }) {
  if (done) return <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-200">Selesai</span>;
  const s = sisaWaktu(promisedAt);
  const cls =
    s.level === "late"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : s.level === "warn"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return <span className={`pill ${cls}`}>{s.text}</span>;
}

export function PageHeader({
  eyebrow,
  title,
  desc,
  action,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-[15px] text-ink-2">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon = "box",
  title,
  desc,
  actionHref,
  actionLabel,
}: {
  icon?: IconName;
  title: string;
  desc?: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
        <Icon name={icon} />
      </div>
      <p className="text-base font-semibold text-ink">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-[14.5px] text-ink-2">{desc}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-2">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "warn" | "danger" | "ok";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-l-brand-700 bg-brand-50/60",
    warn: "border-l-amber-500 bg-amber-50/70",
    danger: "border-l-rose-600 bg-rose-50/70",
    ok: "border-l-emerald-600 bg-emerald-50/70",
  } as const;
  return (
    <div className={`rounded-r-lg border border-line border-l-[3px] px-4 py-3 ${tones[tone]}`}>
      {title && <p className="text-[12.5px] font-bold uppercase tracking-wider text-ink">{title}</p>}
      <div className="mt-0.5 text-[14.5px] leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "plain",
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "plain" | "brand" | "warn" | "danger" | "ok";
  href?: string;
}) {
  const tones = {
    plain: "text-ink",
    brand: "text-brand-700",
    warn: "text-amber-700",
    danger: "text-rose-700",
    ok: "text-emerald-700",
  } as const;
  const inner = (
    <>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-ink-3">{label}</p>
      <p className={`mt-1.5 text-[26px] font-bold leading-none tabular-nums ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>}
    </>
  );
  const cls = "card px-4 py-3.5 transition hover:border-brand-200";
  return href ? (
    <Link href={href} className={`${cls} block`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function Field({
  label,
  hint,
  children,
  required,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label">
        {label} {required && <span className="text-rose-600">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-[12.5px] text-ink-3">{hint}</p>}
    </div>
  );
}
