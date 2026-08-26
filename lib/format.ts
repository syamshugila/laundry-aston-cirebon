// Fungsi bantu tampilan: rupiah, tanggal, jam, sisa waktu.

export function rupiah(n: number | undefined | null): string {
  const v = Number(n || 0);
  return "Rp " + v.toLocaleString("id-ID");
}

/**
 * Ubah nilai waktu apa pun menjadi epoch milidetik.
 * Firestore bisa mengembalikan Timestamp (punya .toMillis / .seconds),
 * sementara aplikasi ini menyimpan angka biasa. Fungsi ini menyamakan
 * keduanya supaya tidak muncul tulisan "Invalid Date".
 */
export function keMs(nilai: unknown): number | null {
  if (nilai == null) return null;
  if (typeof nilai === "number") return Number.isFinite(nilai) ? nilai : null;
  if (nilai instanceof Date) return nilai.getTime();
  if (typeof nilai === "object") {
    const o = nilai as { toMillis?: () => number; seconds?: number; _seconds?: number };
    if (typeof o.toMillis === "function") return o.toMillis();
    if (typeof o.seconds === "number") return o.seconds * 1000;
    if (typeof o._seconds === "number") return o._seconds * 1000;
  }
  if (typeof nilai === "string") {
    const t = Date.parse(nilai);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

export function tanggal(ms?: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function jam(ms?: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

export function tanggalJam(ms?: number | null): string {
  if (!ms) return "—";
  return `${tanggal(ms)} · ${jam(ms)}`;
}

export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** "2 jam lagi" / "Telat 40 menit" */
export function sisaWaktu(target?: number | null, now = Date.now()): { text: string; level: "ok" | "warn" | "late" } {
  if (!target) return { text: "—", level: "ok" };
  const diff = target - now;
  const menit = Math.round(Math.abs(diff) / 60000);
  const jamB = Math.floor(menit / 60);
  const sisaMenit = menit % 60;
  const teks = jamB > 0 ? `${jamB} jam ${sisaMenit} mnt` : `${menit} mnt`;
  if (diff < 0) return { text: `Telat ${teks}`, level: "late" };
  if (diff < 60 * 60 * 1000) return { text: `${teks} lagi`, level: "warn" };
  return { text: `${teks} lagi`, level: "ok" };
}

/** Ambil lantai dari nomor kamar: "812" -> "Lantai 8", "1204" -> "Lantai 12" */
export function lantaiDari(room: string): string {
  const bersih = (room || "").replace(/\D/g, "");
  if (bersih.length <= 2) return "Lantai 1";
  return "Lantai " + bersih.slice(0, bersih.length - 2);
}

/** Kode lacak: ACR-260821-0142 */
export function buatKodeLacak(hotelCode: string, urutan: number, d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const tgl = `${String(d.getFullYear()).slice(2)}${p(d.getMonth() + 1)}${p(d.getDate())}`;
  return `${hotelCode}-${tgl}-${String(urutan).padStart(4, "0")}`;
}

export function durasiJam(mulai?: number | null, selesai?: number | null): string {
  if (!mulai || !selesai) return "—";
  const j = (selesai - mulai) / 3600000;
  return `${j.toFixed(1)} jam`;
}
