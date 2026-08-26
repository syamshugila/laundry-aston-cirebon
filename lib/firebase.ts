// =====================================================================
// Inisialisasi Firebase. Semua nilai dibaca dari Environment Variable,
// TIDAK ada kredensial yang ditulis langsung di file ini.
// =====================================================================
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FB_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FB_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FB_APP_ID,
};

/** true kalau semua ENV wajib sudah terisi. Dipakai untuk menampilkan pesan setup. */
export const firebaseReady = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain
);

let app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function ensureApp(): FirebaseApp {
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(ensureApp());
  return _auth;
}

/**
 * Firestore dengan cache lokal (offline-first).
 * Valet tetap bisa menyimpan data saat Wi-Fi hilang di lift/koridor;
 * data terkirim otomatis begitu sinyal kembali.
 */
export function getDb(): Firestore {
  if (_db) return _db;
  const a = ensureApp();
  if (typeof window === "undefined") {
    _db = getFirestore(a);
    return _db;
  }
  try {
    _db = initializeFirestore(a, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    _db = getFirestore(a);
  }
  return _db;
}

export const googleProvider = new GoogleAuthProvider();

export const SUPER_ADMIN_EMAILS = (
  process.env.NEXT_PUBLIC_ADMIN_EMAILS || "syam.rakhmany@gmail.com"
)
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const HOTEL_NAME = process.env.NEXT_PUBLIC_HOTEL_NAME || "Hotel Aston Cirebon";
export const HOTEL_CODE = process.env.NEXT_PUBLIC_HOTEL_CODE || "ACR";
export const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || "";
