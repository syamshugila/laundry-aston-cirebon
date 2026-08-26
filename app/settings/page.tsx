"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/hooks";
import { simpanSettings } from "@/lib/data";
import { PageHeader, Spinner, Notice, Field } from "@/components/ui";
import Icon from "@/components/Icon";
import { canManageMaster } from "@/lib/status";
import { UPLOAD_URL, SUPER_ADMIN_EMAILS, HOTEL_NAME } from "@/lib/firebase";
import type { AppSettings } from "@/lib/types";

export default function SettingsPage() {
  const { role } = useAuth();
  const { settings, loading, setSettings } = useSettings();
  const [f, setF] = useState<AppSettings | null>(null);
  const [proses, setProses] = useState(false);
  const [sukses, setSukses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const nilai = f ?? settings;

  if (!canManageMaster(role)) {
    return <Notice tone="warn" title="Halaman khusus Super Admin">Hanya Super Admin yang boleh mengubah pengaturan sistem.</Notice>;
  }
  if (loading) return <Spinner />;

  async function simpan() {
    setProses(true);
    setPesan(null);
    try {
      await simpanSettings(nilai);
      setSettings(nilai);
      setSukses(true);
      setTimeout(() => setSukses(false), 2500);
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan pengaturan");
    } finally {
      setProses(false);
    }
  }

  const set = (patch: Partial<AppSettings>) => setF({ ...nilai, ...patch });

  return (
    <>
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengaturan Sistem"
        desc="Jam cut-off, target waktu, dan aturan bukti wajib. Perubahan berlaku untuk nota yang dibuat setelah disimpan."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="card px-5 py-5">
            <h2 className="mb-1 text-[15px] font-bold text-ink">Jam Kerja &amp; Janji Selesai</h2>
            <p className="mb-4 text-[13.5px] text-ink-2">
              Janji selesai dihitung otomatis dari aturan ini, sehingga tidak ada staf yang menjanjikan
              waktu yang mustahil dipenuhi.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Jam Cut-off" hint="Masuk sebelum jam ini → selesai hari yang sama">
                <input type="number" min={0} max={23} className="input num" value={nilai.cutOffHour} onChange={(e) => set({ cutOffHour: Number(e.target.value) })} />
              </Field>
              <Field label="Jam Selesai Same Day" hint="mis. 18 = pukul 18.00">
                <input type="number" min={0} max={23} className="input num" value={nilai.sameDayDoneHour} onChange={(e) => set({ sameDayDoneHour: Number(e.target.value) })} />
              </Field>
              <Field label="Jam Selesai Reguler (besok)" hint="mis. 10 = besok pukul 10.00">
                <input type="number" min={0} max={23} className="input num" value={nilai.regularDoneHour} onChange={(e) => set({ regularDoneHour: Number(e.target.value) })} />
              </Field>
              <Field label="Durasi Express (jam)" hint="Dihitung dari waktu pickup">
                <input type="number" min={1} max={24} className="input num" value={nilai.expressHours} onChange={(e) => set({ expressHours: Number(e.target.value) })} />
              </Field>
              <Field label="Surcharge Express (%)" hint="Ditambahkan di atas subtotal">
                <input type="number" min={0} max={200} className="input num" value={nilai.expressSurchargePct} onChange={(e) => set({ expressSurchargePct: Number(e.target.value) })} />
              </Field>
              <Field label="Target Respons Jemput (menit)" hint="SOP hotel umumnya 5 menit">
                <input type="number" min={1} max={60} className="input num" value={nilai.pickupResponseMinutes} onChange={(e) => set({ pickupResponseMinutes: Number(e.target.value) })} />
              </Field>
            </div>
          </section>

          <section className="card px-5 py-5">
            <h2 className="mb-1 text-[15px] font-bold text-ink">Aturan Bukti</h2>
            <p className="mb-4 text-[13.5px] text-ink-2">
              Semakin ketat aturannya, semakin mudah sengketa tamu diputus dari data.
            </p>
            <div className="space-y-3">
              <Sakelar
                aktif={nilai.requirePickupPhoto}
                onChange={(v) => set({ requirePickupPhoto: v })}
                judul="Wajib foto saat pengambilan"
                isi="Nota tidak bisa disimpan sebelum ada foto isi tas."
              />
              <Sakelar
                aktif={nilai.requireGuestSignature}
                onChange={(v) => set({ requireGuestSignature: v })}
                judul="Wajib tanda tangan tamu"
                isi="Hati-hati: tamu sering tidak ada di kamar saat cucian diambil."
              />
            </div>
          </section>

          <section className="card px-5 py-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink">Identitas Hotel</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nama Hotel">
                <input className="input" value={nilai.hotelName} onChange={(e) => set({ hotelName: e.target.value })} />
              </Field>
              <Field label="Kode Hotel" hint="Awalan kode lacak, mis. ACR-260821-0142">
                <input className="input" value={nilai.hotelCode} onChange={(e) => set({ hotelCode: e.target.value.toUpperCase() })} maxLength={5} />
              </Field>
            </div>
          </section>

          {pesan && <Notice tone="danger" title="Gagal menyimpan">{pesan}</Notice>}

          <div className="flex items-center gap-3">
            <button onClick={simpan} disabled={proses} className="btn-primary">
              {proses ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Icon name="check" className="h-4 w-4" /> Simpan Pengaturan
                </>
              )}
            </button>
            {sukses && <span className="text-[14px] font-semibold text-emerald-700">Tersimpan ✓</span>}
          </div>
        </div>

        <aside className="space-y-4 lg:h-fit">
          <div className="card px-5 py-5">
            <h2 className="mb-3 text-[15px] font-bold text-ink">Status Sambungan</h2>
            <Baris label="Nama hotel (ENV)" nilai={HOTEL_NAME} />
            <Baris label="Upload foto ke Drive" nilai={UPLOAD_URL ? "Aktif" : "Belum diisi"} ok={Boolean(UPLOAD_URL)} />
            <Baris label="Super Admin" nilai={SUPER_ADMIN_EMAILS.join(", ")} />
            <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
              Nilai-nilai ini berasal dari Environment Variable di Vercel, bukan dari database. Ubah di
              Vercel → Settings → Environment Variables, lalu deploy ulang.
            </p>
          </div>

          <div className="card px-5 py-5">
            <h2 className="mb-2 text-[15px] font-bold text-ink">Contoh Perhitungan</h2>
            <p className="text-[13.5px] leading-relaxed text-ink-2">
              Cucian masuk pukul 09.00 (sebelum cut-off {nilai.cutOffHour}.00) → janji selesai hari ini
              pukul {nilai.sameDayDoneHour}.00. Masuk pukul 14.00 → besok pukul {nilai.regularDoneHour}.00.
              Express → {nilai.expressHours} jam dari sekarang, dengan tambahan biaya {nilai.expressSurchargePct}%.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Sakelar({ aktif, onChange, judul, isi }: { aktif: boolean; onChange: (v: boolean) => void; judul: string; isi: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!aktif)}
      className={`flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition ${
        aktif ? "border-brand-300 bg-brand-50/60" : "border-line bg-white hover:bg-slate-50"
      }`}
    >
      <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded border ${aktif ? "border-brand-700 bg-brand-700 text-white" : "border-line bg-white"}`}>
        {aktif && <Icon name="check" className="h-3.5 w-3.5" />}
      </span>
      <span>
        <span className="block text-[14.5px] font-semibold text-ink">{judul}</span>
        <span className="block text-[13px] text-ink-2">{isi}</span>
      </span>
    </button>
  );
}

function Baris({ label, nilai, ok }: { label: string; nilai: string; ok?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-line py-2 last:border-0">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span className={`text-right text-[13px] font-semibold ${ok === false ? "text-gold-700" : "text-ink"}`}>{nilai}</span>
    </div>
  );
}
