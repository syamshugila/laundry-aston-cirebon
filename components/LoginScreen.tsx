"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { HOTEL_NAME } from "@/lib/firebase";
import Icon from "./Icon";

export default function LoginScreen() {
  const { login, error } = useAuth();
  const [sedang, setSedang] = useState(false);

  async function masuk() {
    setSedang(true);
    await login();
    setSedang(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Sisi kiri: identitas */}
      <div className="relative hidden flex-col justify-between bg-brand-700 px-12 py-14 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white/15">
            <Icon name="box" />
          </div>
          <div>
            <p className="text-[17px] font-extrabold leading-tight tracking-tight">VERITAS</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-white/70">Guest Laundry Tracking</p>
          </div>
        </div>

        <div>
          <h2 className="max-w-md text-[34px] font-bold leading-tight tracking-tight">
            Setiap helai punya jejak, setiap serah terima punya bukti.
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/75">
            Rantai kepemilikan cucian tamu dari kamar sampai kembali ke kamar — lengkap dengan foto,
            hitung ganda, tanda tangan, dan audit HK Leader.
          </p>
          <ul className="mt-8 space-y-2.5 text-[14.5px] text-white/80">
            {[
              "Hitung ganda tamu vs hotel, selisih langsung ketahuan",
              "Foto bukti di setiap tahap serah terima",
              "Nota terkunci setelah diverifikasi HK Leader",
              "Tetap bisa dipakai saat sinyal hilang di koridor",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-white/60" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[12.5px] text-white/50">{HOTEL_NAME} · Housekeeping Operations</p>
      </div>

      {/* Sisi kanan: tombol masuk */}
      <div className="grid place-items-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-700 text-white">
              <Icon name="box" />
            </div>
            <div>
              <p className="text-[16px] font-extrabold leading-tight text-ink">VERITAS</p>
              <p className="text-[10.5px] uppercase tracking-[0.12em] text-ink-3">Guest Laundry</p>
            </div>
          </div>

          <h1 className="text-[26px] font-bold tracking-tight text-ink">Masuk ke sistem</h1>
          <p className="mt-1.5 text-[15px] text-ink-2">
            Gunakan akun Google milik hotel. Peran akses diatur oleh Super Admin.
          </p>

          {error && (
            <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] text-rose-800">
              {error}
            </div>
          )}

          <button onClick={masuk} disabled={sedang} className="btn-ghost mt-6 w-full py-3 text-[15px]">
            {sedang ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
                Membuka jendela Google…
              </>
            ) : (
              <>
                <GoogleMark />
                Login dengan Google
              </>
            )}
          </button>

          <p className="mt-6 text-[13px] leading-relaxed text-ink-3">
            Belum pernah masuk? Akun Anda otomatis terdaftar setelah login pertama, lalu tinggal
            menunggu Super Admin memberikan peran.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6Z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9A11.5 11.5 0 0 0 12 23.5Z" />
      <path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4V6.9H1.8a11.5 11.5 0 0 0 0 10.2l3.8-2.9Z" />
      <path fill="#EA4335" d="M12 5.4c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.9l3.8 2.9c.9-2.7 3.4-4.4 6.4-4.4Z" />
    </svg>
  );
}
