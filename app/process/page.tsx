"use client";
import WorkQueue from "@/components/WorkQueue";

export default function ProcessPage() {
  return (
    <WorkQueue
      eyebrow="Tahap 03 — 04a"
      title="Sedang Diproses"
      desc="Nota yang sudah diambil dari kamar dan sedang disortir, dicuci, atau disetrika di dalam hotel. Urutan mengikuti sisa waktu janji selesai."
      statuses={["picked_up", "sorted", "in_process"]}
      emptyTitle="Tidak ada cucian dalam proses"
      emptyDesc="Semua nota sudah lewat tahap ini. Kerja bagus."
    />
  );
}
