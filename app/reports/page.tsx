"use client";
import { useMemo, useState } from "react";
import { useOrders, useIssues } from "@/lib/hooks";
import { PageHeader, Spinner, StatCard, Notice } from "@/components/ui";
import Icon from "@/components/Icon";
import { rupiah, todayKey, tanggal } from "@/lib/format";
import { STATUS_LABEL, STATUS_ORDER, SERVICE_LABEL , PAYMENT_LABEL } from "@/lib/status";

export default function ReportsPage() {
  const { orders, loading } = useOrders(undefined, 300);
  const { issues } = useIssues();
  const [hari, setHari] = useState(30);

  const batas = Date.now() - hari * 24 * 3600 * 1000;
  const rows = useMemo(() => orders.filter((o) => o.createdAt >= batas), [orders, batas]);

  const ringkas = useMemo(() => {
    const sah = rows.filter((o) => o.chargeStatus !== "void");
    const selesai = rows.filter((o) => o.timestamps.verified && o.timestamps.picked_up);
    const turnaround =
      selesai.length > 0
        ? selesai.reduce((a, o) => a + ((o.timestamps.verified || 0) - (o.timestamps.picked_up || 0)), 0) / selesai.length / 3600000
        : 0;
    const tepatWaktu = rows.filter(
      (o) => o.timestamps.delivered && o.promisedAt && o.timestamps.delivered <= o.promisedAt
    ).length;
    const adaJanji = rows.filter((o) => o.timestamps.delivered && o.promisedAt).length;
    return {
      nota: rows.length,
      item: rows.reduce((a, o) => a + (o.qtyHotelTotal || 0), 0),
      pendapatan: sah.reduce((a, o) => a + (o.grandTotal || 0), 0),
      turnaround,
      ketepatan: adaJanji ? Math.round((tepatWaktu / adaJanji) * 100) : 0,
      selisih: rows.filter((o) => o.qtyMismatch).length,
      express: rows.filter((o) => o.serviceType === "express").length,
    };
  }, [rows]);

  const perVendor = useMemo(() => {
    const m = new Map<string, { nama: string; jumlah: number; telat: number; kendala: number; item: number }>();
    rows
      .filter((o) => o.vendorId)
      .forEach((o) => {
        const k = o.vendorId as string;
        const v = m.get(k) || { nama: o.vendorName || "Vendor", jumlah: 0, telat: 0, kendala: 0, item: 0 };
        v.jumlah += 1;
        v.item += o.qtyHotelTotal || 0;
        if (o.vendorPromisedAt && o.timestamps.returned && o.timestamps.returned > o.vendorPromisedAt) v.telat += 1;
        v.kendala += issues.filter((i) => i.orderId === o.id && i.liableParty === "vendor").length;
        m.set(k, v);
      });
    return [...m.values()].sort((a, b) => b.jumlah - a.jumlah);
  }, [rows, issues]);

  const perStatus = useMemo(
    () => STATUS_ORDER.map((s) => ({ s, n: rows.filter((o) => o.status === s).length })).filter((r) => r.n > 0),
    [rows]
  );

  const perLayanan = useMemo(
    () =>
      (["regular", "same_day", "express"] as const).map((t) => ({
        t,
        n: rows.filter((o) => o.serviceType === t).length,
        nilai: rows.filter((o) => o.serviceType === t).reduce((a, o) => a + (o.grandTotal || 0), 0),
      })),
    [rows]
  );

  function ekspor() {
    const b = [
      ["Kode", "No Bill", "Cara Bayar", "Remark Bayar", "Tanggal", "Kamar", "Tamu", "Layanan", "Rute", "Vendor", "Item", "Total", "Status", "Charge", "Selisih"],
      ...rows.map((o) => [
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
        String(o.grandTotal),
        STATUS_LABEL[o.status],
        o.chargeStatus,
        o.qtyMismatch ? "YA" : "",
      ]),
    ];
    const csv = b.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `laporan-laundry-${hari}hari-${todayKey()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <>
      <PageHeader
        eyebrow="Manajemen"
        title="Laporan & Ekspor"
        desc="Angka yang layak dibawa ke rapat pagi: kecepatan, ketepatan, pendapatan, dan kinerja vendor."
        action={
          <div className="flex gap-2">
            <select className="input w-[150px]" value={hari} onChange={(e) => setHari(Number(e.target.value))}>
              <option value={7}>7 hari terakhir</option>
              <option value={30}>30 hari terakhir</option>
              <option value={90}>90 hari terakhir</option>
            </select>
            <button onClick={ekspor} disabled={!rows.length} className="btn-ghost">
              <Icon name="chart" className="h-4 w-4" /> Ekspor CSV
            </button>
          </div>
        }
      />

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Notice tone="info" title="Belum ada data pada periode ini">
          Pilih periode yang lebih panjang, atau mulai mencatat nota lewat menu Pickup Baru.
        </Notice>
      ) : (
        <>
          <p className="mb-3 text-[13.5px] text-ink-3">
            Periode {tanggal(batas)} — {tanggal(Date.now())}
          </p>

          <div className="stagger mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Nota" value={ringkas.nota} />
            <StatCard label="Total Item" value={ringkas.item} />
            <StatCard label="Nilai Laundry" value={rupiah(ringkas.pendapatan)} tone="brand" />
            <StatCard
              label="Turnaround"
              value={ringkas.turnaround > 0 ? `${ringkas.turnaround.toFixed(1)} j` : "—"}
              hint="Target < 6 jam"
              tone={ringkas.turnaround > 6 ? "warn" : "ok"}
            />
            <StatCard
              label="Ketepatan Janji"
              value={`${ringkas.ketepatan}%`}
              hint="Target ≥ 95%"
              tone={ringkas.ketepatan >= 95 ? "ok" : "warn"}
            />
            <StatCard
              label="Nota Selisih"
              value={ringkas.selisih}
              hint="Target < 1%"
              tone={ringkas.selisih > rows.length * 0.01 ? "danger" : "ok"}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Sebaran Status">
              <Tabel
                head={["Status", "Jumlah", "Porsi"]}
                rows={perStatus.map((r) => [
                  STATUS_LABEL[r.s],
                  String(r.n),
                  `${Math.round((r.n / rows.length) * 100)}%`,
                ])}
              />
            </Panel>

            <Panel title="Jenis Layanan">
              <Tabel
                head={["Layanan", "Jumlah", "Nilai"]}
                rows={perLayanan.map((r) => [SERVICE_LABEL[r.t], String(r.n), rupiah(r.nilai)])}
              />
            </Panel>

            <div className="lg:col-span-2">
              <Panel title="Kinerja Vendor">
                {perVendor.length === 0 ? (
                  <p className="px-5 py-8 text-center text-[14px] text-ink-3">
                    Belum ada nota yang dikirim ke vendor pada periode ini.
                  </p>
                ) : (
                  <Tabel
                    head={["Vendor", "Kiriman", "Item", "Retur Telat", "Kendala", "Ketepatan"]}
                    rows={perVendor.map((v) => [
                      v.nama,
                      String(v.jumlah),
                      String(v.item),
                      String(v.telat),
                      String(v.kendala),
                      `${v.jumlah ? Math.round(((v.jumlah - v.telat) / v.jumlah) * 100) : 0}%`,
                    ])}
                  />
                )}
              </Panel>
            </div>
          </div>

          <div className="mt-4">
            <Notice tone="info" title="Cara membaca angka ini">
              Turnaround dihitung dari pickup sampai terverifikasi. Ketepatan janji membandingkan waktu
              antar dengan janji selesai. Ketepatan vendor membandingkan waktu retur dengan janji retur
              yang mereka berikan sendiri — angka inilah yang dipakai saat negosiasi kontrak.
            </Notice>
          </div>
        </>
      )}
    </>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="text-[15px] font-bold text-ink">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Tabel({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="scroll-x">
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-slate-50/70">
          <tr>
            {head.map((h, i) => (
              <th key={h} className={`th ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-line last:border-0">
              {r.map((c, k) => (
                <td key={k} className={`td ${k > 0 ? "num text-right" : "font-semibold text-ink"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
