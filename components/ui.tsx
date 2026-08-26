"use client";
// Komponen tampilan kecil yang dipakai berulang di banyak halaman.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon, { type IconName } from "./Icon";
import { STATUS_CLASS, STATUS_LABEL, STATUS_STEP } from "@/lib/status";
import type { OrderStatus } from "@/lib/types";
import { sisaWaktu } from "@/lib/format";

/* ------------------------------------------------------------------ */
/* Angka yang menghitung naik saat pertama muncul                      */
/* ------------------------------------------------------------------ */
export function CountUp({ value, durasi = 700 }: { value: number; durasi?: number }) {
  const [tampil, setTampil] = useState(0);
  const dari = useRef(0);

  useEffect(() => {
    const kurangiGerak =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (kurangiGerak || value === dari.current) {
      setTampil(value);
      dari.current = value;
      return;
    }
    const awal = dari.current;
    const beda = value - awal;
    const mulai = performance.now();
    let frame = 0;
    const langkah = (t: number) => {
      const p = Math.min(1, (t - mulai) / durasi);
      const eased = 1 - Math.pow(1 - p, 3); // melambat di akhir
      setTampil(Math.round(awal + beda * eased));
      if (p < 1) frame = requestAnimationFrame(langkah);
      else dari.current = value;
    };
    frame = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(frame);
  }, [value, durasi]);

  return <>{tampil.toLocaleString("id-ID")}</>;
}

/* ------------------------------------------------------------------ */
/* Pil status & penanda waktu                                          */
/* ------------------------------------------------------------------ */
export function StatusPill({ status, showStep = false }: { status: OrderStatus; showStep?: boolean }) {
  return (
    <span className={`pill ${STATUS_CLASS[status]}`}>
      {showStep && <span className="mr-1 opacity-55">{STATUS_STEP[status]}</span>}
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
        ? "bg-gold-50 text-gold-800 ring-gold-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`pill ${cls}`}>
      {s.level === "late" && <span className="mr-1.5 h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />}
      {s.text}
    </span>
  );
}

/** Bilah tipis sisa waktu: hijau → emas → merah seiring tenggat mendekat. */
export function SlaBar({ mulai, target, done }: { mulai?: number | null; target?: number | null; done?: boolean }) {
  if (!target || !mulai) return null;
  const total = Math.max(1, target - mulai);
  const lewat = Date.now() - mulai;
  const persen = Math.max(3, Math.min(100, (lewat / total) * 100));
  const warna = done
    ? "bg-emerald-500"
    : persen >= 100
      ? "bg-rose-500"
      : persen >= 75
        ? "bg-gold-500"
        : "bg-emerald-500";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-slate-200/80">
      <div className={`h-full rounded-full transition-all duration-700 ${warna}`} style={{ width: `${done ? 100 : persen}%` }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kerangka halaman                                                    */
/* ------------------------------------------------------------------ */
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 animate-fadeUp">
      <div>
        {eyebrow && (
          <p className="mb-1.5 lockup text-[10.5px] text-silver-600">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[30px]">{title}</h1>
        <div className="brand-rule mt-2.5" />
        {desc && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-2">{desc}</p>}
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
    <div className="card flex animate-fadeUp flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">
        <Icon name={icon} className="h-6 w-6" />
      </div>
      <p className="font-display text-[17px] font-bold text-ink">{title}</p>
      {desc && <p className="mt-1.5 max-w-sm text-[14.5px] leading-relaxed text-ink-2">{desc}</p>}
      {actionHref && actionLabel && (
        <Link href={actionHref} className="btn-primary mt-6">
          <Icon name="plus" className="h-4 w-4" /> {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function Spinner({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-2">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-100 border-t-brand-700" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

/** Kerangka abu-abu berkilau saat data sedang dimuat — terasa lebih cepat daripada spinner. */
export function SkeletonList({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="card px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2.5">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="skeleton h-5 w-24" />
          </div>
          <div className="skeleton mt-4 h-1 w-full" />
        </div>
      ))}
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
    warn: "border-l-gold-500 bg-gold-50/70",
    danger: "border-l-rose-600 bg-rose-50/70",
    ok: "border-l-emerald-600 bg-emerald-50/70",
  } as const;
  const ikon = { info: "shield", warn: "alert", danger: "alert", ok: "check" } as const;
  const warnaIkon = {
    info: "text-brand-700",
    warn: "text-gold-700",
    danger: "text-rose-600",
    ok: "text-emerald-700",
  } as const;
  return (
    <div className={`flex animate-fadeUp gap-3 rounded-r-lg border border-line border-l-[3px] px-4 py-3.5 ${tones[tone]}`}>
      <Icon name={ikon[tone]} className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${warnaIkon[tone]}`} />
      <div>
        {title && <p className="text-[12.5px] font-bold uppercase tracking-wider text-ink">{title}</p>}
        <div className="mt-0.5 text-[14.5px] leading-relaxed text-ink-2">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kartu angka                                                         */
/* ------------------------------------------------------------------ */
export function StatCard({
  label,
  value,
  hint,
  tone = "plain",
  href,
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "plain" | "brand" | "warn" | "danger" | "ok" | "gold";
  href?: string;
  icon?: IconName;
}) {
  const tones = {
    plain: "text-ink",
    brand: "text-brand-700",
    warn: "text-gold-700",
    gold: "text-gold-600",
    danger: "text-rose-700",
    ok: "text-emerald-700",
  } as const;
  const angka = typeof value === "number";

  const inner = (
    <>
      <div className="flex min-h-[30px] items-start justify-between gap-2">
        <p className="font-display text-[10.5px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-silver-600">{label}</p>
        {icon && <Icon name={icon} className="h-4 w-4 shrink-0 text-ink-3/60" />}
      </div>
      <p className={`mt-2 text-[27px] font-bold leading-none tabular-nums ${tones[tone]}`}>
        {angka ? <CountUp value={value as number} /> : value}
      </p>
      {hint && <p className="mt-2 min-h-[32px] text-[12.5px] leading-snug text-ink-3">{hint}</p>}
    </>
  );

  const cls = "card px-4 py-4";
  return href ? (
    <Link href={href} className={`${cls} card-hover group block`}>
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
      {hint && <p className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Notifikasi mengambang                                               */
/* ------------------------------------------------------------------ */
export function Toast({
  pesan,
  tone = "ok",
  onClose,
}: {
  pesan: string;
  tone?: "ok" | "danger";
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!onClose) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 animate-fadeUp items-center gap-2.5 rounded-xl px-5 py-3 text-[14px] font-semibold shadow-lift ${
        tone === "ok" ? "bg-brand-700 text-white" : "bg-rose-600 text-white"
      }`}
    >
      <Icon name={tone === "ok" ? "check" : "alert"} className="h-4 w-4 text-white/70" />
      {pesan}
    </div>
  );
}
