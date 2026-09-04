// =====================================================================
// "Mesin status": urutan tahap, siapa yang boleh menaikkan, dan warnanya.
// Semua aturan alur ada di satu file ini supaya mudah diubah.
// =====================================================================
import type { OrderStatus, Role, ServiceType, AppSettings, PaymentType } from "./types";

export const STATUS_ORDER: OrderStatus[] = [
  "requested",
  "picked_up",
  "sorted",
  "in_process",
  "on_vendor",
  "returned",
  "ready",
  "delivered",
  "pending_audit",
  "verified",
];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  requested: "Permintaan",
  picked_up: "Sudah Diambil",
  sorted: "Disortir",
  in_process: "Proses In-House",
  on_vendor: "Di Vendor",
  returned: "Kembali & QC",
  ready: "Siap Antar",
  delivered: "Sudah Diantar",
  pending_audit: "Menunggu Audit",
  verified: "Terverifikasi",
  cancelled: "Dibatalkan",
};

export const STATUS_STEP: Record<OrderStatus, string> = {
  requested: "01",
  picked_up: "02",
  sorted: "03",
  in_process: "04a",
  on_vendor: "04b",
  returned: "05",
  ready: "06",
  delivered: "07",
  pending_audit: "08",
  verified: "09",
  cancelled: "—",
};

/** Kelas Tailwind untuk pil status. */
export const STATUS_CLASS: Record<OrderStatus, string> = {
  requested: "bg-slate-100 text-slate-700 ring-slate-200",
  picked_up: "bg-brand-50 text-brand-700 ring-brand-200",
  sorted: "bg-sky-50 text-sky-700 ring-sky-200",
  in_process: "bg-gold-50 text-gold-800 ring-gold-200",
  on_vendor: "bg-gold-100 text-gold-800 ring-gold-300",
  returned: "bg-sky-50 text-sky-700 ring-sky-200",
  ready: "bg-brand-100 text-brand-700 ring-brand-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  pending_audit: "bg-gold-50 text-gold-800 ring-gold-200",
  verified: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  cancelled: "bg-rose-50 text-rose-700 ring-rose-200",
};

export const SERVICE_LABEL: Record<ServiceType, string> = {
  regular: "Reguler",
  express: "Express",
  same_day: "Same Day",
};

export const TREATMENT_LABEL = {
  wash_press: "Cuci + Setrika",
  press_only: "Setrika Saja",
  dry_clean: "Dry Clean",
  package: "Paket",
} as const;

/** Cara bayar — diisi Front Office. */
export const PAYMENT_LABEL: Record<PaymentType, string> = {
  unset: "Belum ditentukan",
  cash_basis: "Cash Basis",
  charge_to_room: "Charge to Room",
  included_breakdown: "Included by Breakdown",
};

export const PAYMENT_CLASS: Record<PaymentType, string> = {
  unset: "bg-slate-100 text-slate-600 ring-slate-200",
  cash_basis: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  charge_to_room: "bg-brand-50 text-brand-700 ring-brand-200",
  included_breakdown: "bg-gold-50 text-gold-800 ring-gold-200",
};

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  hk_leader: "HK Leader",
  hk_supervisor: "HK Supervisor",
  attendant: "Laundry Attendant",
  valet: "Laundry Valet",
  front_office: "Front Office",
  pending: "Belum Diberi Peran",
};

/**
 * Peran mana yang boleh menaikkan status ke tahap tertentu.
 * Super Admin & HK Leader selalu boleh (dicek terpisah).
 */
const TRANSITION_ROLES: Record<OrderStatus, Role[]> = {
  requested: ["valet", "hk_supervisor", "front_office", "attendant"],
  picked_up: ["valet", "hk_supervisor"],
  sorted: ["attendant", "hk_supervisor"],
  in_process: ["attendant", "hk_supervisor"],
  on_vendor: ["hk_supervisor"],
  returned: ["hk_supervisor", "attendant"],
  ready: ["attendant", "hk_supervisor", "valet"],
  delivered: ["valet", "hk_supervisor"],
  pending_audit: ["valet", "hk_supervisor", "attendant"],
  verified: [],
  cancelled: ["hk_supervisor"],
};

