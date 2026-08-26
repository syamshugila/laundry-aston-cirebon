"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HOTEL_NAME } from "@/lib/firebase";
import { ROLE_LABEL, canCreateOrder } from "@/lib/status";
import Icon, { type IconName } from "./Icon";
import Brand, { Monogram } from "./Brand";
import LoginScreen from "./LoginScreen";
import { Spinner } from "./ui";
import type { Role } from "@/lib/types";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  roles?: Role[]; // kosong = semua peran boleh
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Operasional",
    items: [
      { href: "/", label: "Dashboard", icon: "dashboard" },
      { href: "/pickup", label: "Pickup Baru", icon: "plus", roles: ["super_admin", "hk_leader", "hk_supervisor", "valet", "front_office"] },
      { href: "/orders", label: "Daftar Nota", icon: "list" },
      { href: "/process", label: "Sedang Diproses", icon: "clock" },
      { href: "/vendor", label: "Kirim ke Vendor", icon: "truck", roles: ["super_admin", "hk_leader", "hk_supervisor"] },
      { href: "/vendor-return", label: "Terima dari Vendor", icon: "box", roles: ["super_admin", "hk_leader", "hk_supervisor", "attendant"] },
      { href: "/ready", label: "Siap Antar", icon: "check" },
      { href: "/delivered", label: "Sudah Diantar", icon: "check" },
    ],
  },
  {
    group: "Kendali Mutu",
    items: [
      { href: "/verification", label: "Verifikasi HK Leader", icon: "shield", roles: ["super_admin", "hk_leader"] },
      { href: "/issues", label: "Kendala & Klaim", icon: "alert" },
      { href: "/evidence", label: "Galeri Bukti", icon: "camera" },
    ],
  },
  {
    group: "Pengaturan",
    items: [
      { href: "/reports", label: "Laporan & Ekspor", icon: "chart", roles: ["super_admin", "hk_leader", "hk_supervisor"] },
      { href: "/master", label: "Master Data", icon: "database", roles: ["super_admin"] },
      { href: "/users", label: "Pengguna", icon: "users", roles: ["super_admin"] },
      { href: "/settings", label: "Pengaturan Sistem", icon: "settings", roles: ["super_admin"] },
    ],
  },
];

