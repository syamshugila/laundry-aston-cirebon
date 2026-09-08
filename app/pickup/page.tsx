"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/hooks";
import {
  ambilDaftarHarga,
  ambilPermintaan,
  buatNota,
  hitungTotal,
  hitungRoute,
  tandaiPermintaanDiproses,
} from "@/lib/data";
import { KATALOG_AWAL } from "@/lib/catalog";
import {
  SERVICE_LABEL,
  TREATMENT_LABEL,
  PAYMENT_LABEL,
  canCreateOrder,
  canSetPayment,
  computePromisedAt,
} from "@/lib/status";
import { rupiah, tanggalJam, todayKey } from "@/lib/format";
import { PageHeader, Field, Notice, Spinner } from "@/components/ui";
import Icon from "@/components/Icon";
import PhotoPicker from "@/components/PhotoPicker";
import SignaturePad from "@/components/SignaturePad";
import { uploadKeDrive, uploadReady } from "@/lib/upload";
import type {
  OrderItem,
  PriceItem,
  ServiceType,
  Treatment,
  PhotoRef,
  SignatureRef,
  PaymentType,
} from "@/lib/types";

export default function PickupPage() {
  return (
    <Suspense fallback={<Spinner label="Menyiapkan formulir…" />}>
      <FormPickup />
    </Suspense>
  );
}

