// =====================================================================
// Semua "bentuk data" aplikasi didefinisikan di sini.
// Kalau nanti ada field baru, tambahkan di file ini dulu.
// =====================================================================

/** Peran pengguna. Menentukan tombol apa yang boleh ditekan. */
export type Role =
  | "super_admin"
  | "hk_leader"
  | "hk_supervisor"
  | "attendant"
  | "valet"
  | "front_office"
  | "pending"; // baru login, belum diberi peran oleh admin

/** Urutan status nota laundry (siklus 9 tahap). */
export type OrderStatus =
  | "requested"
  | "picked_up"
  | "sorted"
  | "in_process"
  | "on_vendor"
  | "returned"
  | "ready"
  | "delivered"
  | "pending_audit"
  | "verified"
  | "cancelled";

export type ServiceType = "regular" | "express" | "same_day";

/** Cara tamu membayar laundry — diisi oleh Front Office. */
export type PaymentType = "cash_basis" | "charge_to_room" | "included_breakdown" | "unset";
export type Treatment = "wash_press" | "press_only" | "dry_clean" | "package";
export type Route = "in_house" | "vendor" | "mixed";

export interface OrderItem {
  itemCode: string;
  itemName: string;
  treatment: Treatment;
  route: "in_house" | "vendor";
  qtyGuest: number; // jumlah menurut tamu
  qtyHotel: number; // jumlah menurut hotel
  unitPrice: number;
  isPackage?: boolean; // baris ini harga paket, bukan harga satuan
  note?: string;
}

export interface PhotoRef {
  url: string;
  stage: "pickup" | "damage" | "handover" | "return" | "delivery";
  at: number; // epoch ms
  by: string; // email
  caption?: string;
}

export interface SignatureRef {
  url: string;
  kind: "guest_pickup" | "vendor_courier" | "guest_delivery";
  name: string;
  at: number;
}

export interface TimelineEntry {
  status: OrderStatus | "issue_opened" | "issue_closed" | "note";
  at: number;
  by: string;
  byName: string;
  note?: string;
}

export interface LaundryOrder {
  id: string;
  trackingCode: string;
  roomNumber: string;
  guestName: string;
  guestPhone?: string;
  guestCheckoutDate?: string; // YYYY-MM-DD (diisi manual, dasar penjaga check-out)
  serviceType: ServiceType;
  status: OrderStatus;
  route: Route;
  vendorId?: string | null;
  vendorName?: string | null;

  items: OrderItem[];
  qtyGuestTotal: number;
  qtyHotelTotal: number;
  qtyMismatch: boolean;
  mismatchNote?: string;

  subtotal: number;
  surcharge: number;
  grandTotal: number;
  chargeStatus: "draft" | "posted" | "complimentary" | "void";

  /** Nomor bill manual, disamakan dengan nota kertas / PMS. */
  billNumber?: string;
  /** Cara bayar menurut Front Office. */
  paymentType?: PaymentType;
  /** Keterangan bebas cara bayar, mis. "termasuk paket meeting". */
  paymentRemark?: string;
  paymentBy?: string;
  paymentAt?: number | null;

  /** Diisi bila nota ini berasal dari permintaan Front Office. */
  requestId?: string | null;

  promisedAt: number | null;
  createdAt: number;
  updatedAt: number;
  timestamps: Partial<Record<OrderStatus, number>>;

  createdBy: string;
  createdByName: string;
  pickedUpBy?: string;
  deliveredBy?: string;
  verifiedBy?: string;

  photos: PhotoRef[];
  signatures: SignatureRef[];
  timeline: TimelineEntry[];

  qcPassed?: boolean;
  qcNote?: string;
  handoverNote?: string;
  vendorPromisedAt?: number | null;

  openIssueCount: number;
  isLocked: boolean;
}

export type IssueType =
  | "lost"
  | "damaged"
  | "discolored"
  | "wrong_room"
  | "late"
  | "complaint";

export interface LaundryIssue {
  id: string;
  orderId: string;
  trackingCode: string;
  roomNumber: string;
  type: IssueType;
  description: string;
  photos: string[];
  lossValue: number;
  liableParty: "hotel" | "vendor" | "guest" | "unknown";
  resolution?: "replace" | "discount" | "free" | "vendor_claim" | "no_action";
  resolutionNote?: string;
  status: "open" | "in_review" | "resolved";
  dueDate?: string;
  createdAt: number;
  createdBy: string;
  resolvedAt?: number;
  resolvedBy?: string;
}

/** Permintaan penjemputan yang dibuat Front Office, sebelum jadi nota. */
export interface PickupRequest {
  id: string;
  roomNumber: string;
  guestName: string;
  guestPhone?: string;
  guestCheckoutDate?: string;
  serviceType: ServiceType;
  note?: string;
  billNumber?: string;
  paymentType?: PaymentType;
  paymentRemark?: string;
  status: "open" | "converted" | "cancelled";
  createdAt: number;
  createdBy: string;
  createdByName: string;
  convertedAt?: number;
  convertedBy?: string;
  orderId?: string;
  cancelNote?: string;
}

export interface PriceItem {
  id: string; // = itemCode
  itemName: string;
  category: string;
  prices: Partial<Record<Treatment, number>>;
  defaultRoute: "in_house" | "vendor";
  /** true = baris paket berharga tetap (mis. "Paket Kiloan 5 kg"). */
  isPackage?: boolean;
  active: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  slaHours: number;
  specialties: string;
  active: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  photoURL?: string;
  role: Role;
  active: boolean;
  createdAt: number;
}

export interface AppSettings {
  hotelName: string;
  hotelCode: string;
  cutOffHour: number; // mis. 10 => cut-off pukul 10:00
  sameDayDoneHour: number; // mis. 18 => selesai pukul 18:00
  regularDoneHour: number; // mis. 10 => besok pukul 10:00
  expressHours: number; // mis. 4 => selesai 4 jam dari pickup
  expressSurchargePct: number; // mis. 50
  requirePickupPhoto: boolean;
  requireGuestSignature: boolean;
  pickupResponseMinutes: number; // mis. 5
}
