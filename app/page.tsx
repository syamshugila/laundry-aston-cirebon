"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { useOrders, useIssues } from "@/lib/hooks";
import { StatCard, PageHeader, Spinner, Notice, StatusPill, SlaBadge } from "@/components/ui";
import Icon from "@/components/Icon";
import { rupiah, todayKey, tanggalJam, durasiJam } from "@/lib/format";
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
    (o) => o.promisedAt && o.promisedAt < Date.now() && !["delivered", "pending_audit", "verified", "cancelled"].includes(o.status)
  );

  return (
    <>
      <div className="card mb-6 px-6 py-7">
        <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-[11.5px] font-semibold text-brand-700">
          <Icon name="box" className="h-3.5 w-3.5" />
          {HOTEL_NAME} · Housekeeping Operations
        </p>
        <h1 className="text-[27px] font-bold tracking-tight text-ink sm:text-[32px]">
          Selamat datang, {(profile?.name || "").split(" ")[0] || "Rekan"}
        </h1>
        <p className="mt-1.5 max-w-2xl text-[15px] text-ink-2">
          Pelacakan laundry tamu dari kamar sampai kembali ke kamar — bukti foto, hitung ganda, serah
          terima vendor, dan verifikasi HK Leader.
        </p>
        <Link href="/pickup" className="btn-primary mt-5">
          <Icon name="plus" className="h-4 w-4" /> Buat Pickup Baru
        </Link>
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

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Nota Hari Ini" value={s.hariIni} hint="Dibuat hari ini" />
        <StatCard label="Sudah Diambil" value={s.pickedUp} hint="Menunggu sortir" tone="brand" href="/orders" />
        <StatCard label="Proses In-House" value={s.proses} hint="Cuci & setrika" tone="warn" href="/process" />
        <StatCard label="Di Vendor" value={s.vendor} hint="Di luar hotel" tone="warn" href="/vendor" />
        <StatCard label="Kembali & QC" value={s.returned} hint="Perlu diperiksa" href="/vendor-return" />
        <StatCard label="Siap Antar" value={s.ready} hint="Sudah dibungkus" tone="brand" href="/ready" />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Sudah Diantar" value={s.delivered} hint="Diterima tamu" tone="ok" href="/delivered" />
        <StatCard label="Menunggu Audit" value={s.audit} hint="Perlu HK Leader" tone="warn" href="/verification" />
        <StatCard label="Terverifikasi" value={s.verified} hint="Terkunci & aman" tone="ok" />
        <StatCard label="Kendala Terbuka" value={kendalaTerbuka.length} hint="Perlu ditindak" tone="danger" href="/issues" />
        <StatCard label="Selisih Hitung" value={s.selisih} hint="Tamu vs hotel" tone={s.selisih ? "danger" : "plain"} />
        <StatCard
          label="Turnaround"
          value={s.turnaround > 0 ? `${s.turnaround.toFixed(1)} jam` : "—"}
          hint="Rata-rata pickup → verifikasi"
        />
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <QuickCard
          href="/verification"
          tone="emerald"
          eyebrow="Meja HK Leader"
          title={`Audit ${s.audit} nota menunggu`}
          icon="shield"
        />
        <QuickCard
          href="/vendor"
          tone="amber"
          eyebrow="Logistik Vendor"
          title="Serah terima & surat jalan"
          icon="truck"
        />
        <QuickCard
          href="/issues"
          tone="rose"
          eyebrow="Kendali Mutu"
          title={`Tangani ${kendalaTerbuka.length} kendala`}
          icon="alert"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-[15px] font-bold text-ink">Aktivitas Terbaru</h2>
              <Link href="/orders" className="text-[13px] font-semibold text-brand-700 hover:underline">
                Lihat semua →
              </Link>
            </div>
            {loading ? (
              <Spinner />
            ) : orders.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-[15px] font-semibold text-ink">Belum ada nota laundry</p>
                <p className="mt-1 text-[14px] text-ink-2">Mulai dari tombol “Buat Pickup Baru” di atas.</p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {orders.slice(0, 8).map((o) => (
                  <li key={o.id}>
                    <Link href={`/orders/${o.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-ink">
                          Kamar {o.roomNumber} · {o.guestName}
                        </p>
                        <p className="truncate font-mono text-[12px] text-ink-3">
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
            <h2 className="mb-3 text-[15px] font-bold text-ink">Ringkasan Hari Ini</h2>
            <Baris label="Total item tercatat" value={String(s.items)} />
            <Baris label="Nilai laundry hari ini" value={rupiah(s.pendapatan)} />
            <Baris label="Nota terlambat" value={String(terlambat.length)} tone={terlambat.length ? "bad" : "ok"} />
            <Baris label="Kendala terbuka" value={String(kendalaTerbuka.length)} tone={kendalaTerbuka.length ? "bad" : "ok"} />
          </div>

          {terlambat.length > 0 && (
            <div className="card px-5 py-4">
              <h2 className="mb-2 text-[15px] font-bold text-rose-700">Lewat Janji Selesai</h2>
              <ul className="space-y-2">
                {terlambat.slice(0, 5).map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2 text-[13.5px]">
                    <Link href={`/orders/${o.id}`} className="font-semibold text-ink hover:underline">
                      Kamar {o.roomNumber}
                    </Link>
                    <span className="text-[12px] text-ink-3">{tanggalJam(o.promisedAt)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card px-5 py-4">
            <h2 className="mb-1.5 text-[15px] font-bold text-ink">Waktu Proses</h2>
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              Rata-rata dari pickup sampai terverifikasi:{" "}
              <b className="text-ink">{s.turnaround > 0 ? durasiJam(0, s.turnaround * 3600000) : "belum ada data"}</b>.
              Target operasional yang sehat adalah di bawah 6 jam untuk layanan reguler.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function Baris({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  return (
    <div className="flex items-center justify-between border-b border-line py-2 last:border-0">
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
  icon: "shield" | "truck" | "alert";
  tone: "emerald" | "amber" | "rose";
}) {
  const tones = {
    emerald: "bg-emerald-50/70 border-emerald-200 text-emerald-800",
    amber: "bg-amber-50/70 border-amber-200 text-amber-800",
    rose: "bg-rose-50/70 border-rose-200 text-rose-800",
  } as const;
  return (
    <Link href={href} className={`flex items-start justify-between gap-3 rounded-xl border px-5 py-4 transition hover:brightness-[0.98] ${tones[tone]}`}>
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] opacity-70">{eyebrow}</p>
        <p className="mt-1 text-[16px] font-bold leading-snug">{title}</p>
      </div>
      <Icon name={icon} className="h-6 w-6 shrink-0 opacity-70" />
    </Link>
  );
}
