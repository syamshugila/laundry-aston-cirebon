"use client";
import { useMemo, useState } from "react";
import { useOrders } from "@/lib/hooks";
import { PageHeader, EmptyState, Notice, SkeletonList } from "@/components/ui";
import OrderTable from "@/components/OrderTable";
import Icon from "@/components/Icon";
import { STATUS_LABEL, STATUS_ORDER, SERVICE_LABEL , PAYMENT_LABEL } from "@/lib/status";
import { rupiah, todayKey } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

export default function OrdersPage() {
  const { orders, loading, error } = useOrders(undefined, 300);
  const [cari, setCari] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [periode, setPeriode] = useState<"all" | "today" | "week">("all");

  const hasil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    const batasMinggu = Date.now() - 7 * 24 * 3600 * 1000;
    return orders.filter((o) => {
      if (status !== "all" && o.status !== status) return false;
      if (periode === "today" && todayKey(new Date(o.createdAt)) !== todayKey()) return false;
      if (periode === "week" && o.createdAt < batasMinggu) return false;
      if (!q) return true;
      return (
        o.trackingCode.toLowerCase().includes(q) ||
        o.roomNumber.toLowerCase().includes(q) ||
        o.guestName.toLowerCase().includes(q) ||
        (o.vendorName || "").toLowerCase().includes(q)
      );
    });
  }, [orders, cari, status, periode]);

  const totalNilai = hasil.reduce((a, o) => (o.chargeStatus === "void" ? a : a + (o.grandTotal || 0)), 0);

  function ekspor() {
    const baris = [
      ["Kode Lacak", "No Bill", "Cara Bayar", "Remark Bayar", "Tanggal", "Kamar", "Tamu", "Layanan", "Rute", "Vendor", "Item Hotel", "Item Tamu", "Total", "Status", "Charge"],
      ...hasil.map((o) => [
        o.trackingCode,
        o.billNumber || "",
        PAYMENT_LABEL[o.paymentType || "unset"],
        o.paymentRemark || "",
        new Date(o.createdAt).toLocaleString("id-ID"),
        o.roomNumber,
        o.guestName,
        SERVICE_LABEL[o.serviceType],
        o.route,
        o.vendorName || "",
        String(o.qtyHotelTotal),
        String(o.qtyGuestTotal),
        String(o.grandTotal),
        STATUS_LABEL[o.status],
        o.chargeStatus,
      ]),
    ];
    const csv = baris.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laundry-${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHeader
        eyebrow="Semua Data"
        title="Daftar Nota Laundry"
        desc="Tabel induk semua nota. Gunakan pencarian untuk melacak berdasarkan kode, kamar, atau nama tamu."
        action={
          <button onClick={ekspor} disabled={!hasil.length} className="btn-ghost">
            <Icon name="chart" className="h-4 w-4" /> Ekspor CSV
          </button>
        }
      />

      <div className="card mb-4 flex flex-wrap items-end gap-3 px-4 py-3.5">
        <div className="min-w-[220px] flex-1">
          <span className="label">Cari</span>
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              className="input pl-9"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              placeholder="Kode lacak, nomor kamar, nama tamu…"
            />
          </div>
        </div>
        <div className="w-[190px]">
          <span className="label">Status</span>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}>
            <option value="all">Semua status</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
            <option value="cancelled">{STATUS_LABEL.cancelled}</option>
          </select>
        </div>
        <div className="w-[150px]">
          <span className="label">Periode</span>
          <select className="input" value={periode} onChange={(e) => setPeriode(e.target.value as "all" | "today" | "week")}>
            <option value="all">Semua</option>
            <option value="today">Hari ini</option>
            <option value="week">7 hari terakhir</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Tidak bisa memuat data">{error}</Notice>
        </div>
      )}

      {loading ? (
        <SkeletonList rows={5} />
      ) : hasil.length === 0 ? (
        <EmptyState
          icon="list"
          title="Tidak ada nota yang cocok"
          desc="Ubah kata kunci atau filter status, atau buat nota pickup baru."
          actionHref="/pickup"
          actionLabel="Buat Pickup Baru"
        />
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[13.5px] text-ink-2">
            <span>
              Menampilkan <b className="text-ink">{hasil.length}</b> nota
            </span>
            <span>
              Nilai total: <b className="text-ink tabular-nums">{rupiah(totalNilai)}</b>
            </span>
          </div>
          <OrderTable orders={hasil} />
        </>
      )}
    </>
  );
}
