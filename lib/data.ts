"use client";
// =====================================================================
// Semua komunikasi dengan Firestore dikumpulkan di file ini.
// Halaman-halaman hanya memanggil fungsi dari sini.
// =====================================================================
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit as qLimit,
  runTransaction,
  arrayUnion,
  increment,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb, HOTEL_CODE } from "./firebase";
import { buatKodeLacak, todayKey, keMs } from "./format";
import { DEFAULT_SETTINGS, computePromisedAt } from "./status";
import type {
  LaundryOrder,
  LaundryIssue,
  OrderStatus,
  OrderItem,
  PriceItem,
  Vendor,
  AppUser,
  AppSettings,
  Role,
  PhotoRef,
  SignatureRef,
  ServiceType,
} from "./types";

const C = {
  orders: "laundry_orders",
  issues: "laundry_issues",
  prices: "price_list",
  vendors: "vendors",
  users: "users",
  settings: "app_settings",
  counters: "counters",
};

/* ------------------------------------------------------------------ */
/* PENGATURAN                                                          */
/* ------------------------------------------------------------------ */
export async function ambilSettings(): Promise<AppSettings> {
  try {
    const snap = await getDoc(doc(getDb(), C.settings, "main"));
    if (snap.exists()) return { ...DEFAULT_SETTINGS, ...(snap.data() as Partial<AppSettings>) };
  } catch {
    /* offline: pakai default */
  }
  return DEFAULT_SETTINGS;
}

export async function simpanSettings(s: AppSettings): Promise<void> {
  await setDoc(doc(getDb(), C.settings, "main"), s, { merge: true });
}

/* ------------------------------------------------------------------ */
/* KODE LACAK — nomor urut harian, aman dari tabrakan                  */
/* ------------------------------------------------------------------ */
export async function kodeLacakBaru(): Promise<string> {
  const key = todayKey();
  const ref = doc(getDb(), C.counters, key);
  try {
    const urut = await runTransaction(getDb(), async (t) => {
      const snap = await t.get(ref);
      const next = ((snap.exists() ? (snap.data().count as number) : 0) || 0) + 1;
      t.set(ref, { count: next, date: key }, { merge: true });
      return next;
    });
    return buatKodeLacak(HOTEL_CODE, urut);
  } catch {
    // Kalau sedang offline, pakai nomor dari jam+menit+detik agar tetap unik.
    const d = new Date();
    const urut = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
    return buatKodeLacak(HOTEL_CODE, urut % 10000);
  }
}

/* ------------------------------------------------------------------ */
/* NOTA LAUNDRY                                                        */
/* ------------------------------------------------------------------ */
export function hitungTotal(items: OrderItem[], serviceType: ServiceType, s: AppSettings) {
  const subtotal = items.reduce((a, it) => a + (it.unitPrice || 0) * (it.qtyHotel || 0), 0);
  const surcharge = serviceType === "express" ? Math.round((subtotal * s.expressSurchargePct) / 100) : 0;
  return { subtotal, surcharge, grandTotal: subtotal + surcharge };
}

export function hitungRoute(items: OrderItem[]): LaundryOrder["route"] {
  const adaVendor = items.some((i) => i.route === "vendor");
  const adaInHouse = items.some((i) => i.route === "in_house");
  if (adaVendor && adaInHouse) return "mixed";
  if (adaVendor) return "vendor";
  return "in_house";
}

export interface InputNotaBaru {
  roomNumber: string;
  guestName: string;
  guestPhone?: string;
  guestCheckoutDate?: string;
  serviceType: ServiceType;
  items: OrderItem[];
  mismatchNote?: string;
  photos: PhotoRef[];
  signatures: SignatureRef[];
}

export async function buatNota(
  input: InputNotaBaru,
  actor: { email: string; name: string },
  s: AppSettings
): Promise<string> {
  const now = Date.now();
  const trackingCode = await kodeLacakBaru();
  const qtyGuestTotal = input.items.reduce((a, i) => a + (i.qtyGuest || 0), 0);
  const qtyHotelTotal = input.items.reduce((a, i) => a + (i.qtyHotel || 0), 0);
  const { subtotal, surcharge, grandTotal } = hitungTotal(input.items, input.serviceType, s);

  const nota: Omit<LaundryOrder, "id"> = {
    trackingCode,
    roomNumber: input.roomNumber.trim(),
    guestName: input.guestName.trim(),
    guestPhone: input.guestPhone?.trim() || "",
    guestCheckoutDate: input.guestCheckoutDate || "",
    serviceType: input.serviceType,
    status: "picked_up",
    route: hitungRoute(input.items),
    vendorId: null,
    vendorName: null,
    items: input.items,
    qtyGuestTotal,
    qtyHotelTotal,
    qtyMismatch: qtyGuestTotal !== qtyHotelTotal,
    mismatchNote: input.mismatchNote || "",
    subtotal,
    surcharge,
    grandTotal,
    chargeStatus: "draft",
    promisedAt: computePromisedAt(input.serviceType, new Date(now), s),
    createdAt: now,
    updatedAt: now,
    timestamps: { requested: now, picked_up: now },
    createdBy: actor.email,
    createdByName: actor.name,
    pickedUpBy: actor.email,
    photos: input.photos,
    signatures: input.signatures,
    timeline: [
      { status: "requested", at: now, by: actor.email, byName: actor.name, note: "Nota dibuat" },
      { status: "picked_up", at: now, by: actor.email, byName: actor.name, note: "Cucian diambil dari kamar" },
    ],
    openIssueCount: 0,
    isLocked: false,
  };

  const ref = await addDoc(collection(getDb(), C.orders), nota);
  await catatStatistik(now, "created", qtyHotelTotal, grandTotal);
  return ref.id;
}

