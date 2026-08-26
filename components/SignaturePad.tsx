"use client";
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

/**
 * Papan tanda tangan sederhana. Tamu/kurir menandatangani langsung di layar HP.
 * Hasilnya berupa gambar (dataURL) yang lalu diunggah ke Google Drive.
 */
export default function SignaturePad({
  label,
  onChange,
}: {
  label: string;
  onChange: (dataUrl: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const menggambar = useRef(false);
  const adaGoresan = useRef(false);
  const [terisi, setTerisi] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = c.getBoundingClientRect();
    c.width = rect.width * dpr;
    c.height = rect.height * dpr;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#16212C";
  }, []);

  function posisi(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function mulai(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = posisi(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    menggambar.current = true;
  }

  function gerak(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!menggambar.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = posisi(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    adaGoresan.current = true;
  }

  function selesai() {
    if (!menggambar.current) return;
    menggambar.current = false;
    if (adaGoresan.current) {
      setTerisi(true);
      onChange(canvasRef.current?.toDataURL("image/png") || null);
    }
  }

  function bersihkan() {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    adaGoresan.current = false;
    setTerisi(false);
    onChange(null);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        {terisi && (
          <button type="button" onClick={bersihkan} className="text-[12.5px] font-semibold text-rose-600 hover:underline">
            Hapus & ulangi
          </button>
        )}
      </div>
      <div className="relative overflow-hidden rounded-lg border border-dashed border-line bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={mulai}
          onPointerMove={gerak}
          onPointerUp={selesai}
          onPointerLeave={selesai}
          className="h-[150px] w-full touch-none"
        />
        {!terisi && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center text-[13.5px] text-ink-3">
            <span className="flex items-center gap-2">
              <Icon name="pen" className="h-4 w-4" /> Tanda tangan di sini
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
