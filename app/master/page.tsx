"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ambilDaftarHarga, simpanHarga, hapusHarga, ambilVendor, simpanVendor, hapusVendor } from "@/lib/data";
import { KATALOG_AWAL, KATEGORI } from "@/lib/catalog";
import { PageHeader, Spinner, Notice, Field, EmptyState } from "@/components/ui";
import Icon from "@/components/Icon";
import { rupiah } from "@/lib/format";
import { canManageMaster, TREATMENT_LABEL } from "@/lib/status";
import type { PriceItem, Vendor, Treatment } from "@/lib/types";

export default function MasterPage() {
  const { role } = useAuth();
  const [tab, setTab] = useState<"harga" | "vendor">("harga");

  if (!canManageMaster(role)) {
    return <Notice tone="warn" title="Halaman khusus Super Admin">Hanya Super Admin yang boleh mengubah master data.</Notice>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Pengaturan"
        title="Master Data"
        desc="Daftar tarif per item per perlakuan, dan daftar vendor rekanan beserta SLA-nya."
      />
      <div className="mb-4 flex gap-2">
        {(
          [
            ["harga", "Daftar Harga"],
            ["vendor", "Vendor Rekanan"],
          ] as const
        ).map(([v, t]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`rounded-lg px-4 py-2 text-[13.5px] font-semibold transition ${
              tab === v ? "bg-brand-700 text-white" : "border border-line bg-white text-ink-2 hover:bg-slate-50"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "harga" ? <TabHarga /> : <TabVendor />}
    </>
  );
}

/* ------------------------------ DAFTAR HARGA ------------------------------ */
function TabHarga() {
  const [rows, setRows] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesan, setPesan] = useState<string | null>(null);
  const [edit, setEdit] = useState<PriceItem | null>(null);
  const [proses, setProses] = useState(false);

  async function muat() {
    setLoading(true);
    try {
      setRows(await ambilDaftarHarga());
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal memuat daftar harga");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  async function isiKatalogAwal() {
    setProses(true);
    setPesan(null);
    try {
      for (const item of KATALOG_AWAL) await simpanHarga(item);
      await muat();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal mengisi katalog awal");
    } finally {
      setProses(false);
    }
  }

  const kosong: PriceItem = {
    id: "",
    itemName: "",
    category: "Atasan",
    prices: { wash_press: 0 },
    defaultRoute: "in_house",
    active: true,
  };

  return (
    <>
      {pesan && (
        <div className="mb-4">
          <Notice tone="danger" title="Ada masalah">{pesan}</Notice>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => setEdit(kosong)} className="btn-primary">
          <Icon name="plus" className="h-4 w-4" /> Tambah Item
        </button>
        {rows.length === 0 && (
          <button onClick={isiKatalogAwal} disabled={proses} className="btn-ghost">
            {proses ? "Mengisi…" : "Isi dengan katalog contoh (18 item)"}
          </button>
        )}
      </div>

      {edit && (
        <FormHarga
          item={edit}
          onClose={() => setEdit(null)}
          onSaved={async () => {
            setEdit(null);
            await muat();
          }}
        />
      )}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="database"
          title="Daftar harga masih kosong"
          desc="Tambahkan item satu per satu, atau isi dulu dengan katalog contoh lalu sesuaikan tarifnya dengan tarif resmi hotel."
        />
      ) : (
        <div className="card scroll-x">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="border-b border-line bg-slate-50/70">
              <tr>
                <th className="th">Item</th>
                <th className="th">Kategori</th>
                <th className="th num text-right">Cuci+Setrika</th>
                <th className="th num text-right">Setrika Saja</th>
                <th className="th num text-right">Dry Clean</th>
                <th className="th">Rute</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-line last:border-0">
                  <td className="td font-semibold text-ink">
                    {r.itemName}
                    <div className="font-mono text-[11px] text-ink-3">{r.id}</div>
                  </td>
                  <td className="td">{r.category}</td>
                  <td className="td num text-right">{r.prices.wash_press ? rupiah(r.prices.wash_press) : "—"}</td>
                  <td className="td num text-right">{r.prices.press_only ? rupiah(r.prices.press_only) : "—"}</td>
                  <td className="td num text-right">{r.prices.dry_clean ? rupiah(r.prices.dry_clean) : "—"}</td>
                  <td className="td">{r.defaultRoute === "vendor" ? "Vendor" : "In-house"}</td>
                  <td className="td text-right">
                    <button onClick={() => setEdit(r)} className="mr-2 text-[13px] font-semibold text-brand-700 hover:underline">
                      Ubah
                    </button>
                    <button
                      onClick={async () => {
                        await hapusHarga(r.id);
                        await muat();
                      }}
                      className="text-[13px] font-semibold text-rose-600 hover:underline"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function FormHarga({ item, onClose, onSaved }: { item: PriceItem; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<PriceItem>(item);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function simpan() {
    if (!f.itemName.trim()) return setPesan("Nama item wajib diisi.");
    const id = (f.id || f.itemName.toUpperCase().replace(/[^A-Z0-9]/g, "_")).slice(0, 40);
    setProses(true);
    try {
      await simpanHarga({ ...f, id });
      onSaved();
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan");
      setProses(false);
    }
  }

  return (
    <div className="card mb-4 px-5 py-5">
      <h3 className="mb-4 text-[15px] font-bold text-ink">{item.id ? `Ubah ${item.itemName}` : "Item Baru"}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nama Item" required>
          <input className="input" value={f.itemName} onChange={(e) => setF({ ...f, itemName: e.target.value })} placeholder="mis. Kemeja / Blouse" />
        </Field>
        <Field label="Kategori">
          <select className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            {KATEGORI.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Rute Bawaan">
          <select className="input" value={f.defaultRoute} onChange={(e) => setF({ ...f, defaultRoute: e.target.value as "in_house" | "vendor" })}>
            <option value="in_house">In-house</option>
            <option value="vendor">Vendor</option>
          </select>
        </Field>
        <Field label="Status">
          <select className="input" value={f.active ? "1" : "0"} onChange={(e) => setF({ ...f, active: e.target.value === "1" })}>
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </Field>
        {(["wash_press", "press_only", "dry_clean"] as Treatment[]).map((t) => (
          <Field key={t} label={TREATMENT_LABEL[t]} hint="Kosongkan (0) bila tidak dilayani">
            <input
              type="number"
              min={0}
              step={1000}
              className="input num"
              value={f.prices[t] || 0}
              onChange={(e) => {
                const v = Number(e.target.value);
                const p = { ...f.prices };
                if (v > 0) p[t] = v;
                else delete p[t];
                setF({ ...f, prices: p });
              }}
            />
          </Field>
        ))}
      </div>
      {pesan && <p className="mt-3 text-[13px] text-rose-600">{pesan}</p>}
      <div className="mt-4 flex gap-2">
        <button onClick={simpan} disabled={proses} className="btn-primary">
          {proses ? "Menyimpan…" : "Simpan"}
        </button>
        <button onClick={onClose} className="btn-ghost">
          Batal
        </button>
      </div>
    </div>
  );
}

/* -------------------------------- VENDOR --------------------------------- */
function TabVendor() {
  const [rows, setRows] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Vendor | null>(null);
  const [pesan, setPesan] = useState<string | null>(null);

  async function muat() {
    setLoading(true);
    try {
      setRows(await ambilVendor());
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal memuat vendor");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  const kosong: Vendor = { id: "", name: "", contactName: "", phone: "", slaHours: 24, specialties: "", active: true };

  return (
    <>
      {pesan && (
        <div className="mb-4">
          <Notice tone="danger" title="Ada masalah">{pesan}</Notice>
        </div>
      )}

      <button onClick={() => setEdit(kosong)} className="btn-primary mb-4">
        <Icon name="plus" className="h-4 w-4" /> Tambah Vendor
      </button>

      {edit && (
        <div className="card mb-4 px-5 py-5">
          <h3 className="mb-4 text-[15px] font-bold text-ink">{edit.id ? `Ubah ${edit.name}` : "Vendor Baru"}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nama Vendor" required>
              <input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
            </Field>
            <Field label="Nama Kontak">
              <input className="input" value={edit.contactName || ""} onChange={(e) => setEdit({ ...edit, contactName: e.target.value })} />
            </Field>
            <Field label="Nomor HP">
              <input className="input" value={edit.phone || ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} inputMode="tel" />
            </Field>
            <Field label="SLA (jam)" hint="Janji waktu retur standar">
              <input type="number" min={1} className="input num" value={edit.slaHours} onChange={(e) => setEdit({ ...edit, slaHours: Number(e.target.value) })} />
            </Field>
            <Field label="Spesialisasi">
              <input className="input" value={edit.specialties} onChange={(e) => setEdit({ ...edit, specialties: e.target.value })} placeholder="mis. dry clean, jas, gaun" />
            </Field>
            <Field label="Status">
              <select className="input" value={edit.active ? "1" : "0"} onChange={(e) => setEdit({ ...edit, active: e.target.value === "1" })}>
                <option value="1">Aktif</option>
                <option value="0">Nonaktif</option>
              </select>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={async () => {
                if (!edit.name.trim()) return;
                await simpanVendor(edit);
                setEdit(null);
                await muat();
              }}
              className="btn-primary"
            >
              Simpan
            </button>
            <button onClick={() => setEdit(null)} className="btn-ghost">
              Batal
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState icon="truck" title="Belum ada vendor terdaftar" desc="Tambahkan vendor rekanan supaya serah terima bisa dicatat lengkap dengan surat jalan." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((v) => (
            <div key={v.id} className="card px-5 py-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[15.5px] font-bold text-ink">{v.name}</p>
                  <p className="text-[13px] text-ink-2">{v.contactName || "—"} · {v.phone || "—"}</p>
                </div>
                <span className={`pill ${v.active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-slate-200"}`}>
                  {v.active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <p className="mt-2 text-[13px] text-ink-2">SLA {v.slaHours} jam · {v.specialties || "umum"}</p>
              <div className="mt-3 flex gap-3 border-t border-line pt-2.5">
                <button onClick={() => setEdit(v)} className="text-[13px] font-semibold text-brand-700 hover:underline">
                  Ubah
                </button>
                <button
                  onClick={async () => {
                    await hapusVendor(v.id);
                    await muat();
                  }}
                  className="text-[13px] font-semibold text-rose-600 hover:underline"
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