export interface OpsiUbahStatus {
  note?: string;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorPromisedAt?: number | null;
  qcPassed?: boolean;
  qcNote?: string;
  handoverNote?: string;
  photos?: PhotoRef[];
  signatures?: SignatureRef[];
  items?: OrderItem[];
  chargeStatus?: LaundryOrder["chargeStatus"];
}

export async function ubahStatus(
  order: LaundryOrder,
  target: OrderStatus,
  actor: { email: string; name: string },
  opsi: OpsiUbahStatus = {}
): Promise<void> {
  if (order.isLocked) throw new Error("Nota sudah terkunci dan tidak bisa diubah.");
  if (order.openIssueCount > 0 && target === "verified")
    throw new Error("Masih ada kendala terbuka. Selesaikan dulu di menu Kendala.");

  const now = Date.now();
  const patch: Record<string, unknown> = {
    status: target,
    updatedAt: now,
    [`timestamps.${target}`]: now,
    timeline: arrayUnion({
      status: target,
      at: now,
      by: actor.email,
      byName: actor.name,
      note: opsi.note || "",
    }),
  };

  if (opsi.vendorId !== undefined) patch.vendorId = opsi.vendorId;
  if (opsi.vendorName !== undefined) patch.vendorName = opsi.vendorName;
  if (opsi.vendorPromisedAt !== undefined) patch.vendorPromisedAt = opsi.vendorPromisedAt;
  if (opsi.qcPassed !== undefined) patch.qcPassed = opsi.qcPassed;
  if (opsi.qcNote !== undefined) patch.qcNote = opsi.qcNote;
  if (opsi.handoverNote !== undefined) patch.handoverNote = opsi.handoverNote;
  if (opsi.chargeStatus) patch.chargeStatus = opsi.chargeStatus;

  if (opsi.items) {
    const qtyHotelTotal = opsi.items.reduce((a, i) => a + (i.qtyHotel || 0), 0);
    patch.items = opsi.items;
    patch.qtyHotelTotal = qtyHotelTotal;
    patch.qtyMismatch = order.qtyGuestTotal !== qtyHotelTotal;
  }
  if (opsi.photos?.length) patch.photos = [...(order.photos || []), ...opsi.photos];
  if (opsi.signatures?.length) patch.signatures = [...(order.signatures || []), ...opsi.signatures];

  if (target === "delivered") patch.deliveredBy = actor.email;
  if (target === "ready" && order.chargeStatus === "draft") patch.chargeStatus = "posted";
  if (target === "verified") {
    patch.isLocked = true;
    patch.verifiedBy = actor.email;
  }

  await updateDoc(doc(getDb(), C.orders, order.id), patch);

  if (target === "delivered") await catatStatistik(now, "delivered", 0, 0);
  if (target === "verified") {
    const mulai = order.timestamps.picked_up || order.createdAt;
    await catatStatistik(now, "verified", 0, 0, (now - mulai) / 3600000);
  }
}

export async function batalkanNota(
  order: LaundryOrder,
  alasan: string,
  actor: { email: string; name: string }
) {
  const now = Date.now();
  await updateDoc(doc(getDb(), C.orders, order.id), {
    status: "cancelled",
    chargeStatus: "void",
    updatedAt: now,
    timeline: arrayUnion({
      status: "cancelled",
      at: now,
      by: actor.email,
      byName: actor.name,
      note: alasan,
    }),
  });
}

export async function tambahBukti(
  orderId: string,
  photos: PhotoRef[],
  signatures: SignatureRef[] = []
) {
  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  if (photos.length) patch.photos = arrayUnion(...photos);
  if (signatures.length) patch.signatures = arrayUnion(...signatures);
  await updateDoc(doc(getDb(), C.orders, orderId), patch);
}

export function pantauNota(
  filter: { statuses?: OrderStatus[]; batas?: number },
  cb: (rows: LaundryOrder[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  // Sengaja TIDAK memakai where(...) + orderBy(...) bersamaan, karena kombinasi itu
  // menuntut composite index di Firestore. Penyaringan status dilakukan di sisi
  // aplikasi — jumlah dokumen yang diambil sudah dibatasi, jadi tetap ringan.
  const q = query(collection(getDb(), C.orders), orderBy("createdAt", "desc"), qLimit(filter.batas || 300));
  const pilih = filter.statuses && filter.statuses.length > 0 ? new Set(filter.statuses) : null;
  return onSnapshot(
    q,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LaundryOrder, "id">) }));
      cb(pilih ? rows.filter((r) => pilih.has(r.status)) : rows);
    },
    (e) => onError?.(e)
  );
}

