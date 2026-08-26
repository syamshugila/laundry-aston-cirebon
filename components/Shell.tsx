"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { HOTEL_NAME } from "@/lib/firebase";
import { ROLE_LABEL } from "@/lib/status";
import Icon, { type IconName } from "./Icon";
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

  useEffect(() => setOpen(false), [pathname]);

  if (!configured) return <SetupScreen />;
  if (loading) return <div className="grid min-h-screen place-items-center"><Spinner label="Menyiapkan aplikasi…" /></div>;
  if (!user) return <LoginScreen />;
  if (role === "pending") return <PendingScreen name={profile?.name || user.email || ""} onLogout={logout} />;

  return (
    <div className="min-h-screen lg:flex">
      {/* ---------- Sidebar ---------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[250px] shrink-0 border-r border-line bg-white transition-transform lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2.5 border-b border-line px-4 py-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-700 text-white">
              <Icon name="box" className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[15px] font-extrabold leading-tight tracking-tight text-ink">VERITAS</p>
              <p className="truncate text-[10.5px] uppercase tracking-[0.1em] text-ink-3">Guest Laundry</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto rounded-md p-1.5 text-ink-3 hover:bg-slate-100 lg:hidden" aria-label="Tutup menu">
              <Icon name="close" className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-2.5 py-3">
            {NAV.map((g) => {
              const items = g.items.filter((i) => boleh(i, role));
              if (!items.length) return null;
              return (
                <div key={g.group} className="mb-4">
                  <p className="px-2.5 pb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">{g.group}</p>
                  <ul className="space-y-0.5">
                    {items.map((i) => {
                      const active = i.href === "/" ? pathname === "/" : pathname.startsWith(i.href);
                      return (
                        <li key={i.href}>
                          <Link
                            href={i.href}
                            className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium transition ${
                              active ? "bg-brand-50 text-brand-700" : "text-ink-2 hover:bg-slate-50 hover:text-ink"
                            }`}
                          >
                            <Icon name={i.icon} className="h-[18px] w-[18px] shrink-0" />
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

          <div className="border-t border-line px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">Peran Aktif</p>
            <p className="mt-0.5 text-[13.5px] font-semibold text-brand-700">{ROLE_LABEL[role]}</p>
          </div>
        </div>
      </aside>

      {open && <button className="fixed inset-0 z-30 bg-ink/30 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu" />}

      {/* ---------- Konten ---------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-white/90 px-4 py-3 backdrop-blur">
          <button onClick={() => setOpen(true)} className="rounded-md p-1.5 text-ink-2 hover:bg-slate-100 lg:hidden" aria-label="Buka menu">
            <Icon name="menu" />
          </button>

          <Link href="/pickup" className="btn-primary hidden py-2 text-[13px] sm:inline-flex">
            <Icon name="plus" className="h-4 w-4" /> Pickup Baru
          </Link>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${
              online ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"
            }`}
            title={online ? "Terhubung ke server" : "Data disimpan di HP dulu, terkirim otomatis saat sinyal kembali"}
          >
            <Icon name="wifi" className="h-3.5 w-3.5" />
            {online ? "Tersambung" : "Luring — menunggu sinyal"}
          </span>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[13px] font-semibold leading-tight text-ink">{profile?.name || user.displayName}</p>
              <p className="text-[11px] uppercase tracking-wider text-ink-3">{ROLE_LABEL[role]}</p>
            </div>
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-brand-700 text-[13px] font-bold text-white">
              {(profile?.name || user.displayName || "?").charAt(0).toUpperCase()}
            </div>
            <button onClick={logout} className="rounded-md p-2 text-ink-3 hover:bg-slate-100 hover:text-rose-600" title="Keluar" aria-label="Keluar">
              <Icon name="logout" className="h-[18px] w-[18px]" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

        <footer className="border-t border-line px-4 py-4 text-center text-[12.5px] text-ink-3 sm:px-6">
          VERITAS Guest Laundry Tracking System · {HOTEL_NAME}
        </footer>
      </div>
    </div>
  );
}

function PendingScreen({ name, onLogout }: { name: string; onLogout: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="card max-w-md px-7 py-9 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-700">
          <Icon name="lock" />
        </div>
        <h1 className="text-xl font-bold text-ink">Akun belum diberi peran</h1>
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
      <div className="card max-w-lg px-7 py-9">
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-700">
          <Icon name="settings" />
        </div>
        <h1 className="text-xl font-bold text-ink">Aplikasi belum tersambung ke Firebase</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
          Environment Variable Firebase belum diisi, jadi login dan database belum bisa dipakai.
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[14.5px] text-ink-2">
          <li>Buka file <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local.example</code>, salin menjadi <code className="rounded bg-slate-100 px-1.5 py-0.5">.env.local</code>.</li>
          <li>Isi nilainya dari Firebase Console → Project settings → Your apps.</li>
          <li>Jalankan ulang <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run dev</code>.</li>
          <li>Di Vercel, isi nilai yang sama di Settings → Environment Variables, lalu deploy ulang.</li>
        </ol>
        <p className="mt-4 text-[13.5px] text-ink-3">Panduan lengkapnya ada di file README.md.</p>
      </div>
    </div>
  );
}