function FormPickup() {
  const router = useRouter();
  const params = useSearchParams();
  const reqId = params.get("req");
  const { profile, role } = useAuth();
  const { settings } = useSettings();

  const [katalog, setKatalog] = useState<PriceItem[]>(KATALOG_AWAL);
  const [kategoriAktif, setKategoriAktif] = useState<string>("Semua");
  const [room, setRoom] = useState("");
  const [guest, setGuest] = useState("");
  const [phone, setPhone] = useState("");
  const [checkout, setCheckout] = useState("");
  const [service, setService] = useState<ServiceType>("regular");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [mismatchNote, setMismatchNote] = useState("");
  const [fotoPickup, setFotoPickup] = useState<string[]>([]);
  const [fotoCacat, setFotoCacat] = useState<string[]>([]);
  const [ttd, setTtd] = useState<string | null>(null);
  const [simpan, setSimpan] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  // --- data pembayaran ---
  const [bill, setBill] = useState("");
  const [payment, setPayment] = useState<PaymentType>("unset");
  const [remark, setRemark] = useState("");

  // --- asal permintaan Front Office ---
  const [asalPermintaan, setAsalPermintaan] = useState<{ id: string; oleh: string; catatan: string } | null>(null);

  useEffect(() => {
    ambilDaftarHarga()
      .then((r) => {
        if (r.length) setKatalog(r.filter((i) => i.active !== false));
      })
      .catch(() => {
        /* offline / belum ada data: pakai katalog awal */
      });
  }, []);

  // Kalau dibuka dari menu Permintaan Masuk, isi otomatis data tamunya.
  useEffect(() => {
    if (!reqId) return;
    ambilPermintaan(reqId)
      .then((r) => {
        if (!r) return;
        setRoom(r.roomNumber || "");
        setGuest(r.guestName || "");
        setPhone(r.guestPhone || "");
        setCheckout(r.guestCheckoutDate || "");
        setService(r.serviceType || "regular");
        setBill(r.billNumber || "");
        setPayment(r.paymentType || "unset");
        setRemark(r.paymentRemark || "");
        setAsalPermintaan({ id: r.id, oleh: r.createdByName || r.createdBy, catatan: r.note || "" });
      })
      .catch(() => setPesan("Permintaan tidak bisa dimuat. Isi datanya manual saja."));
  }, [reqId]);

  const qtyGuest = items.reduce((a, i) => a + (i.qtyGuest || 0), 0);
  const qtyHotel = items.reduce((a, i) => a + (i.qtyHotel || 0), 0);
  const selisih = qtyGuest !== qtyHotel;
  const total = useMemo(() => hitungTotal(items, service, settings), [items, service, settings]);
  const janji = useMemo(() => computePromisedAt(service, new Date(), settings), [service, settings]);

  const kategori = useMemo(() => {
    const k = Array.from(new Set(katalog.map((p) => p.category)));
    // Paket ditaruh paling depan supaya gampang dicari saat tamu ambil paket.
    k.sort((a, b) => (a === "Paket" ? -1 : b === "Paket" ? 1 : a.localeCompare(b)));
    return ["Semua", ...k];
  }, [katalog]);

  const katalogTampil = useMemo(
    () => (kategoriAktif === "Semua" ? katalog : katalog.filter((p) => p.category === kategoriAktif)),
    [katalog, kategoriAktif]
  );

  function tambahItem(p: PriceItem) {
    const treatment = (Object.keys(p.prices)[0] || (p.isPackage ? "package" : "wash_press")) as Treatment;
    setItems((old) => [
      ...old,
      {
        itemCode: p.id,
        itemName: p.itemName,
        treatment,
        route: p.defaultRoute,
        qtyGuest: 1,
        qtyHotel: 1,
        unitPrice: p.prices[treatment] || 0,
        isPackage: p.isPackage === true,
        note: "",
      },
    ]);
  }

  function ubahItem(i: number, patch: Partial<OrderItem>) {
    setItems((old) =>
      old.map((it, k) => {
        if (k !== i) return it;
        const baru = { ...it, ...patch };
        if (patch.treatment) {
          const p = katalog.find((x) => x.id === it.itemCode);
          baru.unitPrice = p?.prices[patch.treatment] ?? it.unitPrice;
        }
        return baru;
      })
    );
  }

  async function kirim() {
    setPesan(null);
    if (!room.trim()) return setPesan("Nomor kamar wajib diisi.");
    if (!guest.trim()) return setPesan("Nama tamu wajib diisi.");
    if (!items.length) return setPesan("Tambahkan minimal satu item cucian.");
    if (items.some((i) => i.qtyHotel < 1)) return setPesan("Jumlah menurut hotel tidak boleh nol.");
    if (settings.requirePickupPhoto && uploadReady && fotoPickup.length === 0)
      return setPesan("Foto isi tas wajib diambil sebelum nota disimpan.");
    if (selisih && !mismatchNote.trim())
      return setPesan("Jumlah tamu dan hotel berbeda. Tulis keterangan selisihnya lebih dulu.");

    setSimpan(true);
    try {
      const now = Date.now();
      const actor = { email: profile?.email || "", name: profile?.name || profile?.email || "" };

      const photos: PhotoRef[] = [
        ...fotoPickup.map((url) => ({ url, stage: "pickup" as const, at: now, by: actor.email })),
        ...fotoCacat.map((url) => ({ url, stage: "damage" as const, at: now, by: actor.email })),
      ];

      const signatures: SignatureRef[] = [];
      if (ttd && uploadReady) {
        try {
          const url = await uploadKeDrive(ttd, `ttd-pickup-${room}-${now}`);
          signatures.push({ url, kind: "guest_pickup", name: guest, at: now });
        } catch {
          /* tanda tangan gagal diunggah — nota tetap disimpan */
        }
      }

      const id = await buatNota(
        {
          roomNumber: room,
          guestName: guest,
          guestPhone: phone,
          guestCheckoutDate: checkout,
          serviceType: service,
          items,
          mismatchNote,
          photos,
          signatures,
          billNumber: bill,
          paymentType: payment,
          paymentRemark: remark,
          requestId: asalPermintaan?.id || null,
        },
        actor,
        settings
      );

      if (asalPermintaan?.id) {
        try {
          await tandaiPermintaanDiproses(asalPermintaan.id, id, actor);
        } catch {
          /* nota sudah dibuat; penandaan permintaan tidak boleh menggagalkan */
        }
      }

      router.push(`/orders/${id}`);
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan nota");
      setSimpan(false);
    }
  }

  if (!canCreateOrder(role)) {
    return <Notice tone="warn" title="Tidak punya akses">Peran Anda tidak diizinkan membuat nota pickup.</Notice>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Tahap 02"
        title="Pickup Baru"
        desc="Gerbang paling penting. Semua sengketa nanti diputus dari data yang diisi di halaman ini."
      />

      {asalPermintaan && (
        <div className="mb-5">
          <Notice tone="ok" title="Dari permintaan Front Office">
            Data tamu sudah terisi otomatis dari permintaan yang dicatat <b>{asalPermintaan.oleh}</b>.
            {asalPermintaan.catatan ? ` Catatan FO: “${asalPermintaan.catatan}”.` : ""} Tinggal hitung
            barangnya bersama tamu dan ambil foto.
          </Notice>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* ---- Data tamu ---- */}
          <section className="card px-5 py-5">
            <h2 className="mb-4 font-display text-[16px] font-bold text-ink">Data Tamu</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nomor Kamar" required>
                <input className="input" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="mis. 812" inputMode="numeric" />
              </Field>
              <Field label="Nama Tamu" required>
                <input className="input" value={guest} onChange={(e) => setGuest(e.target.value)} placeholder="mis. Ny. Ratna S." />
              </Field>
              <Field label="Nomor HP Tamu" hint="Opsional — untuk konfirmasi bila ada selisih">
                <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx" inputMode="tel" />
              </Field>
              <Field label="Tanggal Check-out" hint="Dipakai untuk peringatan cucian tertinggal">
                <input className="input" type="date" min={todayKey()} value={checkout} onChange={(e) => setCheckout(e.target.value)} />
              </Field>
            </div>

            <div className="mt-4">
              <span className="label">Jenis Layanan</span>
              <div className="grid grid-cols-3 gap-2">
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
                    {t === "express" && <span className="ml-1 text-[11px] opacity-70">+{settings.expressSurchargePct}%</span>}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[12.5px] text-ink-3">
                Janji selesai otomatis: <b className="text-ink-2">{tanggalJam(janji)}</b>
              </p>
            </div>
          </section>

          {/* ---- Pembayaran ---- */}
          <section className="card px-5 py-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-[16px] font-bold text-ink">Bill &amp; Pembayaran</h2>
              <span className="pill bg-brand-50 text-brand-700 ring-brand-200">Wewenang Front Office</span>
            </div>
            <p className="mb-4 text-[13.5px] text-ink-2">
              {canSetPayment(role)
                ? "Isi nomor bill sesuai bill manual yang Anda buat, lalu tentukan cara tamu membayar."
                : "Bagian ini hanya bisa diisi Front Office. Nota tetap bisa disimpan tanpa data ini — FO akan melengkapinya nanti."}
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Nomor Bill" hint="Samakan dengan bill manual / PMS">
                <input
                  className="input font-mono disabled:bg-slate-50 disabled:text-ink-3"
                  value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  disabled={!canSetPayment(role)}
                  placeholder="mis. 004512"
                />
              </Field>
              <Field label="Status Pembayaran">
                <select
                  className="input disabled:bg-slate-50 disabled:text-ink-3"
                  value={payment}
                  onChange={(e) => setPayment(e.target.value as PaymentType)}
                  disabled={!canSetPayment(role)}
                >
                  {(Object.keys(PAYMENT_LABEL) as PaymentType[]).map((k) => (
                    <option key={k} value={k}>
                      {PAYMENT_LABEL[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Remark Pembayaran" hint="mis. termasuk paket meeting">
                <input
                  className="input disabled:bg-slate-50 disabled:text-ink-3"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  disabled={!canSetPayment(role)}
                  placeholder="Opsional"
                />
              </Field>
            </div>
          </section>

          {/* ---- Manifest item ---- */}
          <section className="card px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-[16px] font-bold text-ink">Manifest Item</h2>
              <span className="text-[12.5px] text-ink-3">{items.length} baris</span>
            </div>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {kategori.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKategoriAktif(k)}
                  className={`rounded-full px-3 py-1 text-[12px] font-semibold transition ${
                    kategoriAktif === k
                      ? "bg-brand-700 text-white"
                      : k === "Paket"
                        ? "border border-gold-300 bg-gold-50 text-gold-800 hover:bg-gold-100"
                        : "border border-line bg-white text-ink-2 hover:bg-brand-50/60"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="mb-4 flex flex-wrap gap-1.5">
              {katalogTampil.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => tambahItem(p)}
                  className={`rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition ${
                    p.isPackage
                      ? "border-gold-300 bg-gold-50/70 text-gold-800 hover:border-gold-400 hover:bg-gold-100"
                      : "border-line bg-white text-ink-2 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  + {p.itemName}
                  {p.isPackage && <span className="ml-1.5 opacity-70">{rupiah(p.prices.package || 0)}</span>}
                </button>
              ))}
            </div>

            {items.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-[14px] text-ink-3">
                Belum ada item. Klik nama pakaian atau paket di atas untuk menambahkan.
              </div>
            ) : (
              <div className="space-y-2.5">
                {items.map((it, i) => {
                  const p = katalog.find((k) => k.id === it.itemCode);
                  const treatments = Object.keys(p?.prices || TREATMENT_LABEL) as Treatment[];
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border px-3 py-3 ${
                        it.isPackage ? "border-gold-200 bg-gold-50/40" : "border-line bg-slate-50/50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <p className="flex items-center gap-2 text-[14.5px] font-semibold text-ink">
                          {it.itemName}
                          {it.isPackage && <span className="pill bg-gold-100 text-gold-800 ring-gold-300">Paket</span>}
                        </p>
                        <button
                          type="button"
                          onClick={() => setItems(items.filter((_, k) => k !== i))}
                          className="rounded p-1 text-ink-3 transition hover:bg-white hover:text-rose-600"
                          aria-label="Hapus item"
                        >
                          <Icon name="trash" className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                        <div className="col-span-2">
                          <span className="label">{it.isPackage ? "Jenis Paket" : "Perlakuan"}</span>
                          <select
                            className="input py-2"
                            value={it.treatment}
                            onChange={(e) => ubahItem(i, { treatment: e.target.value as Treatment })}
                          >
                            {treatments.map((t) => (
                              <option key={t} value={t}>
                                {TREATMENT_LABEL[t]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="label">{it.isPackage ? "Paket (tamu)" : "Hitung Tamu"}</span>
                          <input
                            type="number"
                            min={0}
                            className="input num py-2"
                            value={it.qtyGuest}
                            onChange={(e) => ubahItem(i, { qtyGuest: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <span className="label">{it.isPackage ? "Paket (hotel)" : "Hitung Hotel"}</span>
                          <input
                            type="number"
                            min={0}
                            className={`input num py-2 ${it.qtyGuest !== it.qtyHotel ? "border-rose-400 bg-rose-50/50" : ""}`}
                            value={it.qtyHotel}
                            onChange={(e) => ubahItem(i, { qtyHotel: Number(e.target.value) })}
                          />
                        </div>
                        <div>
                          <span className="label">{it.isPackage ? "Harga Paket" : "Harga Satuan"}</span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            className="input num py-2"
                            value={it.unitPrice}
                            onChange={(e) => ubahItem(i, { unitPrice: Number(e.target.value) })}
                          />
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                        <input
                          className="input py-2 text-[13.5px]"
                          value={it.note || ""}
                          onChange={(e) => ubahItem(i, { note: e.target.value })}
                          placeholder={
                            it.isPackage
                              ? "Isi paket: mis. 3 kemeja, 2 celana, 5 kaus"
                              : "Catatan kondisi: noda, sobek, kancing lepas…"
                          }
                        />
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => ubahItem(i, { route: it.route === "vendor" ? "in_house" : "vendor" })}
                            className={`rounded-lg border px-3 py-2 text-[12.5px] font-semibold transition ${
                              it.route === "vendor"
                                ? "border-gold-300 bg-gold-50 text-gold-800"
                                : "border-line bg-white text-ink-2"
                            }`}
                            title="Klik untuk memindahkan rute"
                          >
                            {it.route === "vendor" ? "Ke Vendor" : "In-House"}
                          </button>
                          <span className="whitespace-nowrap text-[13.5px] font-bold tabular-nums text-ink">
                            {rupiah(it.unitPrice * it.qtyHotel)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {selisih && items.length > 0 && (
              <div className="mt-4">
                <Notice tone="danger" title="Jumlah tamu dan hotel berbeda">
                  Tamu menghitung <b>{qtyGuest}</b>, hotel menghitung <b>{qtyHotel}</b>. Selesaikan di kamar
                  sekarang juga, lalu tulis keterangannya.
                  <input
                    className="input mt-2.5"
                    value={mismatchNote}
                    onChange={(e) => setMismatchNote(e.target.value)}
                    placeholder="mis. tamu lupa 1 kaus kaki di kamar mandi, sudah dikonfirmasi"
                  />
                </Notice>
              </div>
            )}
          </section>

          {/* ---- Bukti ---- */}
          <section className="card px-5 py-5">
            <h2 className="mb-4 font-display text-[16px] font-bold text-ink">Bukti Pengambilan</h2>
            <div className="space-y-5">
              <PhotoPicker
                label="Foto isi tas"
                hint="Minimal satu foto seluruh isi tas sebelum dibawa."
                prefix={`pickup-${room || "kamar"}`}
                urls={fotoPickup}
                onChange={setFotoPickup}
              />
              <PhotoPicker
                label="Foto cacat / noda"
                hint="Foto setiap noda, sobek, atau kancing lepas — dan beri tahu tamu sebelum dicuci."
                prefix={`cacat-${room || "kamar"}`}
                urls={fotoCacat}
                onChange={setFotoCacat}
              />
              <SignaturePad label="Tanda tangan tamu (bila tamu ada di kamar)" onChange={setTtd} />
            </div>
          </section>
        </div>

        {/* ---- Ringkasan ---- */}
        <aside className="lg:sticky lg:top-20 lg:h-fit">
          <div className="card px-5 py-5">
            <h2 className="mb-3 font-display text-[16px] font-bold text-ink">Ringkasan</h2>
            <Baris label="Jumlah menurut tamu" value={String(qtyGuest)} />
            <Baris label="Jumlah menurut hotel" value={String(qtyHotel)} tone={selisih ? "bad" : undefined} />
            <Baris
              label="Rute"
              value={
                items.length
                  ? hitungRoute(items) === "mixed"
                    ? "Campuran"
                    : hitungRoute(items) === "vendor"
                      ? "Vendor"
                      : "In-house"
                  : "—"
              }
            />
            {items.some((i) => i.isPackage) && <Baris label="Berisi paket" value="Ya" />}
            {bill && <Baris label="Nomor bill" value={bill} />}
            {payment !== "unset" && <Baris label="Pembayaran" value={PAYMENT_LABEL[payment]} />}

            <div className="my-2 h-px bg-line" />
            <Baris label="Subtotal" value={rupiah(total.subtotal)} />
            {total.surcharge > 0 && (
              <Baris label={`Surcharge Express (${settings.expressSurchargePct}%)`} value={rupiah(total.surcharge)} />
            )}
            <div className="mt-2 flex items-center justify-between border-t border-line pt-3">
              <span className="text-[14px] font-semibold text-ink">Total</span>
              <span className="text-[20px] font-bold tabular-nums text-brand-700">{rupiah(total.grandTotal)}</span>
            </div>

            {pesan && (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13.5px] text-rose-800">
                {pesan}
              </div>
            )}

            <button onClick={kirim} disabled={simpan} className="btn-primary mt-4 w-full py-3">
              {simpan ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Menyimpan…
                </>
              ) : (
                <>
                  <Icon name="check" className="h-4 w-4" /> Simpan Nota Pickup
                </>
              )}
            </button>
            <p className="mt-2.5 text-center text-[12px] text-ink-3">
              Nota langsung berstatus “Sudah Diambil”. Kode lacak dibuat otomatis.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

function Baris({ label, value, tone }: { label: string; value: string; tone?: "bad" }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[13.5px] text-ink-2">{label}</span>
      <span className={`text-[14px] font-bold tabular-nums ${tone === "bad" ? "text-rose-600" : "text-ink"}`}>{value}</span>
    </div>
  );
}
