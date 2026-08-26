"use client";
import WorkQueue from "@/components/WorkQueue";

export default function VendorReturnPage() {
  return (
    <WorkQueue
      eyebrow="Tahap 05"
      title="Terima dari Vendor"
      desc="Hitung ulang terhadap manifest dan periksa mutunya sebelum status dinaikkan. Kalau jumlah tidak cocok atau mutu gagal, buka kendala — nota tidak boleh lanjut."
      statuses={["on_vendor", "returned"]}
      emptyTitle="Tidak ada barang yang perlu diterima"
      emptyDesc="Semua kiriman vendor sudah diperiksa dan dihitung ulang."
    />
  );
}
