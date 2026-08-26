// =====================================================================
// Upload foto & tanda tangan ke Google Drive lewat Google Apps Script.
// Data (link foto) disimpan di Firestore; file-nya ada di Drive.
// =====================================================================
import { UPLOAD_URL } from "./firebase";

export const uploadReady = Boolean(UPLOAD_URL);

/** Perkecil foto sebelum dikirim supaya hemat kuota & cepat di sinyal lemah. */
export function kompresGambar(file: File, maxSisi = 1280, mutu = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File bukan gambar yang valid"));
      img.onload = () => {
        let { width, height } = img;
        const skala = Math.min(1, maxSisi / Math.max(width, height));
        width = Math.round(width * skala);
        height = Math.round(height * skala);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Browser tidak mendukung canvas"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", mutu));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Kirim gambar (dataURL) ke Apps Script, dapatkan link Drive.
 * Kalau NEXT_PUBLIC_UPLOAD_URL belum diisi, fungsi ini melempar error
 * dengan pesan yang jelas supaya tidak membingungkan.
 */
export async function uploadKeDrive(dataUrl: string, namaFile: string): Promise<string> {
  if (!UPLOAD_URL) {
    throw new Error(
      "Upload foto belum aktif. Isi NEXT_PUBLIC_UPLOAD_URL di Environment Variable (lihat README bagian Upload Foto)."
    );
  }
  const res = await fetch(UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ foto: dataUrl, nama: namaFile }),
  });
  if (!res.ok) throw new Error("Server upload menolak permintaan (" + res.status + ")");
  const json = await res.json();
  if (json.status !== "ok" || !json.url) throw new Error(json.message || "Upload gagal");
  return json.url as string;
}

export async function uploadFoto(file: File, namaFile: string): Promise<string> {
  const dataUrl = await kompresGambar(file);
  return uploadKeDrive(dataUrl, namaFile);
}
