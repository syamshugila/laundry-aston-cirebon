"use client";
import Link from "next/link";
import { useOrders } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { PageHeader, Spinner, EmptyState, Notice, StatusPill } from "@/components/ui";
import Icon from "@/components/Icon";
import { canVerify } from "@/lib/status";
import { rupiah, tanggalJam, durasiJam } from "@/lib/format";

export default function VerificationPage() {
  const { role } = useAuth();
  const { orders, loading, error } = useOrders(["pending_audit"], 200);

  if (!canVerify(role)) {
    return (
      <Notice tone="warn" title="Halaman khusus HK Leader">
        Hanya HK Leader dan Super Admin yang boleh melakukan verifikasi akhir.
      </Notice>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Tahap 09 — Meja HK Leader"
        title="Verifikasi & Penguncian"
        desc="Periksa kelengkapan bukti sebelum mengunci. Setelah dikunci, nota tidak bisa diubah oleh siapa pun, termasuk Super Admin."
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Tidak bisa memuat data">{error}</Notice>
        </div>
      )}

      <div className="mb-5">
        <Notice tone="info" title="Target akhir shift">
          Antrean ini sebaiknya nol setiap pergantian shift. Nota yang menumpuk di sini berarti bukti
          belum diperiksa dan sengketa tamu belum punya penutup.
        </Notice>
      </div>

      {loading ? (
        <Spinner />
      ) : orders.length === 0 ? (
        <EmptyState icon="shield" title="Antrean audit kosong" desc="Semua nota yang sudah diantar telah diverifikasi dan terkunci." />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => {
            const kurangFoto = (o.photos?.length || 0) === 0;
            const kurangTtd = (o.signatures?.length || 0) === 0;
            const siap = !kurangFoto && !o.qtyMismatch && o.openIssueCount === 0;
            return (
              <Link
                key={o.id}
                href={`/orders/${o.id}`}
                className={`card block px-5 py-4 transition hover:border-brand-300 ${siap ? "" : "border-l-[3px] border-l-amber-500"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[16px] font-bold text-ink">
                      Kamar {o.roomNumber} · {o.guestName}
                    </p>
                    <p className="mt-0.5 font-mono text-[12px] text-ink-3">
                      {o.trackingCode} · {o.qtyHotelTotal} item · {rupiah(o.grandTotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={o.status} />
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700">
                      Periksa <Icon name="chevron" className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Cek ok={!kurangFoto} label={`Foto bukti (${o.photos?.length || 0})`} />
                  <Cek ok={!kurangTtd} label={`Tanda tangan (${o.signatures?.length || 0})`} lunak />
                  <Cek ok={!o.qtyMismatch} label={`Jumlah cocok (${o.qtyGuestTotal}/${o.qtyHotelTotal})`} />
                  <Cek ok={o.openIssueCount === 0} label={o.openIssueCount ? `${o.openIssueCount} kendala terbuka` : "Tanpa kendala"} />
                  <Cek ok={o.chargeStatus === "posted"} label={`Biaya: ${o.chargeStatus}`} lunak />
                </div>

                <p className="mt-2.5 text-[12px] text-ink-3">
                  Diantar {tanggalJam(o.timestamps.delivered)} · waktu proses{" "}
                  {durasiJam(o.timestamps.picked_up, o.timestamps.delivered)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function Cek({ ok, label, lunak }: { ok: boolean; label: string; lunak?: boolean }) {
  const cls = ok
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : lunak
      ? "bg-slate-100 text-slate-600 ring-slate-200"
      : "bg-rose-50 text-rose-700 ring-rose-200";
  return <span className={`pill ${cls}`}>{ok ? "✓ " : "! "}{label}</span>;
}