export function pantauSatuNota(
  id: string,
  cb: (o: LaundryOrder | null) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  return onSnapshot(
    doc(getDb(), C.orders, id),
    (snap) => cb(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<LaundryOrder, "id">) }) : null),
    (e) => onError?.(e)
  );
}

/* ------------------------------------------------------------------ */
/* KENDALA (ISSUES)                                                    */
/* ------------------------------------------------------------------ */
export async function buatKendala(
  data: Omit<LaundryIssue, "id" | "createdAt" | "status">,
  actor: { email: string; name: string }
) {
  const now = Date.now();
  await addDoc(collection(getDb(), C.issues), {
    ...data,
    status: "open",
    createdAt: now,
    createdBy: actor.email,
  });
  await updateDoc(doc(getDb(), C.orders, data.orderId), {
    openIssueCount: increment(1),
    updatedAt: now,
    timeline: arrayUnion({
      status: "issue_opened",
      at: now,
      by: actor.email,
      byName: actor.name,
      note: data.description,
    }),
  });
}

export async function selesaikanKendala(
  issue: LaundryIssue,
  resolution: NonNullable<LaundryIssue["resolution"]>,
  catatan: string,
  actor: { email: string; name: string }
) {
  const now = Date.now();
  await updateDoc(doc(getDb(), C.issues, issue.id), {
    status: "resolved",
    resolution,
    resolutionNote: catatan,
    resolvedAt: now,
    resolvedBy: actor.email,
  });
  await updateDoc(doc(getDb(), C.orders, issue.orderId), {
    openIssueCount: increment(-1),
    updatedAt: now,
    timeline: arrayUnion({
      status: "issue_closed",
      at: now,
      by: actor.email,
      byName: actor.name,
      note: `${resolution} — ${catatan}`,
    }),
  });
}

export function pantauKendala(
  cb: (rows: LaundryIssue[]) => void,
  onError?: (e: Error) => void
): Unsubscribe {
  const q = query(collection(getDb(), C.issues), orderBy("createdAt", "desc"), qLimit(200));
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<LaundryIssue, "id">) }))),
    (e) => onError?.(e)
  );
}

/* ------------------------------------------------------------------ */
/* MASTER DATA                                                         */
/* ------------------------------------------------------------------ */
export async function ambilDaftarHarga(): Promise<PriceItem[]> {
  const snap = await getDocs(collection(getDb(), C.prices));
  return snap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<PriceItem, "id">) }))
    .sort((a, b) => a.itemName.localeCompare(b.itemName));
}

export async function simpanHarga(item: PriceItem) {
  const { id, ...rest } = item;
  await setDoc(doc(getDb(), C.prices, id), rest, { merge: true });
}

export async function hapusHarga(id: string) {
  await deleteDoc(doc(getDb(), C.prices, id));
}

export async function ambilVendor(): Promise<Vendor[]> {
  const snap = await getDocs(collection(getDb(), C.vendors));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Vendor, "id">) }));
}

export async function simpanVendor(v: Vendor) {
  const { id, ...rest } = v;
  if (id) await setDoc(doc(getDb(), C.vendors, id), rest, { merge: true });
  else await addDoc(collection(getDb(), C.vendors), rest);
}

export async function hapusVendor(id: string) {
  await deleteDoc(doc(getDb(), C.vendors, id));
}

/* ------------------------------------------------------------------ */
/* PENGGUNA                                                            */
/* ------------------------------------------------------------------ */
export async function ambilPengguna(): Promise<AppUser[]> {
  const snap = await getDocs(collection(getDb(), C.users));
  return snap.docs
    .map((d) => {
      const data = d.data() as AppUser;
      // createdAt bisa berupa Timestamp Firestore atau angka biasa — samakan dulu.
      return { ...data, uid: d.id, createdAt: keMs(data.createdAt) ?? 0 };
    })
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));
}

export async function ubahPeran(uid: string, role: Role, active: boolean) {
  await updateDoc(doc(getDb(), C.users, uid), { role, active });
}

/* ------------------------------------------------------------------ */
/* STATISTIK HARIAN — supaya dashboard hemat kuota baca                */
/* ------------------------------------------------------------------ */
async function catatStatistik(
  ms: number,
  jenis: "created" | "delivered" | "verified",
  qty = 0,
  nilai = 0,
  jamProses = 0
) {
  try {
    const key = todayKey(new Date(ms));
    const ref = doc(getDb(), "daily_stats", key);
    const patch: Record<string, unknown> = { date: key };
    if (jenis === "created") {
      patch.created = increment(1);
      patch.items = increment(qty);
      patch.revenue = increment(nilai);
    }
    if (jenis === "delivered") patch.delivered = increment(1);
    if (jenis === "verified") {
      patch.verified = increment(1);
      patch.turnaroundSum = increment(jamProses);
    }
    await setDoc(ref, patch, { merge: true });
  } catch {
    /* statistik bersifat pelengkap — kegagalan di sini tidak boleh menggagalkan operasi utama */
  }
}

export { C as KOLEKSI };
