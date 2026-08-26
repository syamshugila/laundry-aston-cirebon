"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useIssues } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { selesaikanKendala } from "@/lib/data";
import { PageHeader, Spinner, EmptyState, Notice, StatCard, Field } from "@/components/ui";
import Icon from "@/components/Icon";
import { rupiah, tanggalJam } from "@/lib/format";
import { canVerify } from "@/lib/status";
import type { LaundryIssue, IssueType } from "@/lib/types";

const JENIS: Record<IssueType, string> = {
  lost: "Barang hilang",
  damaged: "Rusak / sobek",
  discolored: "Luntur",
  wrong_room: "Salah kamar",
  late: "Terlambat",
  complaint: "Komplain tamu",
};

const PENYELESAIAN = [
  { v: "replace", t: "Ganti rugi barang" },
  { v: "discount", t: "Potongan biaya" },
  { v: "free", t: "Digratiskan" },
  { v: "vendor_claim", t: "Klaim ke vendor" },
  { v: "no_action", t: "Tanpa tindakan" },
] as const;

export default function IssuesPage() {
  const { issues, loading, error } = useIssues();
  const { role } = useAuth();
  const [tab, setTab] = useState<"open" | "resolved">("open");

  const terbuka = useMemo(() => issues.filter((i) => i.status !== "resolved"), [issues]);
  const selesai = useMemo(() => issues.filter((i) => i.status === "resolved"), [issues]);
  const rows = tab === "open" ? terbuka : selesai;
  const totalRugi = terbuka.reduce((a, i) => a + (i.lossValue || 0), 0);
  const dariVendor = terbuka.filter((i) => i.liableParty === "vendor").length;

  return (
    <>
      <PageHeader
        eyebrow="Kendali Mutu"
        title="Kendala & Klaim"
        desc="Register semua masalah: hilang, rusak, luntur, salah kamar, terlambat, atau komplain tamu. Nota tidak bisa dikunci selama kendalanya masih terbuka."
      />

      {error && (
        <div className="mb-4">
          <Notice tone="danger" title="Tidak bisa memuat data">{error}</Notice>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Kendala Terbuka" value={terbuka.length} tone={terbuka.length ? "danger" : "ok"} hint="Perlu ditindak" />
        <StatCard label="Sudah Selesai" value={selesai.length} tone="ok" hint="Ada penutupnya" />
        <StatCard label="Nilai Kerugian" value={rupiah(totalRugi)} hint="Dari kendala terbuka" />
        <StatCard label="Tanggung Vendor" value={dariVendor} tone="warn" hint="Bahan negosiasi kontrak" />
      </div>

      <div className="mb-4 flex gap-2">
        {(
          [
            ["open", `Terbuka (${terbuka.length})`],
            ["resolved", `Selesai (${selesai.length})`],
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

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="check"
          title={tab === "open" ? "Tidak ada kendala terbuka" : "Belum ada kendala yang diselesaikan"}
          desc={
            tab === "open"
              ? "Operasi laundry berjalan bersih. Kendala baru bisa dilaporkan dari halaman detail nota."
              : "Kendala yang sudah ditutup akan muncul di sini beserta cara penyelesaiannya."
          }
        />
      ) : (
        <div className="space-y-3">
          {rows.map((k) => (
            <KartuKendala key={k.id} k={k} bolehTutup={canVerify(role)} />
          ))}
        </div>
      )}
    </>
  );
}

function KartuKendala({ k, bolehTutup }: { k: LaundryIssue; bolehTutup: boolean }) {
  const { profile } = useAuth();
  const [buka, setBuka] = useState(false);
  const [res, setRes] = useState<(typeof PENYELESAIAN)[number]["v"]>("discount");
  const [catatan, setCatatan] = useState("");
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function tutup() {
    if (!catatan.trim()) return setPesan("Tulis bagaimana kendala ini diselesaikan.");
    setProses(true);
    try {
      await selesaikanKendala(k, res, catatan, {
        email: profile?.email || "",
        name: profile?.name || "",
      });
      setBuka(false);
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menutup kendala");
    } finally {
      setProses(false);
    }
  }

  const warna =
    k.status === "resolved" ? "" : k.type === "lost" || k.type === "damaged" ? "border-l-[3px] border-l-rose-500" : "border-l-[3px] border-l-amber-500";

  return (
    <div className={`card px-5 py-4 ${warna}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15.5px] font-bold text-ink">{JENIS[k.type]}</span>
            <span className={`pill ${k.status === "resolved" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"}`}>
              {k.status === "resolved" ? "Selesai" : "Terbuka"}
            </span>
            {k.liableParty !== "unknown" && (
              <span className="pill bg-slate-100 text-slate-600 ring-slate-200">Tanggung: {k.liableParty}</span>
            )}
          </div>
          <p className="mt-1 text-[14px] text-ink-2">{k.description}</p>
          <p className="mt-1 font-mono text-[12px] text-ink-3">
            <Link href={`/orders/${k.orderId}`} className="text-brand-700 hover:underline">
              {k.trackingCode}
            </Link>{" "}
            · Kamar {k.roomNumber} · {tanggalJam(k.createdAt)}
          </p>
          {k.status === "resolved" && (
            <p className="mt-1.5 rounded-lg bg-emerald-50/70 px-3 py-1.5 text-[13px] text-emerald-800">
              {PENYELESAIAN.find((p) => p.v === k.resolution)?.t}: {k.resolutionNote}
            </p>
          )}
        </div>

        <div className="text-right">
          {k.lossValue > 0 && (
            <>
              <p className="text-[10.5px] uppercase tracking-wider text-ink-3">Kerugian</p>
              <p className="text-[16px] font-bold tabular-nums text-rose-700">{rupiah(k.lossValue)}</p>
            </>
          )}
        </div>
      </div>

      {k.status !== "resolved" && bolehTutup && (
        <div className="mt-3 border-t border-line pt-3">
          {!buka ? (
            <button onClick={() => setBuka(true)} className="btn-ghost py-2 text-[13px]">
              <Icon name="check" className="h-4 w-4" /> Selesaikan Kendala
            </button>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Cara Penyelesaian">
                  <select className="input" value={res} onChange={(e) => setRes(e.target.value as typeof res)}>
                    {PENYELESAIAN.map((p) => (
                      <option key={p.v} value={p.v}>
                        {p.t}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Keterangan" required>
                  <input className="input" value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Apa yang dilakukan, disetujui siapa…" />
                </Field>
              </div>
              {pesan && <p className="text-[13px] text-rose-600">{pesan}</p>}
              <div className="flex gap-2">
                <button onClick={tutup} disabled={proses} className="btn-primary py-2 text-[13px]">
                  {proses ? "Menyimpan…" : "Tutup Kendala"}
                </button>
                <button onClick={() => setBuka(false)} className="btn-ghost py-2 text-[13px]">
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
