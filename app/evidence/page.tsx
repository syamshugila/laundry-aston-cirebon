"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useOrders } from "@/lib/hooks";
import { PageHeader, Spinner, EmptyState, Notice } from "@/components/ui";
import Icon from "@/components/Icon";
import { tanggalJam } from "@/lib/format";

const TAHAP = [
  { v: "all", t: "Semua tahap" },
  { v: "pickup", t: "Saat pengambilan" },
  { v: "damage", t: "Cacat / noda" },
  { v: "handover", t: "Serah terima vendor" },
  { v: "return", t: "Saat diterima kembali" },
  { v: "delivery", t: "Saat diantar" },
] as const;

export default function EvidencePage() {
  const { orders, loading, error } = useOrders(undefined, 200);
  const [tahap, setTahap] = useState<(typeof TAHAP)[number]["v"]>("all");
  const [cari, setCari] = useState("");

  const rows = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return orders
      .map((o) => ({
        o,
        photos: (o.photos || []).filter((p) => tahap === "all" || p.stage === tahap),
        signatures: o.signatures || [],
      }))
      .filter((r) => r.photos.length > 0 || (tahap === "all" && r.signatures.length > 0))
      .filter((r) => !q || r.o.trackingCode.toLowerCase().includes(q) || r.o.roomNumber.includes(q) || r.o.guestName.toLowerCase().includes(q));
  }, [orders, tahap, cari]);

  const totalFoto = rows.reduce((a, r) => a + r.photos.length, 0);

  return (
    <>
      <PageHeader
        eyebrow="Arsip Bukti"
        title="Galeri Bukti"
        desc="Semua foto dan tanda tangan per nota per tahap. Inilah yang dibuka saat ada klaim tamu — data, bukan ingatan."
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Tidak bisa memuat data">{error}</Notice>
        </div>
      )}

      <div className="card mb-4 flex flex-wrap items-end gap-3 px-4 py-3.5">
        <div className="min-w-[220px] flex-1">
          <span className="label">Cari nota</span>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input className="input pl-9" value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Kode lacak, kamar, nama tamu…" />
          </div>
        </div>
        <div className="w-[210px]">
          <span className="label">Tahap</span>
          <select className="input" value={tahap} onChange={(e) => setTahap(e.target.value as typeof tahap)}>
            {TAHAP.map((t) => (
              <option key={t.v} value={t.v}>
                {t.t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="camera"
          title="Belum ada bukti tersimpan"
          desc="Foto akan muncul di sini setelah valet mengambil foto pada tahap pickup, serah terima, atau pengantaran."
        />
      ) : (
        <>
          <p className="mb-3 text-[13.5px] text-ink-2">
            <b className="text-ink">{totalFoto}</b> foto dari <b className="text-ink">{rows.length}</b> nota
          </p>
          <div className="space-y-3">
            {rows.map(({ o, photos, signatures }) => (
              <div key={o.id} className="card px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[15px] font-bold text-ink">
                      Kamar {o.roomNumber} · {o.guestName}
                    </p>
                    <p className="font-mono text-[12px] text-ink-3">{o.trackingCode}</p>
                  </div>
                  <Link href={`/orders/${o.id}`} className="text-[13px] font-semibold text-brand-700 hover:underline">
                    Buka nota →
                  </Link>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, i) => (
                    <a
                      key={i}
                      href={p.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-[104px] flex-col gap-1 rounded-lg border border-line bg-slate-50 px-2.5 py-2 text-ink-3 transition hover:border-brand-500 hover:text-brand-700"
                    >
                      <Icon name="camera" className="h-4 w-4" />
                      <span className="text-[11px] font-semibold capitalize">
                        {TAHAP.find((t) => t.v === p.stage)?.t.split(" ")[0] || p.stage}
                      </span>
                      <span className="text-[10px]">{tanggalJam(p.at)}</span>
                    </a>
                  ))}
                  {tahap === "all" &&
                    signatures.map((s, i) => (
                      <a
                        key={"s" + i}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-[104px] flex-col gap-1 rounded-lg border border-line bg-white px-2.5 py-2 text-ink-3 transition hover:border-brand-500 hover:text-brand-700"
                      >
                        <Icon name="pen" className="h-4 w-4" />
                        <span className="truncate text-[11px] font-semibold">{s.name}</span>
                        <span className="text-[10px]">{tanggalJam(s.at)}</span>
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
