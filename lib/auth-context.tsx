"use client";
// =====================================================================
// Menyimpan siapa yang sedang login + perannya, supaya bisa dipakai
// di semua halaman tanpa mengambil ulang dari Firebase.
// =====================================================================
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseAuth, getDb, googleProvider, firebaseReady, SUPER_ADMIN_EMAILS } from "./firebase";
import type { AppUser, Role } from "./types";

interface AuthState {
  user: User | null;
  profile: AppUser | null;
  role: Role;
  loading: boolean;
  configured: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const Ctx = createContext<AuthState>({
  user: null,
  profile: null,
  role: "pending",
  loading: true,
  configured: false,
  login: async () => {},
  logout: async () => {},
  error: null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseReady) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(getFirebaseAuth(), async (u) => {
      setUser(u);
      if (!u) {
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        const db = getDb();
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        const email = (u.email || "").toLowerCase();
        const isSuper = SUPER_ADMIN_EMAILS.includes(email);

        if (!snap.exists()) {
          // Pengguna baru: dibuat dengan peran "pending" sampai admin memberi peran.
          // Disimpan sebagai angka epoch supaya tanggalnya bisa langsung dibaca
          // di semua halaman tanpa perlu diubah dari Timestamp.
          const baru: AppUser = {
            uid: u.uid,
            email,
            name: u.displayName || email,
            photoURL: u.photoURL || "",
            role: isSuper ? "super_admin" : "pending",
            active: true,
            createdAt: Date.now(),
          };
          await setDoc(ref, baru, { merge: true });
          setProfile(baru);
        } else {
          const data = snap.data() as AppUser;
          // Super admin dari ENV selalu menang, supaya tidak pernah terkunci di luar.
          const role: Role = isSuper ? "super_admin" : data.role || "pending";
          if (isSuper && data.role !== "super_admin") {
            await setDoc(ref, { role: "super_admin" }, { merge: true });
          }
          setProfile({ ...data, uid: u.uid, email, role });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal memuat profil pengguna");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      profile,
      role: profile?.active === false ? "pending" : profile?.role || "pending",
      loading,
      configured: firebaseReady,
      error,
      login: async () => {
        setError(null);
        try {
          await signInWithPopup(getFirebaseAuth(), googleProvider);
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Login gagal";
          setError(
            msg.includes("unauthorized-domain")
              ? "Domain ini belum diizinkan di Firebase. Tambahkan domain aplikasi di Authentication → Settings → Authorized domains."
              : msg
          );
        }
      },
      logout: async () => {
        await signOut(getFirebaseAuth());
      },
    }),
    [user, profile, loading, error]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
