"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ubahPembayaran } from "@/lib/data";
import { PAYMENT_LABEL, PAYMENT_CLASS, canSetPayment } from "@/lib/status";
import { tanggalJam } from "@/lib/format";
import { Field, Toast } from "./ui";
import Icon from "./Icon";
import type { LaundryOrder, PaymentType } from "@/lib/types";

/**
 * Panel Bill & Pembayaran.
 * Hanya Front Office (dan Super Admin sebagai pemilik sistem) yang boleh mengubah.
 * Sengaja tetap bisa diubah walau nota sudah terkunci — nomor bill sering baru
 * keluar setelah cucian diantar. Setiap perubahan tercatat di riwayat nota.
 */
export default function PaymentPanel({ order }: { order: LaundryOrder }) {
  const { profile, role } = useAuth();
  const boleh = canSetPayment(role);

  const [buka, setBuka] = useState(false);
  const [bill, setBill] = useState(order.billNumber || "");
  const [jenis, setJenis] = useState<PaymentType>(order.paymentType || "unset");
  const [remark, setRemark] = useState(order.paymentRemark || "");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setBill(order.billNumber || "");
    setJenis(order.paymentType || "unset");
    setRemark(order.paymentRemark || "");
  }, [order.billNumber, order.paymentType, order.paymentRemark]);

  const jenisSekarang: PaymentType = order.paymentType || "unset";

  async function simpan() {
    setPesan(null);
    if (jenis === "unset") return setPesan("Pilih dulu status pembayarannya.");
    setProses(true);
    try {
      await ubahPembayaran(
        order,
        { billNumber: bill, paymentType: jenis, paymentRemark: remark },
        { email: profile?.email || "", name: profile?.name || "" }
      );
      setBuka(false);
      setToast("Data pembayaran tersimpan");
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan data pembayaran");
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="card px-5 py-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[16px] font-bold text-ink">Bill &amp; Pembayaran</h2>
        <span className="pill bg-brand-50 text-brand-700 ring-brand-200">Front Office</span>
      </div>

      {!buka ? (
        <>
          <Baris label="Nomor Bill" nilai={order.billNumber || "Belum diisi"} mono kosong={!order.billNumber} />
          <div className="flex items-center justify-between border-b border-line py-2.5">
            <span className="text-[13.5px] text-ink-2">Status Pembayaran</span>
            <span className={`pill ${PAYMENT_CLASS[jenisSekarang]}`}>{PAYMENT_LABEL[jenisSekarang]}</span>
          </div>
          <Baris label="Remark" nilai={order.paymentRemark || "—"} kosong={!order.paymentRemark} />
          {order.paymentAt ? (
            <p className="mt-2.5 text-[12px] text-ink-3">
              Diperbarui {tanggalJam(order.paymentAt)}
              {order.paymentBy ? ` oleh ${order.paymentBy}` : ""}
            </p>
          ) : null}

          {boleh ? (
            <button onClick={() => setBuka(true)} className="btn-ghost mt-4 w-full py-2.5 text-[13.5px]">
              <Icon name="pen" className="h-4 w-4" />
              {order.paymentType && order.paymentType !== "unset" ? "Ubah Data Pembayaran" : "Isi Data Pembayaran"}
            </button>
          ) : (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] leading-relaxed text-ink-3">
              Hanya Front Office yang boleh mengubah nomor bill dan status pembayaran. Kalau ada yang keliru,
              minta FO membetulkannya.
            </p>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <Field label="Nomor Bill" hint="Samakan dengan bill manual / PMS">
            <input className="input font-mono" value={bill} onChange={(e) => setBill(e.target.value)} placeholder="mis. 004512" />
          </Field>

          <div>
            <span className="label">Status Pembayaran</span>
            <div className="grid gap-1.5">
              {(["cash_basis", "charge_to_room", "included_breakdown"] as PaymentType[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setJenis(k)}
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left text-[13.5px] font-semibold transition ${
                    jenis === k ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-2 hover:bg-brand-50/50"
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                      jenis === k ? "border-brand-700 bg-brand-700 text-white" : "border-line"
                    }`}
                  >
                    {jenis === k && <Icon name="check" className="h-2.5 w-2.5" />}
                  </span>
                  {PAYMENT_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <Field label="Remark Pembayaran" hint="mis. termasuk paket meeting, dibayar tunai di FO">
            <input className="input" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Opsional" />
          </Field>

          {pesan && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13.5px] text-rose-800">{pesan}</div>
          )}

          <div className="flex gap-2">
            <button onClick={simpan} disabled={proses} className="btn-primary flex-1 py-2.5 text-[13.5px]">
              {proses ? "Menyimpan…" : "Simpan"}
            </button>
            <button
              onClick={() => {
                setBuka(false);
                setPesan(null);
              }}
              className="btn-ghost py-2.5 text-[13.5px]"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {toast && <Toast pesan={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function Baris({ label, nilai, mono, kosong }: { label: string; nilai: string; mono?: boolean; kosong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 last:border-0">
      <span className="text-[13.5px] text-ink-2">{label}</span>
      <span
        className={`text-right text-[13.5px] font-semibold ${mono ? "font-mono" : ""} ${
          kosong ? "text-ink-3" : "text-ink"
        }`}
      >
        {nilai}
      </span>
    </div>
  );
}
