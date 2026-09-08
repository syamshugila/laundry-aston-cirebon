"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { pantauSatuNota, buatKendala, batalkanNota } from "@/lib/data";
import { useAuth } from "@/lib/auth-context";
import { useIssues } from "@/lib/hooks";
import { Spinner, Notice, StatusPill, SlaBadge, Field, EmptyState } from "@/components/ui";
import Icon from "@/components/Icon";
import AdvanceAction from "@/components/AdvanceAction";
import PaymentPanel from "@/components/PaymentPanel";
import { rupiah, tanggalJam, lantaiDari, durasiJam } from "@/lib/format";
import { SERVICE_LABEL, TREATMENT_LABEL, STATUS_LABEL, PAYMENT_LABEL, PAYMENT_CLASS, canVerify } from "@/lib/status";
import type { LaundryOrder, IssueType } from "@/lib/types";

const JENIS_KENDALA: { v: IssueType; t: string }[] = [
  { v: "lost", t: "Barang hilang" },
  { v: "damaged", t: "Rusak / sobek" },
  { v: "discolored", t: "Luntur / berubah warna" },
  { v: "wrong_room", t: "Salah kamar" },
  { v: "late", t: "Terlambat" },
  { v: "complaint", t: "Komplain tamu" },
];

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile, role } = useAuth();
  const { issues } = useIssues();
  const [order, setOrder] = useState<LaundryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formKendala, setFormKendala] = useState(false);

  useEffect(() => {
    if (!id) return;
    const unsub = pantauSatuNota(
      id,
      (o) => {
        setOrder(o);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [id]);

  if (loading) return <Spinner label="Memuat nota…" />;
  if (error) return <Notice tone="danger" title="Gagal memuat">{error}</Notice>;
  if (!order)
    return <EmptyState icon="list" title="Nota tidak ditemukan" desc="Mungkin sudah dihapus." actionHref="/orders" actionLabel="Kembali ke daftar" />;

  const kendalaNota = issues.filter((i) => i.orderId === order.id);
  const fotoPerTahap = {
    pickup: order.photos?.filter((p) => p.stage === "pickup") || [],
    damage: order.photos?.filter((p) => p.stage === "damage") || [],
    handover: order.photos?.filter((p) => p.stage === "handover") || [],
    return: order.photos?.filter((p) => p.stage === "return") || [],
    delivery: order.photos?.filter((p) => p.stage === "delivery") || [],
  };

  return (
    <>
      <Link href="/orders" className="mb-4 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-3 hover:text-ink">
        <Icon name="chevron" className="h-3.5 w-3.5 rotate-180" /> Kembali ke daftar
      </Link>

      <div className="card mb-5 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[13px] font-semibold tracking-wide text-brand-700">{order.trackingCode}</p>
            <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink">
              Kamar {order.roomNumber} · {order.guestName}
            </h1>
            <p className="mt-1 text-[14px] text-ink-2">
              {lantaiDari(order.roomNumber)} · {SERVICE_LABEL[order.serviceType]} ·{" "}
              {order.route === "vendor" ? "Vendor" : order.route === "mixed" ? "Campuran" : "In-house"}
              {order.vendorName ? ` (${order.vendorName})` : ""}
              {order.guestPhone ? ` · ${order.guestPhone}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {order.billNumber && (
              <span className="pill bg-slate-100 font-mono text-slate-700 ring-slate-200">Bill {order.billNumber}</span>
            )}
            {order.paymentType && order.paymentType !== "unset" && (
              <span className={`pill ${PAYMENT_CLASS[order.paymentType]}`}>{PAYMENT_LABEL[order.paymentType]}</span>
            )}
            <StatusPill status={order.status} showStep />
            <SlaBadge promisedAt={order.promisedAt} done={["delivered", "pending_audit", "verified"].includes(order.status)} />
            {order.isLocked && <span className="pill bg-slate-100 text-slate-600 ring-slate-200">Terkunci</span>}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-4">
          <Info label="Dibuat" value={tanggalJam(order.createdAt)} sub={order.createdByName} />
          <Info label="Janji Selesai" value={tanggalJam(order.promisedAt)} />
          <Info label="Check-out Tamu" value={order.guestCheckoutDate || "—"} />
          <Info
            label="Waktu Proses"
            value={durasiJam(order.timestamps.picked_up, order.timestamps.verified || order.timestamps.delivered)}
          />
        </div>
      </div>

      {order.qtyMismatch && (
        <div className="mb-5">
          <Notice tone="danger" title="Selisih jumlah belum beres">
            Tamu menghitung <b>{order.qtyGuestTotal}</b> helai, hotel menghitung <b>{order.qtyHotelTotal}</b> helai.
            {order.mismatchNote ? ` Keterangan: ${order.mismatchNote}` : " Belum ada keterangan."}
          </Notice>
        </div>
      )}

      {order.openIssueCount > 0 && (
        <div className="mb-5">
          <Notice tone="danger" title={`${order.openIssueCount} kendala terbuka`}>
            Nota tidak bisa diverifikasi sampai seluruh kendala diselesaikan.{" "}
            <Link href="/issues" className="font-semibold text-brand-700 hover:underline">
              Buka register kendala →
            </Link>
          </Notice>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ---- Manifest ---- */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="text-[15px] font-bold text-ink">Manifest Item</h2>
              <span className="text-[13px] text-ink-3">{order.items.length} baris</span>
            </div>
            <div className="scroll-x">
              <table className="w-full min-w-[560px] border-collapse">
                <thead className="border-b border-line bg-slate-50/70">
                  <tr>
                    <th className="th">Item</th>
                    <th className="th">Perlakuan</th>
                    <th className="th">Rute</th>
                    <th className="th num text-right">Tamu</th>
                    <th className="th num text-right">Hotel</th>
                    <th className="th num text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      <td className="td">
                        <span className="font-semibold text-ink">{it.itemName}</span>
                        {it.isPackage && (
                          <span className="ml-2 pill bg-gold-100 text-gold-800 ring-gold-300">Paket</span>
                        )}
                        {it.note && <div className="text-[12.5px] text-gold-700">{it.note}</div>}
                      </td>
                      <td className="td">{TREATMENT_LABEL[it.treatment]}</td>
                      <td className="td">{it.route === "vendor" ? "Vendor" : "In-house"}</td>
                      <td className="td num text-right">{it.qtyGuest}</td>
                      <td className={`td num text-right font-semibold ${it.qtyGuest !== it.qtyHotel ? "text-rose-600" : "text-ink"}`}>
                        {it.qtyHotel}
                      </td>
                      <td className="td num text-right font-semibold text-ink">{rupiah(it.unitPrice * it.qtyHotel)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3.5">
              <div className="text-[13.5px] text-ink-2">
                Subtotal {rupiah(order.subtotal)}
                {order.surcharge > 0 && ` · Surcharge ${rupiah(order.surcharge)}`}
                {" · Status biaya: "}
                <b className="uppercase text-ink">{order.chargeStatus}</b>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-ink-3">Total</p>
                <p className="text-[20px] font-bold tabular-nums text-brand-700">{rupiah(order.grandTotal)}</p>
              </div>
            </div>
          </section>

          {/* ---- Bukti ---- */}
          <section className="card px-5 py-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink">Bukti Foto &amp; Tanda Tangan</h2>
            {order.photos?.length === 0 && order.signatures?.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-6 text-center text-[14px] text-ink-3">
                Belum ada bukti tersimpan untuk nota ini.
              </p>
            ) : (
              <div className="space-y-4">
                {(
                  [
                    ["pickup", "Saat Pengambilan"],
                    ["damage", "Cacat / Noda"],
                    ["handover", "Serah Terima Vendor"],
                    ["return", "Saat Diterima Kembali"],
                    ["delivery", "Saat Diantar"],
                  ] as const
                ).map(([k, label]) =>
                  fotoPerTahap[k].length ? (
                    <div key={k}>
                      <p className="label">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {fotoPerTahap[k].map((p, i) => (
                          <a
                            key={i}
                            href={p.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-line bg-slate-50 text-ink-3 transition hover:border-brand-500 hover:text-brand-700"
                          >
                            <Icon name="camera" className="h-4 w-4" />
                            <span className="text-[10px] font-semibold">Lihat</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}

                {order.signatures?.length > 0 && (
                  <div>
                    <p className="label">Tanda Tangan</p>
                    <div className="flex flex-wrap gap-2">
                      {order.signatures.map((s, i) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-line bg-white px-3 py-2 text-[12.5px] text-ink-2 transition hover:border-brand-500 hover:text-brand-700"
                        >
                          <b className="block text-ink">{s.name}</b>
                          {s.kind === "guest_pickup" ? "Saat diambil" : s.kind === "vendor_courier" ? "Kurir vendor" : "Saat diantar"} ·{" "}
                          {tanggalJam(s.at)}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ---- Riwayat ---- */}
          <section className="card px-5 py-5">
            <h2 className="mb-4 text-[15px] font-bold text-ink">Riwayat Perjalanan</h2>
            <ol className="relative space-y-4 border-l border-line pl-5">
              {[...(order.timeline || [])]
                .sort((a, b) => a.at - b.at)
                .map((t, i) => (
                  <li key={i} className="relative">
                    <span
                      className={`absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white ${
                        t.status === "issue_opened" ? "bg-rose-500" : t.status === "verified" ? "bg-emerald-600" : "bg-brand-600"
                      }`}
                    />
                    <p className="text-[14px] font-semibold text-ink">
                      {STATUS_LABEL[t.status as keyof typeof STATUS_LABEL] ||
                        (t.status === "issue_opened" ? "Kendala dibuka" : t.status === "issue_closed" ? "Kendala selesai" : "Catatan")}
                    </p>
                    <p className="text-[12.5px] text-ink-3">
                      {tanggalJam(t.at)} · {t.byName || t.by}
                    </p>
                    {t.note && <p className="mt-0.5 text-[13.5px] text-ink-2">{t.note}</p>}
                  </li>
                ))}
            </ol>
          </section>
        </div>

        {/* ---- Kolom aksi ---- */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <AdvanceAction order={order} />

          <PaymentPanel order={order} />

          <div className="card px-5 py-5">
            <h2 className="mb-3 text-[15px] font-bold text-ink">Kendala</h2>
            {kendalaNota.length > 0 && (
              <ul className="mb-3 space-y-2">
                {kendalaNota.map((k) => (
                  <li key={k.id} className="rounded-lg border border-line px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-semibold text-ink">
                        {JENIS_KENDALA.find((j) => j.v === k.type)?.t || k.type}
                      </span>
                      <span className={`pill ${k.status === "resolved" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
                        {k.status === "resolved" ? "Selesai" : "Terbuka"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-2">{k.description}</p>
                  </li>
                ))}
              </ul>
            )}

            {!formKendala ? (
              <button onClick={() => setFormKendala(true)} className="btn-ghost w-full text-rose-700">
                <Icon name="alert" className="h-4 w-4" /> Laporkan Kendala
              </button>
            ) : (
              <FormKendala
                order={order}
                actor={{ email: profile?.email || "", name: profile?.name || "" }}
                onDone={() => setFormKendala(false)}
              />
            )}
          </div>

          {canVerify(role) && !order.isLocked && order.status !== "cancelled" && (
            <TombolBatal order={order} actor={{ email: profile?.email || "", name: profile?.name || "" }} />
          )}
        </aside>
      </div>
    </>
  );
}

