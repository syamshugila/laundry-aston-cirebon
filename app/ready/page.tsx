"use client";
import WorkQueue from "@/components/WorkQueue";

export default function ReadyPage() {
  return (
    <WorkQueue
      eyebrow="Tahap 06"
      title="Siap Antar"
      desc="Sudah dibungkus dan siap diantar. Dikelompokkan per lantai supaya satu perjalanan trolley bisa menutup banyak kamar sekaligus."
      statuses={["ready"]}
      groupByFloor
      emptyTitle="Tidak ada yang menunggu diantar"
      emptyDesc="Semua cucian yang siap sudah sampai ke kamar tamu."
    />
  );
}
