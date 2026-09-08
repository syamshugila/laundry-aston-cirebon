"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useRequests } from "@/lib/hooks";
import { buatPermintaan, batalkanPermintaan } from "@/lib/data";
import { PageHeader, EmptyState, Notice, Field, SkeletonList, StatCard, Toast } from "@/components/ui";
import Icon from "@/components/Icon";
import { tanggalJam, todayKey, sisaWaktu, lantaiDari } from "@/lib/format";
import { SERVICE_LABEL, PAYMENT_LABEL, canCreateRequest, canConvertRequest } from "@/lib/status";
import type { PickupRequest, ServiceType, PaymentType } from "@/lib/types";

export default function RequestsPage() {
  const { role, profile } = useAuth();
  const { requests, loading, error } = useRequests();
  const [tab, setTab] = useState<"open" | "done">("open");
  const [formBuka, setFormBuka] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const terbuka = useMemo(() => requests.filter((r) => r.status === "open"), [requests]);
  const selesai = useMemo(() => requests.filter((r) => r.status !== "open"), [requests]);
  const rows = tab === "open" ? terbuka : selesai;

  const lewatWaktu = terbuka.filter((r) => Date.now() - r.createdAt > 5 * 60 * 1000);

  if (!canCreateRequest(role) && !canConvertRequest(role)) {
    return (
      <Notice tone="warn" title="Tidak punya akses">
        Halaman ini untuk Front Office (membuat permintaan) dan tim Housekeeping (memprosesnya).
      </Notice>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Tahap 01"
        title="Permintaan Masuk"
        desc="Front Office mencatat permintaan tamu di sini. Housekeeping yang mengubahnya menjadi nota pickup — data tamu terbawa otomatis, tinggal isi manifest dan foto."
        action={
          canCreateRequest(role) ? (
            <button onClick={() => setFormBuka((v) => !v)} className={formBuka ? "btn-ghost" : "btn-primary"}>
              <Icon name={formBuka ? "close" : "plus"} className="h-4 w-4" />
              {formBuka ? "Tutup Formulir" : "Permintaan Baru"}
            </button>
          ) : undefined
        }
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Tidak bisa memuat data">{error}</Notice>
        </div>
      )}

      <div className="stagger mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Menunggu Dijemput" value={terbuka.length} tone={terbuka.length ? "warn" : "ok"} hint="Belum jadi nota" icon="clock" />
        <StatCard label="Lewat 5 Menit" value={lewatWaktu.length} tone={lewatWaktu.length ? "danger" : "ok"} hint="Target respons SOP" icon="alert" />
        <StatCard label="Sudah Diproses" value={selesai.filter((r) => r.status === "converted").length} tone="ok" hint="Menjadi nota pickup" icon="check" />
        <StatCard label="Dibatalkan" value={selesai.filter((r) => r.status === "cancelled").length} hint="Tamu membatalkan" icon="close" />
      </div>

      {formBuka && canCreateRequest(role) && (
        <FormPermintaan
          actor={{ email: profile?.email || "", name: profile?.name || "" }}
          bolehIsiBayar={role === "front_office" || role === "super_admin"}
          onDone={() => {
            setFormBuka(false);
            setToast("Permintaan terkirim ke Housekeeping");
          }}
        />
      )}

      {lewatWaktu.length > 0 && (
        <div className="mb-4">
          <Notice tone="danger" title={`${lewatWaktu.length} permintaan lewat 5 menit`}>
            SOP hotel menetapkan penjemputan dalam lima menit sejak tamu menelepon. Hubungi valet lewat radio sekarang.
          </Notice>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {(
          [
            ["open", `Menunggu (${terbuka.length})`],
            ["done", `Riwayat (${selesai.length})`],
          ] as const
        ).map(([v, t]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`rounded-lg px-4 py-2 text-[13.5px] font-semibold transition ${
              tab === v ? "bg-brand-700 text-white" : "border border-line bg-white text-ink-2 hover:bg-brand-50/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonList rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={tab === "open" ? "check" : "list"}
          title={tab === "open" ? "Tidak ada permintaan menunggu" : "Belum ada riwayat"}
          desc={
            tab === "open"
              ? "Semua permintaan tamu sudah dijemput dan menjadi nota."
              : "Permintaan yang sudah diproses atau dibatalkan akan muncul di sini."
          }
        />
      ) : (
        <div className="stagger space-y-3">
          {rows.map((r) => (
            <KartuPermintaan key={r.id} r={r} bolehProses={canConvertRequest(role)} onToast={setToast} />
          ))}
        </div>
      )}

      {toast && <Toast pesan={toast} onClose={() => setToast(null)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Formulir permintaan baru (Front Office)                             */
/* ------------------------------------------------------------------ */
function FormPermintaan({
  actor,
  bolehIsiBayar,
  onDone,
}: {
  actor: { email: string; name: string };
  bolehIsiBayar: boolean;
  onDone: () => void;
}) {
  const [room, setRoom] = useState("");
  const [guest, setGuest] = useState("");
  const [phone, setPhone] = useState("");
  const [checkout, setCheckout] = useState("");
  const [service, setService] = useState<ServiceType>("regular");
  const [note, setNote] = useState("");
  const [bill, setBill] = useState("");
  const [payment, setPayment] = useState<PaymentType>("unset");
  const [remark, setRemark] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan() {
    if (!room.trim()) return setPesan("Nomor kamar wajib diisi.");
    if (!guest.trim()) return setPesan("Nama tamu wajib diisi.");
    setProses(true);
    setPesan(null);
    try {
      await buatPermintaan(
        {
          roomNumber: room.trim(),
          guestName: guest.trim(),
          guestPhone: phone.trim(),
          guestCheckoutDate: checkout,
          serviceType: service,
          note: note.trim(),
          billNumber: bill.trim(),
          paymentType: payment,
          paymentRemark: remark.trim(),
        },
        actor
      );
      onDone();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan permintaan");
      setProses(false);
    }
  }

  return (
    <div className="card mb-5 animate-fadeUp px-5 py-5">
      <h2 className="mb-1 font-display text-[16px] font-bold text-ink">Permintaan Penjemputan Baru</h2>
      <p className="mb-4 text-[13.5px] text-ink-2">
        Isi data tamu saja. Jumlah cucian dihitung valet bersama tamu di kamar.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nomor Kamar" required>
          <input className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="mis. 812" inputMode="numeric" />
        </Field>
        <Field label="Nama Tamu" required>
          <input className="input" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="mis. Ny. Ratna S." />
        </Field>
        <Field label="Nomor HP Tamu">
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx" inputMode="tel" />
        </Field>
        <Field label="Tanggal Check-out" hint="Dasar peringatan cucian tertinggal">
          <input className="input" type="date" min={todayKey()} value={checkout} onChange={(e) => setCheckout(e.target.value)} />
        </Field>
      </div>

      <div className="mt-4">
        <span className="label">Jenis Layanan Diminta Tamu</span>
        <div className="grid grid-cols-3 gap-2 sm:max-w-md">
          {(["regular", "same_day", "express"] as ServiceType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setService(t)}
              className={`rounded-lg border px-3 py-2.5 text-[13.5px] font-semibold transition ${
                service === t ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-ink-2 hover:bg-brand-50/50"
              }`}
            >
              {SERVICE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>

      {bolehIsiBayar && (
        <div className="mt-4 rounded-lg border border-line bg-brand-50/40 px-4 py-4">
          <h3 className="mb-3 text-[12.5px] font-bold uppercase tracking-wider text-brand-700">
            Data Pembayaran — diisi Front Office
          </h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Nomor Bill" hint="Samakan dengan bill manual / PMS">
              <input className="input font-mono" value={bill} onChange={(e) => setBill(e.target.value)} placeholder="mis. 004512" />
            </Field>
            <Field label="Status Pembayaran">
              <select className="input" value={payment} onChange={(e) => setPayment(e.target.value as PaymentType)}>
                {(Object.keys(PAYMENT_LABEL) as PaymentType[]).map((k) => (
                  <option key={k} value={k}>
                    {PAYMENT_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Remark Pembayaran" hint="mis. termasuk paket meeting">
              <input className="input" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Opsional" />
            </Field>
          </div>
        </div>
      )}

      <div className="mt-4">
        <Field label="Catatan untuk Housekeeping" hint="mis. tamu minta dijemput setelah pukul 14.00">
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opsional" />
        </Field>
      </div>

      {pesan && (
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13.5px] text-rose-800">{pesan}</div>
      )}

      <button onClick={simpan} disabled={proses} className="btn-primary mt-4">
        {proses ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Mengirim…
          </>
        ) : (
          <>
            <Icon name="check" className="h-4 w-4" /> Kirim ke Housekeeping
          </>
        )}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Kartu permintaan                                                    */
/* ------------------------------------------------------------------ */
function KartuPermintaan({
  r,
  bolehProses,
  onToast,
}: {
  r: PickupRequest;
  bolehProses: boolean;
  onToast: (s: string) => void;
}) {
  const [batalBuka, setBatalBuka] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [proses, setProses] = useState(false);

  const menit = Math.round((Date.now() - r.createdAt) / 60000);
  const telat = r.status === "open" && menit > 5;

  return (
    <div className={`card px-5 py-4 ${telat ? "border-l-[3px] border-l-rose-500" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-display text-[16px] font-bold text-ink">Kamar {r.roomNumber}</span>
            <span className="text-[11.5px] text-ink-3">{lantaiDari(r.roomNumber)}</span>
            <span className="pill bg-slate-100 text-slate-600 ring-slate-200">{SERVICE_LABEL[r.serviceType]}</span>
            {r.status === "open" && (
              <span className={`pill ${telat ? "bg-rose-50 text-rose-700 ring-rose-200" : "bg-gold-50 text-gold-800 ring-gold-200"}`}>
                {telat ? `Menunggu ${menit} mnt` : "Menunggu dijemput"}
              </span>
            )}
            {r.status === "converted" && <span className="pill bg-emerald-50 text-emerald-700 ring-emerald-200">Sudah jadi nota</span>}
            {r.status === "cancelled" && <span className="pill bg-slate-100 text-slate-600 ring-slate-200">Dibatalkan</span>}
          </div>

          <p className="mt-1 text-[14.5px] text-ink-2">{r.guestName}{r.guestPhone ? ` · ${r.guestPhone}` : ""}</p>
          {r.note && <p className="mt-1 text-[13.5px] text-gold-800">Catatan: {r.note}</p>}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
            <span>Dicatat {tanggalJam(r.createdAt)} oleh {r.createdByName || r.createdBy}</span>
            {r.billNumber && <span className="font-mono">Bill {r.billNumber}</span>}
            {r.paymentType && r.paymentType !== "unset" && <span>{PAYMENT_LABEL[r.paymentType]}</span>}
            {r.guestCheckoutDate && <span>Check-out {r.guestCheckoutDate}</span>}
          </div>
          {r.status === "cancelled" && r.cancelNote && (
            <p className="mt-1.5 text-[13px] text-ink-2">Alasan batal: {r.cancelNote}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          {r.status === "open" && bolehProses && (
            <Link href={`/pickup?req=${r.id}`} className="btn-primary py-2 text-[13px]">
              <Icon name="chevron" className="h-4 w-4" /> Proses Jadi Pickup
            </Link>
          )}
          {r.status === "converted" && r.orderId && (
            <Link href={`/orders/${r.orderId}`} className="text-[13px] font-semibold text-brand-700 hover:underline">
              Buka notanya →
            </Link>
          )}
          {r.status === "open" && bolehProses && !batalBuka && (
            <button onClick={() => setBatalBuka(true)} className="text-[12.5px] font-semibold text-ink-3 hover:text-rose-600">
              Batalkan
            </button>
          )}
        </div>
      </div>

      {batalBuka && (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
          <div className="min-w-[220px] flex-1">
            <Field label="Alasan Pembatalan" required>
              <input className="input" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="mis. tamu membatalkan" />
            </Field>
          </div>
          <button
            onClick={async () => {
              if (!alasan.trim()) return;
              setProses(true);
              await batalkanPermintaan(r.id, alasan.trim());
              setProses(false);
              setBatalBuka(false);
              onToast("Permintaan dibatalkan");
            }}
            disabled={proses || !alasan.trim()}
            className="btn-danger py-2.5 text-[13px]"
          >
            {proses ? "Memproses…" : "Ya, batalkan"}
          </button>
          <button onClick={() => setBatalBuka(false)} className="btn-ghost py-2.5 text-[13px]">
            Tidak
          </button>
        </div>
      )}
    </div>
  );
}
