"use client";
import Link from "next/link";
import { StatusPill, SlaBadge } from "./ui";
import Icon from "./Icon";
import { rupiah, tanggalJam, lantaiDari } from "@/lib/format";
import { SERVICE_LABEL } from "@/lib/status";
import type { LaundryOrder } from "@/lib/types";

export default function OrderTable({
  orders,
  showTotal = true,
  showSla = true,
}: {
  orders: LaundryOrder[];
  showTotal?: boolean;
  showSla?: boolean;
}) {
  return (
    <div className="card scroll-x">
      <table className="w-full min-w-[840px] border-collapse">
        <thead className="border-b border-line bg-slate-50/70">
          <tr>
            <th className="th">Kode Lacak</th>
            <th className="th">Kamar &amp; Tamu</th>
            <th className="th">Layanan</th>
            <th className="th num text-right">Item</th>
            {showTotal && <th className="th num text-right">Total</th>}
            <th className="th">Status</th>
            {showSla && <th className="th">Janji Selesai</th>}
            <th className="th"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-b border-line last:border-0 hover:bg-slate-50/60">
              <td className="td">
                <span className="font-mono text-[13px] font-semibold text-ink">{o.trackingCode}</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  {o.qtyMismatch && (
                    <span className="pill bg-rose-50 text-rose-700 ring-rose-200">Selisih</span>
                  )}
                  {o.openIssueCount > 0 && (
                    <span className="pill bg-rose-50 text-rose-700 ring-rose-200">
                      {o.openIssueCount} kendala
                    </span>
                  )}
                  {o.isLocked && (
                    <span className="pill bg-slate-100 text-slate-600 ring-slate-200">Terkunci</span>
                  )}
                </div>
              </td>
              <td className="td">
                <span className="font-semibold text-ink">Kamar {o.roomNumber}</span>
                <span className="ml-1.5 text-[12px] text-ink-3">{lantaiDari(o.roomNumber)}</span>
                <div className="text-[13px] text-ink-2">{o.guestName}</div>
              </td>
              <td className="td">
                <span className="text-[13.5px]">{SERVICE_LABEL[o.serviceType]}</span>
                <div className="text-[12px] text-ink-3">
                  {o.route === "vendor" ? "Vendor" : o.route === "mixed" ? "Campuran" : "In-house"}
                  {o.vendorName ? ` · ${o.vendorName}` : ""}
                </div>
              </td>
              <td className="td num text-right">
                <span className="font-semibold text-ink">{o.qtyHotelTotal}</span>
                {o.qtyMismatch && <div className="text-[12px] text-rose-600">tamu: {o.qtyGuestTotal}</div>}
              </td>
              {showTotal && (
                <td className="td num text-right">
                  <span className="font-semibold text-ink">{rupiah(o.grandTotal)}</span>
                  <div className="text-[11.5px] uppercase tracking-wide text-ink-3">{o.chargeStatus}</div>
                </td>
              )}
              <td className="td">
                <StatusPill status={o.status} showStep />
              </td>
              {showSla && (
                <td className="td">
                  <SlaBadge
                    promisedAt={o.promisedAt}
                    done={["delivered", "pending_audit", "verified"].includes(o.status)}
                  />
                  <div className="mt-0.5 text-[11.5px] text-ink-3">{tanggalJam(o.promisedAt)}</div>
                </td>
              )}
              <td className="td text-right">
                <Link
                  href={`/orders/${o.id}`}
                  className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-700 hover:underline"
                >
                  Buka <Icon name="chevron" className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