export function canSetStatus(role: Role, target: OrderStatus): boolean {
  if (role === "super_admin") return true;
  if (role === "hk_leader") return true;
  return (TRANSITION_ROLES[target] || []).includes(role);
}

export function canVerify(role: Role): boolean {
  return role === "super_admin" || role === "hk_leader";
}

export function canManageMaster(role: Role): boolean {
  return role === "super_admin";
}

export function canCreateOrder(role: Role): boolean {
  return ["super_admin", "hk_leader", "hk_supervisor", "valet", "front_office"].includes(role);
}

/**
 * Cara bayar & nomor bill adalah wewenang Front Office.
 * Super Admin ikut disertakan sebagai pemilik sistem, supaya kalau FO
 * salah isi di luar jam kerja masih ada yang bisa membetulkan.
 */
export function canSetPayment(role: Role): boolean {
  return role === "front_office" || role === "super_admin";
}

/** Siapa yang boleh membuat permintaan penjemputan (belum jadi nota). */
export function canCreateRequest(role: Role): boolean {
  return ["front_office", "super_admin", "hk_leader", "hk_supervisor"].includes(role);
}

/** Siapa yang boleh mengubah permintaan FO menjadi nota pickup. */
export function canConvertRequest(role: Role): boolean {
  return ["valet", "hk_supervisor", "hk_leader", "super_admin"].includes(role);
}

/** Status berikutnya yang wajar, berdasarkan rute nota. */
export function nextStatuses(current: OrderStatus, route: string): OrderStatus[] {
  switch (current) {
    case "requested":
      return ["picked_up"];
    case "picked_up":
      return ["sorted"];
    // Rute hanya SARAN dari daftar harga. Nota apa pun boleh dikirim ke vendor,
    // karena di lapangan mesin bisa penuh atau rusak sewaktu-waktu.
    case "sorted":
      return route === "vendor" ? ["on_vendor", "in_process"] : ["in_process", "on_vendor"];
    case "in_process":
      return ["ready", "on_vendor"];
    case "on_vendor":
      return ["returned"];
    case "returned":
      return ["ready"];
    case "ready":
      return ["delivered"];
    case "delivered":
      return ["pending_audit"];
    case "pending_audit":
      return ["verified"];
    default:
      return [];
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  hotelName: "Hotel Aston Cirebon",
  hotelCode: "ACR",
  cutOffHour: 10,
  sameDayDoneHour: 18,
  regularDoneHour: 10,
  expressHours: 4,
  expressSurchargePct: 50,
  requirePickupPhoto: true,
  requireGuestSignature: false,
  pickupResponseMinutes: 5,
};

/**
 * Hitung janji selesai otomatis.
 * - Express  : jam pickup + expressHours
 * - Same day : hari ini pukul sameDayDoneHour
 * - Reguler  : sebelum cut-off -> hari ini; sesudah cut-off -> besok pagi
 */
export function computePromisedAt(
  serviceType: ServiceType,
  from: Date,
  s: AppSettings
): number {
  const d = new Date(from.getTime());
  if (serviceType === "express") {
    d.setHours(d.getHours() + s.expressHours);
    return d.getTime();
  }
  if (serviceType === "same_day") {
    d.setHours(s.sameDayDoneHour, 0, 0, 0);
    if (d.getTime() <= from.getTime()) d.setDate(d.getDate() + 1);
    return d.getTime();
  }
  if (from.getHours() < s.cutOffHour) {
    d.setHours(s.sameDayDoneHour, 0, 0, 0);
  } else {
    d.setDate(d.getDate() + 1);
    d.setHours(s.regularDoneHour, 0, 0, 0);
  }
  return d.getTime();
}
