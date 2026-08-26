"use client";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { HOTEL_NAME } from "@/lib/firebase";
import Icon from "./Icon";
import Brand, { Monogram } from "./Brand";

const JANJI = [
  "Hitung ganda tamu vs hotel — selisih langsung ketahuan",
  "Foto bukti di setiap tahap serah terima",
  "Nota terkunci setelah diverifikasi HK Leader",
  "Tetap bisa dipakai saat sinyal hilang di koridor",
];

export default function LoginScreen() {
  const { login, error } = useAuth();
  const [sedang, setSedang] = useState(false);

  async function masuk() {
    setSedang(true);
    await login();
    setSedang(false);
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* ---------- Sisi kiri: identitas hotel ---------- */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-navy-sheen px-12 py-14 text-white lg:flex">
        {/* ornamen lembut di latar */}
        <span className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-28 -left-20 h-96 w-96 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative animate-fadeUp">
          <Brand tone="dark" />
        </div>

        <div className="relative stagger">
          <div className="gold-rule mb-6" />
          <h2 className="max-w-lg font-display text-[36px] font-bold leading-[1.12] tracking-tight">
            Setiap helai punya jejak, setiap serah terima punya bukti.
          </h2>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-white/70">
            Rantai kepemilikan cucian tamu dari kamar sampai kembali ke kamar — lengkap dengan foto,
            hitung ganda, tanda tangan, dan audit HK Leader.
          </p>
          <ul className="mt-9 space-y-3 text-[14.5px] text-white/80">
            {JANJI.map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-400">
                  <Icon name="check" className="h-3 w-3" />
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12.5px] tracking-wide text-white/40">{HOTEL_NAME} · Housekeeping Operations</p>
      </div>

      {/* ---------- Sisi kanan: tombol masuk ---------- */}
      <div className="grid place-items-center bg-white px-6 py-16">
        <div className="w-full max-w-sm animate-fadeUp">
          <div className="mb-9 lg:hidden">
            <Brand />
          </div>

          <div className="mb-7 hidden lg:block">
            <Monogram className="h-12 w-12 text-[26px]" ring />
          </div>

          <h1 className="font-display text-[28px] font-bold tracking-tight text-ink">Masuk ke sistem</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
            Gunakan akun Google milik hotel. Peran akses diatur oleh Super Admin.
          </p>

          {error && (
            <div className="mt-5 animate-fadeUp rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-[14px] leading-relaxed text-rose-800">
              {error}
            </div>
          )}

          <button
            onClick={masuk}
            disabled={sedang}
            className="btn-ghost mt-7 w-full py-3.5 text-[15px] hover:border-gold-300 hover:bg-gold-50/50 hover:shadow-gold"
          >
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

          <div className="my-7 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Pertama kali?</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <p className="text-[13.5px] leading-relaxed text-ink-3">
            Akun Anda otomatis terdaftar setelah login pertama. Setelah itu tinggal menunggu Super Admin
            memberikan peran — Valet, Attendant, Supervisor, atau HK Leader.
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
