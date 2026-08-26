"use client";
import { useMemo } from "react";
import { useOrders } from "@/lib/hooks";
import { PageHeader, Spinner, Notice, EmptyState } from "@/components/ui";
import { KartuNota } from "@/components/WorkQueue";
import { tanggalJam } from "@/lib/format";

export default function VendorPage() {
  const { orders, loading, error } = useOrders(["picked_up", "sorted", "in_process", "on_vendor"], 300);

  const siapKirim = useMemo(
    () => orders.filter((o) => o.route !== "in_house" && o.status !== "on_vendor"),
    [orders]
  );
  const diVendor = useMemo(() => orders.filter((o) => o.status === "on_vendor"), [orders]);
  const vendorTelat = diVendor.filter((o) => o.vendorPromisedAt && o.vendorPromisedAt < Date.now());

  return (
    <>
      <PageHeader
        eyebrow="Tahap 04b"
        title="Kirim ke Vendor"
        desc="Tahap dengan risiko tertinggi — barang tamu meninggalkan gedung. Setiap serah terima wajib punya foto muatan, jumlah item, dan tanda tangan kurir."
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Tidak bisa memuat data">{error}</Notice>
        </div>
      )}

      {vendorTelat.length > 0 && (
        <div className="mb-5">
          <Notice tone="danger" title={`${vendorTelat.length} kiriman lewat janji retur vendor`}>
            Hubungi vendor sekarang. Kiriman paling lama:{" "}
            {tanggalJam(Math.min(...vendorTelat.map((o) => o.vendorPromisedAt || 0)))}.
          </Notice>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-ink">Siap Dikirim</h2>
              <span className="pill bg-brand-50 text-brand-700 ring-brand-200">{siapKirim.length} nota</span>
            </div>
            <p className="mb-3 max-w-2xl text-[14px] text-ink-2">
              Nota yang berisi item rute vendor (dry clean, jas, gaun, kain khusus) dan belum diserahkan.
              Buka notanya, naikkan status sampai <b>Disortir</b>, lalu pilih <b>“Tandai: Di Vendor”</b> untuk
              mengisi surat jalan digital: vendor tujuan, janji retur, foto muatan, dan tanda tangan kurir.
            </p>
            {siapKirim.length === 0 ? (
              <EmptyState icon="truck" title="Tidak ada yang perlu dikirim" desc="Semua item rute vendor sudah diserahkan." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {siapKirim.map((o) => (
                  <KartuNota key={o.id} o={o} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-[16px] font-bold text-ink">Sedang di Vendor</h2>
              <span className="pill bg-amber-50 text-amber-800 ring-amber-200">{diVendor.length} nota</span>
            </div>
            {diVendor.length === 0 ? (
              <EmptyState icon="box" title="Tidak ada barang di luar hotel" desc="Semua cucian tamu sedang berada di dalam gedung." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {diVendor.map((o) => (
                  <div key={o.id}>
                    <KartuNota o={o} />
                    <p className={`mt-1 px-1 text-[11.5px] ${o.vendorPromisedAt && o.vendorPromisedAt < Date.now() ? "font-semibold text-rose-600" : "text-ink-3"}`}>
                      {o.vendorName ? `${o.vendorName} · ` : ""}Janji retur: {tanggalJam(o.vendorPromisedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
