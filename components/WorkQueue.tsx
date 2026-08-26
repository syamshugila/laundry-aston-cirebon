"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useOrders } from "@/lib/hooks";
import { PageHeader, Spinner, EmptyState, Notice, StatusPill, SlaBadge, SlaBar, SkeletonList } from "./ui";
import Icon from "./Icon";
import OrderTable from "./OrderTable";
import { lantaiDari, rupiah, tanggalJam } from "@/lib/format";
import { SERVICE_LABEL } from "@/lib/status";
import type { LaundryOrder, OrderStatus } from "@/lib/types";

/**
 * Papan kerja per peran. Menampilkan hanya nota yang perlu ditangani
 * pada tahap tertentu — bukan seluruh tabel besar.
 */
export default function WorkQueue({
  eyebrow,
  title,
  desc,
  statuses,
  filter,
  groupByFloor = false,
  emptyTitle,
  emptyDesc,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  statuses: OrderStatus[];
  filter?: (o: LaundryOrder) => boolean;
  groupByFloor?: boolean;
  emptyTitle: string;
  emptyDesc: string;
}) {
  const { orders, loading, error } = useOrders(statuses, 300);
  const [tampilTabel, setTampilTabel] = useState(false);

  const rows = useMemo(() => {
    const r = filter ? orders.filter(filter) : orders;
    return [...r].sort((a, b) => (a.promisedAt || 0) - (b.promisedAt || 0));
  }, [orders, filter]);

  const grup = useMemo(() => {
    if (!groupByFloor) return null;
    const m = new Map<string, LaundryOrder[]>();
    rows.forEach((o) => {
      const k = lantaiDari(o.roomNumber);
      m.set(k, [...(m.get(k) || []), o]);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], "id", { numeric: true }));
  }, [rows, groupByFloor]);

  const terlambat = rows.filter((o) => o.promisedAt && o.promisedAt < Date.now());

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        desc={desc}
        action={
          <button onClick={() => setTampilTabel((v) => !v)} className="btn-ghost">
            <Icon name="list" className="h-4 w-4" /> {tampilTabel ? "Tampilan Kartu" : "Tampilan Tabel"}
          </button>
        }
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Tidak bisa memuat data">{error}</Notice>
        </div>
      )}

      {terlambat.length > 0 && (
        <div className="mb-4">
          <Notice tone="warn" title={`${terlambat.length} nota lewat janji selesai`}>
            Dahulukan yang paling merah di daftar bawah ini.
          </Notice>
        </div>
      )}

      {loading ? (
        <SkeletonList rows={5} />
      ) : rows.length === 0 ? (
        <EmptyState icon="check" title={emptyTitle} desc={emptyDesc} />
      ) : tampilTabel ? (
        <OrderTable orders={rows} />
      ) : grup ? (
        <div className="space-y-6">
          {grup.map(([lantai, list]) => (
            <div key={lantai}>
              <div className="mb-2 flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-ink">{lantai}</h2>
                <span className="pill bg-brand-50 text-brand-700 ring-brand-200">{list.length} nota</span>
                <span className="text-[12.5px] text-ink-3">— satu kali jalan bisa mengantar semuanya</span>
              </div>
              <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((o) => (
                  <KartuNota key={o.id} o={o} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((o) => (
            <KartuNota key={o.id} o={o} />
          ))}
        </div>
      )}
    </>
  );
}

export function KartuNota({ o }: { o: LaundryOrder }) {
  const telat = o.promisedAt ? o.promisedAt < Date.now() : false;
  const selesai = ["delivered", "pending_audit", "verified"].includes(o.status);
  return (
    <Link
      href={`/orders/${o.id}`}
      className={`card card-hover group relative block overflow-hidden px-4 py-4 ${
        telat && !selesai ? "border-l-[3px] border-l-rose-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 font-bold text-brand-700 transition group-hover:bg-gold-100 group-hover:text-gold-800 ${
              o.roomNumber.length > 3 ? "text-[11px]" : "text-[12.5px]"
            }`}
          >
            {o.roomNumber}
          </span>
          <div className="min-w-0">
            <p className="text-[15.5px] font-bold leading-tight text-ink">Kamar {o.roomNumber}</p>
            <p className="truncate text-[13px] text-ink-2">{o.guestName}</p>
          </div>
        </div>
        <StatusPill status={o.status} />
      </div>

      <p className="mt-2.5 font-mono text-[11.5px] text-ink-3">{o.trackingCode}</p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="pill bg-slate-100 text-slate-600 ring-slate-200">{o.qtyHotelTotal} item</span>
        <span className="pill bg-slate-100 text-slate-600 ring-slate-200">{SERVICE_LABEL[o.serviceType]}</span>
        {o.route !== "in_house" && (
          <span className="pill bg-gold-50 text-gold-800 ring-gold-200">
            {o.route === "mixed" ? "Campuran" : "Vendor"}
          </span>
        )}
        {o.qtyMismatch && <span className="pill bg-rose-50 text-rose-700 ring-rose-200">Selisih</span>}
        {o.openIssueCount > 0 && (
          <span className="pill bg-rose-50 text-rose-700 ring-rose-200">{o.openIssueCount} kendala</span>
        )}
      </div>

      <div className="mt-3.5">
        <SlaBar mulai={o.timestamps.picked_up || o.createdAt} target={o.promisedAt} done={selesai} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-2.5">
        <SlaBadge promisedAt={o.promisedAt} done={selesai} />
        <span className="text-[13px] font-bold tabular-nums text-ink">{rupiah(o.grandTotal)}</span>
      </div>
      <p className="mt-1 text-[11.5px] text-ink-3">Janji: {tanggalJam(o.promisedAt)}</p>
    </Link>
  );
}