function Info({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.11em] text-ink-3">{label}</p>
      <p className="mt-0.5 text-[14px] font-semibold text-ink">{value}</p>
      {sub && <p className="text-[12px] text-ink-3">{sub}</p>}
    </div>
  );
}

function FormKendala({
  order,
  actor,
  onDone,
}: {
  order: LaundryOrder;
  actor: { email: string; name: string };
  onDone: () => void;
}) {
  const [type, setType] = useState<IssueType>("damaged");
  const [desc, setDesc] = useState("");
  const [nilai, setNilai] = useState(0);
  const [pihak, setPihak] = useState<"hotel" | "vendor" | "guest" | "unknown">("unknown");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan() {
    if (!desc.trim()) return setPesan("Tulis penjelasan kendalanya.");
    setProses(true);
    try {
      await buatKendala(
        {
          orderId: order.id,
          trackingCode: order.trackingCode,
          roomNumber: order.roomNumber,
          type,
          description: desc,
          photos: [],
          lossValue: nilai,
          liableParty: pihak,
          createdBy: actor.email,
        },
        actor
      );
      onDone();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan kendala");
      setProses(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Jenis Kendala">
        <select className="input" value={type} onChange={(e) => setType(e.target.value as IssueType)}>
          {JENIS_KENDALA.map((j) => (
            <option key={j.v} value={j.v}>
              {j.t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Penjelasan" required>
        <textarea className="input min-h-[80px]" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Apa yang terjadi, kapan diketahui…" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nilai Kerugian">
          <input type="number" min={0} step={1000} className="input num" value={nilai} onChange={(e) => setNilai(Number(e.target.value))} />
        </Field>
        <Field label="Pihak Bertanggung Jawab">
          <select className="input" value={pihak} onChange={(e) => setPihak(e.target.value as typeof pihak)}>
            <option value="unknown">Belum jelas</option>
            <option value="hotel">Hotel</option>
            <option value="vendor">Vendor</option>
            <option value="guest">Tamu</option>
          </select>
        </Field>
      </div>
      {pesan && <p className="text-[13px] text-rose-600">{pesan}</p>}
      <div className="flex gap-2">
        <button onClick={simpan} disabled={proses} className="btn-danger flex-1">
          {proses ? "Menyimpan…" : "Simpan Kendala"}
        </button>
        <button onClick={onDone} className="btn-ghost">
          Batal
        </button>
      </div>
    </div>
  );
}

function TombolBatal({ order, actor }: { order: LaundryOrder; actor: { email: string; name: string } }) {
  const [buka, setBuka] = useState(false);
  const [alasan, setAlasan] = useState("");
  const [proses, setProses] = useState(false);

  return (
    <div className="card px-5 py-4">
      {!buka ? (
        <button onClick={() => setBuka(true)} className="w-full text-[13px] font-semibold text-ink-3 hover:text-rose-600">
          Batalkan nota ini
        </button>
      ) : (
        <div className="space-y-2.5">
          <Field label="Alasan Pembatalan" required>
            <input className="input" value={alasan} onChange={(e) => setAlasan(e.target.value)} placeholder="mis. tamu membatalkan permintaan" />
          </Field>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                if (!alasan.trim()) return;
                setProses(true);
                await batalkanNota(order, alasan, actor);
                setProses(false);
                setBuka(false);
              }}
              disabled={proses || !alasan.trim()}
              className="btn-danger flex-1"
            >
              {proses ? "Memproses…" : "Ya, batalkan"}
            </button>
            <button onClick={() => setBuka(false)} className="btn-ghost">
              Tidak
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
