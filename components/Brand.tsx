// Logo kunci aplikasi: monogram A emas di atas navy + nama hotel.
// Dipakai di sidebar, halaman login, dan mana pun identitas hotel perlu tampil.

export function Monogram({ className = "h-9 w-9", ring = false }: { className?: string; ring?: boolean }) {
  return (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-sheen ${className} ${
        ring ? "ring-1 ring-gold-500/40" : ""
      }`}
      aria-hidden="true"
    >
      <span className="font-display text-[1.05em] font-bold leading-none text-gold-500">A</span>
      <span className="absolute bottom-[18%] h-[2px] w-[42%] rounded-full bg-gold-300" />
    </span>
  );
}

export default function Brand({
  tone = "light",
  size = "md",
}: {
  tone?: "light" | "dark";
  size?: "sm" | "md";
}) {
  const judul = tone === "dark" ? "text-white" : "text-ink";
  const anak = tone === "dark" ? "text-gold-300/80" : "text-ink-3";
  const besarJudul = size === "sm" ? "text-[14px]" : "text-[16px]";

  return (
    <span className="flex items-center gap-2.5">
      <Monogram className={size === "sm" ? "h-8 w-8 text-[17px]" : "h-9 w-9 text-[19px]"} ring={tone === "dark"} />
      <span className="min-w-0">
        <span className={`block truncate font-display font-bold leading-tight tracking-tight ${judul} ${besarJudul}`}>
          Aston Cirebon
        </span>
        <span className={`block truncate text-[10px] font-semibold uppercase tracking-[0.16em] ${anak}`}>
          Guest Laundry
        </span>
      </span>
    </span>
  );
}
