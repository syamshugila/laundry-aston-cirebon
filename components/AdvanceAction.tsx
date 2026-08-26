"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ubahStatus, ambilVendor } from "@/lib/data";
import { STATUS_LABEL, canSetStatus, canVerify, nextStatuses } from "@/lib/status";
import { Notice, Field } from "./ui";
import Icon from "./Icon";
import PhotoPicker from "./PhotoPicker";
import SignaturePad from "./SignaturePad";
import { uploadKeDrive, uploadReady } from "@/lib/upload";
import type { LaundryOrder, OrderStatus, OrderItem, Vendor, PhotoRef, SignatureRef } from "@/lib/types";

/**
 * Panel aksi: menampilkan tombol status berikutnya yang boleh ditekan
 * oleh peran pengguna, lengkap dengan formulir tambahan sesuai tahapnya.
 */
export default function AdvanceAction({ order }: { order: LaundryOrder }) {
  const { profile, role } = useAuth();
  const [target, setTarget] = useState<OrderStatus | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);
  const [sukses, setSukses] = useState(false);

  // form tambahan
  const [catatan, setCatatan] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [vendorJanji, setVendorJanji] = useState("");
  const [qcLolos, setQcLolos] = useState(true);
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [foto, setFoto] = useState<string[]>([]);
  const [ttd, setTtd] = useState<string | null>(null);
  const [cek, setCek] = useState({ foto: false, jumlah: false, ttd: false, biaya: false });

  useEffect(() => {
    ambilVendor()
      .then((v) => setVendors(v.filter((x) => x.active !== false)))
      .catch(() => setVendors([]));
  }, []);

  useEffect(() => {
    setItems(order.items);
  }, [order.items]);

  const pilihan = nextStatuses(order.status, order.route).filter((s) => canSetStatus(role, s));
  const bolehVerifikasi = order.status === "pending_audit" && canVerify(role);

  if (order.isLocked) {
    return (
      <Notice tone="ok" title="Nota terkunci">
        Sudah diverifikasi HK Leader dan tidak bisa diubah lagi. Perubahan hanya bisa lewat pembatalan
        oleh Super Admin, yang tetap meninggalkan jejak di riwayat.
      </Notice>
    );
  }

  if (order.status === "cancelled") {
    return <Notice tone="warn" title="Nota dibatalkan">Nota ini sudah dibatalkan.</Notice>;
  }

  if (pilihan.length === 0) {
    return (
      <Notice tone="info" title="Menunggu peran lain">
        Tahap berikutnya (
        {nextStatuses(order.status, order.route).map((s) => STATUS_LABEL[s]).join(" / ") || "—"}
        ) bukan wewenang peran Anda.
      </Notice>
    );
  }

  async function jalankan(t: OrderStatus) {
    setPesan(null);
    const actor = { email: profile?.email || "", name: profile?.name || profile?.email || "" };

    // Aturan pengaman per tahap
    if (t === "on_vendor" && !vendorId) return setPesan("Pilih vendor tujuan lebih dulu.");
    if (t === "returned") {
      const totalBaru = items.reduce((a, i) => a + (i.qtyHotel || 0), 0);
      if (totalBaru !== order.qtyHotelTotal && !catatan.trim())
        return setPesan("Jumlah berubah saat retur. Tulis keterangannya di kolom catatan.");
      if (!qcLolos && !catatan.trim()) return setPesan("QC gagal — tulis alasannya di kolom catatan.");
    }
    if (t === "verified") {
      if (!cek.foto || !cek.jumlah || !cek.biaya)
        return setPesan("Centang semua butir pemeriksaan sebelum mengunci nota.");
      if (order.openIssueCount > 0) return setPesan("Masih ada kendala terbuka. Selesaikan dulu di menu Kendala.");
    }

    setProses(true);
    try {
      const now = Date.now();
      const photos: PhotoRef[] = foto.map((url) => ({
        url,
        stage: t === "on_vendor" ? "handover" : t === "returned" ? "return" : t === "delivered" ? "delivery" : "pickup",
        at: now,
        by: actor.email,
      }));

      const signatures: SignatureRef[] = [];
      if (ttd && uploadReady) {
        try {
          const url = await uploadKeDrive(ttd, `ttd-${t}-${order.trackingCode}`);
          signatures.push({
            url,
            kind: t === "on_vendor" ? "vendor_courier" : "guest_delivery",
            name: t === "on_vendor" ? vendors.find((v) => v.id === vendorId)?.name || "Kurir vendor" : order.guestName,
            at: now,
          });
        } catch {
          /* tanda tangan gagal diunggah — status tetap dinaikkan */
        }
      }

      await ubahStatus(order, t, actor, {
        note: catatan,
        photos,
        signatures,
        ...(t === "on_vendor"
          ? {
              vendorId,
              vendorName: vendors.find((v) => v.id === vendorId)?.name || "",
              vendorPromisedAt: vendorJanji ? new Date(vendorJanji).getTime() : null,
              handoverNote: catatan,
            }
          : {}),
        ...(t === "returned" ? { items, qcPassed: qcLolos, qcNote: catatan } : {}),
      });

      setSukses(true);
      setTarget(null);
      setCatatan("");
      setFoto([]);
      setTtd(null);
      setTimeout(() => setSukses(false), 2500);
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal mengubah status");
    } finally {
      setProses(false);
    }
  }

  return (
    <div className="card px-5 py-5">
      <h2 className="mb-1 text-[15px] font-bold text-ink">Tahap Berikutnya</h2>
      <p className="mb-4 text-[13px] text-ink-3">
        Status sekarang: <b className="text-ink-2">{STATUS_LABEL[order.status]}</b>
      </p>

      {sukses && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-[13.5px] font-semibold text-emerald-800">
          Tersimpan ✓
        </div>
      )}

      {!target ? (
        <div className="space-y-2">
          {pilihan.map((s) => (
            <button
              key={s}
              onClick={() => {
                setTarget(s);
                setPesan(null);
              }}
              className={`w-full ${s === "verified" ? "btn-primary" : "btn-ghost"} justify-between py-3`}
            >
              <span>Tandai: {STATUS_LABEL[s]}</span>
              <Icon name="chevron" className="h-4 w-4" />
            </button>
          ))}
          {order.status === "pending_audit" && !bolehVerifikasi && (
            <p className="pt-1 text-[12.5px] text-ink-3">Verifikasi hanya bisa dilakukan HK Leader atau Super Admin.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-bold text-ink">→ {STATUS_LABEL[target]}</p>
            <button onClick={() => setTarget(null)} className="text-[12.5px] font-semibold text-ink-3 hover:text-ink">
              Batal
            </button>
          </div>

          {/* ---- Formulir khusus: kirim ke vendor ---- */}
          {target === "on_vendor" && (
            <>
              <Field label="Vendor Tujuan" required>
                <select className="input" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                  <option value="">— Pilih vendor —</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (SLA {v.slaHours} jam)
                    </option>
                  ))}
                </select>
                {vendors.length === 0 && (
                  <p className="mt-1 text-[12.5px] text-amber-700">
                    Belum ada vendor terdaftar. Tambahkan lebih dulu di Master Data.
                  </p>
                )}
              </Field>
              <Field label="Janji Retur dari Vendor" hint="Dasar alarm keterlambatan vendor.">
                <input type="datetime-local" className="input" value={vendorJanji} onChange={(e) => setVendorJanji(e.target.value)} />
              </Field>
              <PhotoPicker label="Foto muatan sebelum dibawa" prefix={`handover-${order.trackingCode}`} urls={foto} onChange={setFoto} max={4} />
              <SignaturePad label="Tanda tangan kurir vendor" onChange={setTtd} />
            </>
          )}

          {/* ---- Formulir khusus: retur & QC ---- */}
          {target === "returned" && (
            <>
              <div>
                <span className="label">Hitung Ulang Item</span>
                <div className="space-y-1.5 rounded-lg border border-line p-2.5">
                  {items.map((it, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink-2">{it.itemName}</span>
                      <input
                        type="number"
                        min={0}
                        value={it.qtyHotel}
                        onChange={(e) =>
                          setItems(items.map((x, k) => (k === i ? { ...x, qtyHotel: Number(e.target.value) } : x)))
                        }
                        className="input w-20 py-1.5 text-center num"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-1.5 text-[12.5px] text-ink-3">
                  Manifest awal: <b>{order.qtyHotelTotal}</b> helai · sekarang:{" "}
                  <b className={items.reduce((a, i) => a + i.qtyHotel, 0) !== order.qtyHotelTotal ? "text-rose-600" : "text-ink-2"}>
                    {items.reduce((a, i) => a + i.qtyHotel, 0)}
                  </b>{" "}
                  helai
                </p>
              </div>

              <div>
                <span className="label">Hasil Pemeriksaan Mutu</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setQcLolos(true)}
                    className={`rounded-lg border px-3 py-2.5 text-[13.5px] font-semibold ${qcLolos ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-line bg-white text-ink-2"}`}
                  >
                    Lolos QC
                  </button>
                  <button
                    type="button"
                    onClick={() => setQcLolos(false)}
                    className={`rounded-lg border px-3 py-2.5 text-[13.5px] font-semibold ${!qcLolos ? "border-rose-300 bg-rose-50 text-rose-800" : "border-line bg-white text-ink-2"}`}
                  >
                    Gagal QC
                  </button>
                </div>
              </div>
              <PhotoPicker label="Foto kondisi saat diterima" prefix={`return-${order.trackingCode}`} urls={foto} onChange={setFoto} max={4} />
            </>
          )}

          {/* ---- Formulir khusus: diantar ---- */}
          {target === "delivered" && (
            <>
              <PhotoPicker
                label="Foto penempatan di kamar"
                hint="Bila tamu tidak ada, foto ini adalah buktinya."
                prefix={`delivery-${order.trackingCode}`}
                urls={foto}
                onChange={setFoto}
                max={4}
              />
              <SignaturePad label="Tanda tangan tamu (bila tamu ada)" onChange={setTtd} />
            </>
          )}

          {/* ---- Formulir khusus: verifikasi ---- */}
          {target === "verified" && (
            <div className="space-y-2 rounded-lg border border-line bg-slate-50/60 p-3.5">
              <p className="text-[12.5px] font-bold uppercase tracking-wider text-ink-3">Daftar Periksa HK Leader</p>
              {[
                { k: "foto" as const, t: `Bukti foto lengkap (${order.photos?.length || 0} foto tersimpan)` },
                { k: "jumlah" as const, t: `Jumlah cocok — tamu ${order.qtyGuestTotal} vs hotel ${order.qtyHotelTotal}` },
                { k: "ttd" as const, t: `Tanda tangan tersedia (${order.signatures?.length || 0} tanda tangan)` },
                { k: "biaya" as const, t: "Biaya sudah sesuai daftar tarif" },
              ].map((c) => (
                <label key={c.k} className="flex items-start gap-2.5 text-[13.5px] text-ink-2">
                  <input
                    type="checkbox"
                    checked={cek[c.k]}
                    onChange={(e) => setCek({ ...cek, [c.k]: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-line text-brand-700 focus:ring-brand-500"
                  />
                  <span>{c.t}</span>
                </label>
              ))}
              <p className="pt-1 text-[12.5px] text-amber-700">
                Setelah dikunci, nota tidak bisa diubah oleh siapa pun.
              </p>
            </div>
          )}

          <Field label="Catatan" hint="Tercatat permanen di riwayat nota.">
            <input className="input" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Opsional…" />
          </Field>

          {pesan && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13.5px] text-rose-800">{pesan}</div>
          )}

          <button onClick={() => jalankan(target)} disabled={proses} className="btn-primary w-full py-3">
            {proses ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Menyimpan…
              </>
            ) : (
              <>
                <Icon name={target === "verified" ? "lock" : "check"} className="h-4 w-4" />
                {target === "verified" ? "Verifikasi & Kunci Nota" : `Simpan sebagai ${STATUS_LABEL[target]}`}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
