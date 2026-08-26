"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrders, useIssues } from "@/lib/hooks";
import { StatCard, Spinner, Notice, StatusPill, SlaBadge, SkeletonList } from "@/components/ui";
import Icon, { type IconName } from "@/components/Icon";
import { Monogram } from "@/components/Brand";
import { rupiah, todayKey, tanggalJam } from "@/lib/format";
import { HOTEL_NAME } from "@/lib/firebase";

export default function Dashboard() {
  const { profile } = useAuth();
  const { orders, loading, error } = useOrders(undefined, 300);
  const { issues } = useIssues();

  const s = useMemo(() => {
    const hariIni = todayKey();
    const hitung = (f: (o: (typeof orders)[number]) => boolean) => orders.filter(f).length;
    const selesai = orders.filter((o) => o.timestamps.verified && o.timestamps.picked_up);
    const rata =
      selesai.length > 0
        ? selesai.reduce((a, o) => a + ((o.timestamps.verified || 0) - (o.timestamps.picked_up || 0)), 0) /
          selesai.length /
          3600000
        : 0;
    return {
      hariIni: hitung((o) => todayKey(new Date(o.createdAt)) === hariIni),
      pickedUp: hitung((o) => o.status === "picked_up"),
      proses: hitung((o) => o.status === "in_process" || o.status === "sorted"),
      vendor: hitung((o) => o.status === "on_vendor"),
      returned: hitung((o) => o.status === "returned"),
      ready: hitung((o) => o.status === "ready"),
      delivered: hitung((o) => o.status === "delivered"),
      audit: hitung((o) => o.status === "pending_audit"),
      verified: hitung((o) => o.status === "verified"),
      items: orders.reduce((a, o) => a + (o.qtyHotelTotal || 0), 0),
      pendapatan: orders
        .filter((o) => todayKey(new Date(o.createdAt)) === hariIni && o.chargeStatus !== "void")
        .reduce((a, o) => a + (o.grandTotal || 0), 0),
      turnaround: rata,
      selisih: hitung((o) => o.qtyMismatch && !o.isLocked),
    };
  }, [orders]);

  const kendalaTerbuka = issues.filter((i) => i.status !== "resolved");

  // Penjaga check-out: tamu berangkat hari ini tapi cucian belum sampai kamar.
  const mendesak = useMemo(() => {
    const hariIni = todayKey();
    return orders.filter(
      (o) =>
        o.guestCheckoutDate &&
        o.guestCheckoutDate <= hariIni &&
        !["delivered", "pending_audit", "verified", "cancelled"].includes(o.status)
    );
  }, [orders]);

  const terlambat = orders.filter(
    (o) =>
      o.promisedAt &&
      o.promisedAt < Date.now() &&
      !["delivered", "pending_audit", "verified", "cancelled"].includes(o.status)
  );

  const jam = new Date().getHours();
  const sapaan = jam < 11 ? "Selamat pagi" : jam < 15 ? "Selamat siang" : jam < 18 ? "Selamat sore" : "Selamat malam";

  return (
    <>
      {/* ================= Sambutan ================= */}
      <div className="relative mb-6 overflow-hidden rounded-2xl bg-navy-sheen px-6 py-8 text-white shadow-navy sm:px-8 sm:py-9">
        <span className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold-500/12 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="animate-fadeUp">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-semibold text-gold-300 ring-1 ring-white/10">
              <Icon name="box" className="h-3.5 w-3.5" />
              {HOTEL_NAME} · Housekeeping Operations
            </p>
            <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight sm:text-[34px]">
              {sapaan}, {(profile?.name || "").split(" ")[0] || "Rekan"}
            </h1>
            <div className="gold-rule my-3.5" />
            <p className="max-w-xl text-[15px] leading-relaxed text-white/70">
              Pelacakan laundry tamu dari kamar sampai kembali ke kamar — bukti foto, hitung ganda,
              serah terima vendor, dan verifikasi HK Leader.
            </p>
            <Link href="/pickup" className="btn-gold mt-6">
              <Icon name="plus" className="h-4 w-4" /> Buat Pickup Baru
            </Link>
          </div>

          <Monogram className="hidden h-20 w-20 text-[44px] ring-1 ring-gold-500/30 sm:grid" />
        </div>
      </div>

      {error && (
        <div className="mb-5">
          <Notice tone="danger" title="Tidak bisa memuat data">
            {error}
          </Notice>
        </div>
      )}

      {mendesak.length > 0 && (
        <div className="mb-5">
          <Notice tone="danger" title={`Penjaga check-out — ${mendesak.length} nota mendesak`}>
            Tamu berikut dijadwalkan berangkat hari ini atau sudah lewat, tapi cucian belum sampai ke
            kamar:{" "}
            {mendesak.slice(0, 6).map((o, i) => (
              <span key={o.id}>
                {i > 0 && ", "}
                <Link href={`/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                  Kamar {o.roomNumber}
                </Link>
              </span>
            ))}
            {mendesak.length > 6 && ` dan ${mendesak.length - 6} lainnya`}.
          </Notice>
        </div>
      )}

      {/* ================= Kartu angka ================= */}
      <div className="stagger mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Nota Hari Ini" value={s.hariIni} hint="Dibuat hari ini" icon="list" />
        <StatCard label="Sudah Diambil" value={s.pickedUp} hint="Menunggu sortir" tone="brand" href="/orders" icon="box" />
        <StatCard label="Proses In-House" value={s.proses} hint="Cuci & setrika" tone="warn" href="/process" icon="clock" />
        <StatCard label="Di Vendor" value={s.vendor} hint="Di luar hotel" tone="warn" href="/vendor" icon="truck" />
        <StatCard label="Kembali & QC" value={s.returned} hint="Perlu diperiksa" href="/vendor-return" icon="box" />
        <StatCard label="Siap Antar" value={s.ready} hint="Sudah dibungkus" tone="brand" href="/ready" icon="check" />
      </div>

      <div className="stagger mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Sudah Diantar" value={s.delivered} hint="Diterima tamu" tone="ok" href="/delivered" icon="check" />
        <StatCard label="Menunggu Audit" value={s.audit} hint="Perlu HK Leader" tone="warn" href="/verification" icon="shield" />
        <StatCard label="Terverifikasi" value={s.verified} hint="Terkunci & aman" tone="ok" icon="lock" />
        <StatCard label="Kendala Terbuka" value={kendalaTerbuka.length} hint="Perlu ditindak" tone="danger" href="/issues" icon="alert" />
        <StatCard label="Selisih Hitung" value={s.selisih} hint="Tamu vs hotel" tone={s.selisih ? "danger" : "plain"} icon="alert" />
        <StatCard
          label="Turnaround"
          value={s.turnaround > 0 ? `${s.turnaround.toFixed(1)} jam` : "—"}
          hint="Rata-rata pickup → verifikasi"
          icon="clock"
        />
      </div>

      {/* ================= Pintasan peran ================= */}
      <div className="stagger mb-6 grid gap-3 md:grid-cols-3">
        <QuickCard href="/verification" tone="emerald" eyebrow="Meja HK Leader" title={`Audit ${s.audit} nota menunggu`} icon="shield" />
        <QuickCard href="/vendor" tone="gold" eyebrow="Logistik Vendor" title="Serah terima & surat jalan" icon="truck" />
        <QuickCard href="/issues" tone="rose" eyebrow="Kendali Mutu" title={`Tangani ${kendalaTerbuka.length} kendala`} icon="alert" />
      </div>

      {/* ================= Aktivitas & ringkasan ================= */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="h-4 w-[3px] rounded-full bg-gold-500" />
                <h2 className="font-display text-[16px] font-bold text-ink">Aktivitas Terbaru</h2>
              </div>
              <Link href="/orders" className="group inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:text-gold-600">
                Lihat semua
                <Icon name="chevron" className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            {loading ? (
              <div className="p-5">
                <SkeletonList rows={4} />
              </div>
            ) : orders.length === 0 ? (
              <div className="px-5 py-14 text-center">
                <p className="font-display text-[16px] font-bold text-ink">Belum ada nota laundry</p>
                <p className="mt-1.5 text-[14px] text-ink-2">Mulai dari tombol “Buat Pickup Baru” di atas.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {orders.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/orders/${o.id}`}
                      className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-brand-50/40"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 font-bold text-brand-700 transition group-hover:bg-gold-100 group-hover:text-gold-800 ${
                          o.roomNumber.length > 3 ? "text-[11px]" : "text-[13px]"
                        }`}
                      >
                        {o.roomNumber}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-ink">
                          Kamar {o.roomNumber} · {o.guestName}
                        </p>
                        <p className="truncate font-mono text-[11.5px] text-ink-3">
                          {o.trackingCode} · {o.qtyHotelTotal} item · {rupiah(o.grandTotal)}
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <SlaBadge
                          promisedAt={o.promisedAt}
                          done={["delivered", "pending_audit", "verified"].includes(o.status)}
                        />
                      </div>
                      <StatusPill status={o.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card px-5 py-4">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="h-4 w-[3px] rounded-full bg-gold-500" />
              <h2 className="font-display text-[16px] font-bold text-ink">Ringkasan Hari Ini</h2>
            </div>
            <Baris label="Total item tercatat" value={String(s.items)} />
            <Baris label="Nilai laundry hari ini" value={rupiah(s.pendapatan)} />
            <Baris label="Nota terlambat" value={String(terlambat.length)} tone={terlambat.length ? "bad" : "ok"} />
            <Baris label="Kendala terbuka" value={String(kendalaTerbuka.length)} tone={kendalaTerbuka.length ? "bad" : "ok"} />
          </div>

          {terlambat.length > 0 && (
            <div className="card border-l-[3px] border-l-rose-500 px-5 py-4">
              <h2 className="mb-2.5 font-display text-[15px] font-bold text-rose-700">Lewat Janji Selesai</h2>
              <ul className="space-y-2">
                {terlambat.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 text-[13.5px]">
                    <Link href={`/orders/${o.id}`} className="font-semibold text-ink hover:text-brand-700 hover:underline">
                      Kamar {o.roomNumber}
                    </Link>
                    <span className="text-[12px] text-ink-3">{tanggalJam(o.promisedAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card bg-brand-50/40 px-5 py-4">
            <h2 className="mb-1.5 font-display text-[15px] font-bold text-ink">Waktu Proses</h2>
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              Rata-rata dari pickup sampai terverifikasi:{" "}
              <b className="text-brand-700">
                {s.turnaround > 0 ? `${s.turnaround.toFixed(1)} jam` : "belum ada data"}
              </b>
              . Target operasional yang sehat adalah di bawah 6 jam untuk layanan reguler.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Baris({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2.5 last:border-0">
      <span className="text-[13.5px] text-ink-2">{label}</span>
      <span
        className={`text-[14px] font-bold tabular-nums ${
          tone === "bad" ? "text-rose-600" : tone === "ok" ? "text-emerald-700" : "text-ink"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function QuickCard({
  href,
  eyebrow,
  title,
  icon,
  tone,
}: {
  href: string;
  eyebrow: string;
  title: string;
  icon: IconName;
  tone: "emerald" | "gold" | "rose";
}) {
  const tones = {
    emerald: "bg-emerald-50/70 border-emerald-200 text-emerald-900 hover:border-emerald-300",
    gold: "bg-gold-50/80 border-gold-200 text-gold-900 hover:border-gold-300",
    rose: "bg-rose-50/70 border-rose-200 text-rose-900 hover:border-rose-300",
  } as const;
  return (
    <Link
      href={href}
      className={`group flex items-start justify-between gap-3 rounded-xl border px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift ${tones[tone]}`}
    >
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.13em] opacity-60">{eyebrow}</p>
        <p className="mt-1 font-display text-[16.5px] font-bold leading-snug">{title}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold opacity-70">
          Buka <Icon name="chevron" className="h-3 w-3 transition group-hover:translate-x-0.5" />
        </span>
      </div>
      <Icon name={icon} className="h-6 w-6 shrink-0 opacity-50 transition group-hover:scale-110 group-hover:opacity-80" />
    </Link>
  );
}
