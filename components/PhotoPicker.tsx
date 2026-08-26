"use client";
import { useRef, useState } from "react";
import Icon from "./Icon";
import { uploadFoto, uploadReady } from "@/lib/upload";

/**
 * Ambil foto langsung dari kamera HP, perkecil, lalu unggah ke Google Drive.
 * Yang disimpan ke Firestore hanyalah link fotonya.
 */
export default function PhotoPicker({
  label,
  hint,
  prefix,
  urls,
  onChange,
  max = 6,
}: {
  label: string;
  hint?: string;
  prefix: string;
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [sedang, setSedang] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setPesan(null);
    setSedang(true);
    const hasil = [...urls];
    for (const f of files.slice(0, max - urls.length)) {
      try {
        const url = await uploadFoto(f, `${prefix}-${Date.now()}`);
        hasil.push(url);
      } catch (err) {
        setPesan(err instanceof Error ? err.message : "Foto gagal diunggah");
      }
    }
    onChange(hasil);
    setSedang(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <span className="text-[12px] text-ink-3">
          {urls.length}/{max}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={u + i} className="group relative h-20 w-20 overflow-hidden rounded-lg border border-line bg-slate-50">
            <span className="grid h-full w-full place-items-center text-ink-3">
              <Icon name="camera" className="h-5 w-5" />
            </span>
            <a
              href={u}
              target="_blank"
              rel="noreferrer"
              className="absolute inset-0 grid place-items-center bg-ink/0 text-[11px] font-semibold text-transparent transition group-hover:bg-ink/60 group-hover:text-white"
            >
              Lihat
            </a>
            <button
              type="button"
              onClick={() => onChange(urls.filter((_, k) => k !== i))}
              className="absolute right-0.5 top-0.5 rounded bg-white/90 p-1 text-rose-600 shadow"
              aria-label="Hapus foto"
            >
              <Icon name="close" className="h-3 w-3" />
            </button>
          </div>
        ))}

        {urls.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={sedang || !uploadReady}
            className="grid h-20 w-20 place-items-center rounded-lg border border-dashed border-line bg-white text-ink-3 transition hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
          >
            {sedang ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-700" />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <Icon name="camera" className="h-5 w-5" />
                <span className="text-[10.5px] font-semibold">Ambil</span>
              </span>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={pilih}
        className="hidden"
      />

      {hint && <p className="mt-1.5 text-[12.5px] text-ink-3">{hint}</p>}
      {!uploadReady && (
        <p className="mt-1.5 text-[12.5px] text-amber-700">
          Upload foto belum aktif. Isi <b>NEXT_PUBLIC_UPLOAD_URL</b> (lihat README bagian Upload Foto).
        </p>
      )}
      {pesan && <p className="mt-1.5 text-[12.5px] text-rose-600">{pesan}</p>}
    </div>
  );
}