function boleh(item: NavItem, role: Role) {
  return !item.roles || item.roles.includes(role);
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const { user, profile, role, loading, configured, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [menuAkun, setMenuAkun] = useState(false);

  useEffect(() => {
    const set = () => setOnline(navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenuAkun(false);
  }, [pathname]);

  if (!configured) return <SetupScreen />;
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="animate-fadeIn text-center">
          <Monogram className="mx-auto mb-4 h-14 w-14 text-[30px] animate-pulseRing" ring />
          <Spinner label="Menyiapkan aplikasi…" />
        </div>
      </div>
    );
  if (!user) return <LoginScreen />;
  if (role === "pending") return <PendingScreen name={profile?.name || user.email || ""} onLogout={logout} />;

  const namaTampil = profile?.name || user.displayName || user.email || "";

  return (
    <div className="min-h-screen lg:flex">
      {/* ============ Sidebar navy ============ */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[262px] shrink-0 bg-navy-sheen transition-transform duration-300 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
            <Brand tone="dark" />
            <button
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white lg:hidden"
              aria-label="Tutup menu"
            >
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 py-4">
            {NAV.map((g) => {
              const items = g.items.filter((i) => boleh(i, role));
              if (!items.length) return null;
              return (
                <div key={g.group} className="mb-5">
                  <p className="flex items-center gap-2 px-2.5 pb-2 lockup text-[9.5px] text-white/45">
                    {g.group}
                    <span className="h-px flex-1 bg-white/10" />
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((i) => {
                      const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
                      return (
                        <li key={i.href}>
                          <Link
                            href={i.href}
                            className={`group relative flex items-center gap-2.5 rounded-lg py-2.5 pl-3.5 pr-2.5 text-[14px] font-medium transition duration-150 ${
                              active
                                ? "bg-white/[0.12] text-white"
                                : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                            }`}
                          >
                            <span
                              className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full bg-white transition-all duration-200 ${
                                active ? "h-6 w-[3px]" : "h-0 w-[3px] group-hover:h-3"
                              }`}
                            />
                            <Icon
                              name={i.icon}
                              className={`h-[18px] w-[18px] shrink-0 transition ${active ? "text-white" : "text-white/45 group-hover:text-white/80"}`}
                            />
                            <span className="truncate">{i.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-white/10 px-4 py-3.5">
            <p className="lockup text-[9.5px] text-white/40">Peran Aktif</p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-white">{ROLE_LABEL[role]}</p>
          </div>
        </div>
      </aside>

      {open && (
        <button
          className="fixed inset-0 z-30 animate-fadeIn bg-brand-900/40 backdrop-blur-[2px] lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Tutup menu"
        />
      )}

      {/* ============ Konten ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/85 px-4 py-3 backdrop-blur-md">
          <button
            onClick={() => setOpen(true)}
            className="rounded-md p-1.5 text-ink-2 transition hover:bg-brand-50 hover:text-brand-700 lg:hidden"
            aria-label="Buka menu"
          >
            <Icon name="menu" />
          </button>

          <Link href="/pickup" className="btn-primary hidden py-2 text-[13px] sm:inline-flex">
            <Icon name="plus" className="h-4 w-4" /> Pickup Baru
          </Link>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold transition ${
              online ? "bg-emerald-50 text-emerald-700" : "bg-brand-100 text-brand-800"
            }`}
            title={online ? "Terhubung ke server" : "Data disimpan di perangkat dulu, terkirim otomatis saat sinyal kembali"}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "animate-pulse bg-gold-600"}`} />
            {online ? "Tersambung" : "Luring — menunggu sinyal"}
          </span>

          <div className="relative ml-auto">
            <button
              onClick={() => setMenuAkun((v) => !v)}
              className="flex items-center gap-2.5 rounded-lg py-1 pl-2 pr-1.5 transition hover:bg-brand-50"
            >
              <span className="hidden text-right sm:block">
                <span className="block text-[13px] font-semibold leading-tight text-ink">{namaTampil}</span>
                <span className="block text-[10.5px] uppercase tracking-wider text-ink-3">{ROLE_LABEL[role]}</span>
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-sheen text-[13px] font-bold text-white ring-1 ring-white/20">
                {namaTampil.charAt(0).toUpperCase()}
              </span>
              <Icon name="chevron" className={`h-4 w-4 text-ink-3 transition ${menuAkun ? "rotate-90" : ""}`} />
            </button>

            {menuAkun && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuAkun(false)} aria-label="Tutup menu akun" />
                <div className="absolute right-0 z-20 mt-2 w-60 animate-slideIn overflow-hidden rounded-xl border border-line bg-white shadow-lift">
                  <div className="border-b border-line bg-brand-50/50 px-4 py-3">
                    <p className="truncate text-[14px] font-semibold text-ink">{namaTampil}</p>
                    <p className="truncate text-[12px] text-ink-3">{user.email}</p>
                  </div>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-[14px] font-medium text-ink-2 transition hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Icon name="logout" className="h-[18px] w-[18px]" /> Keluar dari aplikasi
                  </button>
                </div>
              </>
            )}
          </div>
        </header>

        <main key={pathname} className="mx-auto w-full max-w-[1180px] flex-1 animate-fadeUp px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>

        {/* Tombol pintas di HP — dalam jangkauan ibu jari */}
        {canCreateOrder(role) && (
          <Link
            href="/pickup"
            className="fixed bottom-5 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-brand-700 text-white shadow-navy transition duration-150 hover:bg-brand-600 active:scale-95 sm:hidden"
            aria-label="Buat pickup baru"
          >
            <Icon name="plus" className="h-6 w-6" />
          </Link>
        )}

        <footer className="border-t border-line px-4 py-4 text-center text-[12.5px] text-ink-3 sm:px-6">
          <span className="inline-block h-[2px] w-8 rounded-full bg-silver-line align-middle" />
          <span className="mx-3 align-middle">{HOTEL_NAME} · Guest Laundry Tracking System</span>
          <span className="inline-block h-[2px] w-8 rounded-full bg-silver-line align-middle" />
        </footer>
      </div>
    </div>
  );
}

function PendingScreen({ name, onLogout }: { name: string; onLogout: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card max-w-md animate-fadeUp px-7 py-9 text-center">
        <Monogram className="mx-auto mb-5 h-14 w-14 text-[30px]" ring />
        <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon name="lock" />
        </div>
        <h1 className="font-display text-xl font-bold text-ink">Akun belum diberi peran</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          Halo <b>{name}</b>. Akun Anda sudah terdaftar, tapi Super Admin belum menentukan peran Anda
          (Valet, Attendant, Supervisor, atau HK Leader).
        </p>
        <p className="mt-3 text-[14px] text-ink-3">
          Hubungi Super Admin untuk mengaktifkan akses, lalu muat ulang halaman ini.
        </p>
        <button onClick={onLogout} className="btn-ghost mt-6">
          Keluar
        </button>
      </div>
    </div>
  );
}

function SetupScreen() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card max-w-lg animate-fadeUp px-7 py-9">
        <Monogram className="mb-5 h-12 w-12 text-[26px]" ring />
        <h1 className="font-display text-xl font-bold text-ink">Aplikasi belum tersambung ke Firebase</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          Environment Variable Firebase belum diisi, jadi login dan database belum bisa dipakai.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14.5px] text-ink-2">
          <li>
            Buka file <code className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">.env.local.example</code>, salin
            menjadi <code className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">.env.local</code>.
          </li>
          <li>Isi nilainya dari Firebase Console → Project settings → Your apps.</li>
          <li>
            Jalankan ulang <code className="rounded bg-brand-50 px-1.5 py-0.5 text-brand-700">npm run dev</code>.
          </li>
          <li>
            Di Vercel, isi nilai yang sama di Settings → Environment Variables dengan tipe <b>Config</b>, lalu
            deploy ulang.
          </li>
        </ol>
        <p className="mt-4 text-[13.5px] text-ink-3">Panduan lengkapnya ada di file README.md.</p>
      </div>
    </div>
  );
}
