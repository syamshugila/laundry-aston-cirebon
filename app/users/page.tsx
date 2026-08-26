"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { ambilPengguna, ubahPeran } from "@/lib/data";
import { PageHeader, Spinner, Notice, EmptyState } from "@/components/ui";
import { ROLE_LABEL, canManageMaster } from "@/lib/status";
import { tanggal } from "@/lib/format";
import type { AppUser, Role } from "@/lib/types";

const PERAN: Role[] = ["pending", "valet", "attendant", "hk_supervisor", "hk_leader", "front_office", "super_admin"];

export default function UsersPage() {
  const { role, profile } = useAuth();
  const [rows, setRows] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pesan, setPesan] = useState<string | null>(null);
  const [simpanId, setSimpanId] = useState<string | null>(null);

  async function muat() {
    setLoading(true);
    try {
      setRows(await ambilPengguna());
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (canManageMaster(role)) muat();
    else setLoading(false);
  }, [role]);

  if (!canManageMaster(role)) {
    return <Notice tone="warn" title="Halaman khusus Super Admin">Hanya Super Admin yang boleh mengatur peran pengguna.</Notice>;
  }

  async function ubah(u: AppUser, baru: Role, aktif: boolean) {
    setSimpanId(u.uid);
    setPesan(null);
    try {
      await ubahPeran(u.uid, baru, aktif);
      setRows((old) => old.map((x) => (x.uid === u.uid ? { ...x, role: baru, active: aktif } : x)));
    } catch (e) {
      setPesan(e instanceof Error ? e.message : "Gagal menyimpan perubahan");
    } finally {
      setSimpanId(null);
    }
  }

  const menunggu = rows.filter((u) => u.role === "pending");

  return (
    <>
      <PageHeader
        eyebrow="Pengaturan"
        title="Pengguna & Peran"
        desc="Setiap staf yang login Google otomatis terdaftar dengan peran “Belum Diberi Peran”. Anda yang menentukan aksesnya di sini."
      />

      {pesan && (
        <div className="mb-4">
          <Notice tone="danger" title="Ada masalah">{pesan}</Notice>
        </div>
      )}

      {menunggu.length > 0 && (
        <div className="mb-5">
          <Notice tone="warn" title={`${menunggu.length} akun menunggu peran`}>
            {menunggu.map((u) => u.email).join(", ")} sudah login tapi belum bisa memakai aplikasi.
          </Notice>
        </div>
      )}

      <div className="mb-5">
        <Notice tone="info" title="Pemisahan tugas">
          Orang yang mengambil cucian sebaiknya bukan orang yang menyatakan cucian itu beres. Beri peran
          <b> Valet</b> untuk pengambilan &amp; pengantaran, <b>Attendant</b> untuk proses, <b>Supervisor</b> untuk
          vendur &amp; QC, dan <b>HK Leader</b> untuk verifikasi akhir.
        </Notice>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState icon="users" title="Belum ada pengguna" desc="Minta staf login sekali dengan akun Google mereka, lalu peran bisa diberikan di sini." />
      ) : (
        <div className="card scroll-x">
          <table className="w-full min-w-[720px] border-collapse">
            <thead className="border-b border-line bg-slate-50/70">
              <tr>
                <th className="th">Nama</th>
                <th className="th">Email</th>
                <th className="th">Terdaftar</th>
                <th className="th">Peran</th>
                <th className="th">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const diriSendiri = u.email === profile?.email;
                return (
                  <tr key={u.uid} className="border-b border-line last:border-0">
                    <td className="td font-semibold text-ink">
                      {u.name}
                      {diriSendiri && <span className="ml-2 pill bg-brand-50 text-brand-700 ring-brand-200">Anda</span>}
                    </td>
                    <td className="td font-mono text-[13px]">{u.email}</td>
                    <td className="td">{u.createdAt ? tanggal(u.createdAt) : "—"}</td>
                    <td className="td">
                      <select
                        className="input w-[190px] py-1.5"
                        value={u.role}
                        disabled={diriSendiri || simpanId === u.uid}
                        onChange={(e) => ubah(u, e.target.value as Role, u.active !== false)}
                      >
                        {PERAN.map((p) => (
                          <option key={p} value={p}>
                            {ROLE_LABEL[p]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="td">
                      <button
                        disabled={diriSendiri || simpanId === u.uid}
                        onClick={() => ubah(u, u.role, !(u.active !== false))}
                        className={`pill ${u.active !== false ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-rose-50 text-rose-700 ring-rose-200"} ${diriSendiri ? "opacity-50" : "hover:brightness-95"}`}
                      >
                        {u.active !== false ? "Aktif" : "Dinonaktifkan"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
