"use client";
import WorkQueue from "@/components/WorkQueue";

export default function DeliveredPage() {
  return (
    <WorkQueue
      eyebrow="Tahap 07 — 08"
      title="Sudah Diantar"
      desc="Cucian yang sudah sampai ke kamar tamu. Nota di sini menunggu audit HK Leader sebelum terkunci permanen."
      statuses={["delivered", "pending_audit"]}
      emptyTitle="Belum ada pengantaran hari ini"
      emptyDesc="Nota akan muncul di sini setelah valet menandai cucian diantar."
    />
  );
}
