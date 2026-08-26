/* eslint-disable @next/next/no-img-element */
// Logo resmi Aston Cirebon Hotel & Convention Center.
// Versi navy dipakai di latar terang, versi putih di latar navy.

export function Monogram({ className = "h-9 w-9", ring = false }: { className?: string; ring?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center overflow-hidden rounded-lg bg-navy-sheen ${className} ${
        ring ? "ring-1 ring-white/15" : ""
      }`}
      aria-hidden="true"
    >
      <img src="/icon-192.png" alt="" className="h-full w-full object-cover" />
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
  const tinggi = size === "sm" ? "h-8" : "h-10";
  const garis = tone === "dark" ? "bg-white/20" : "bg-line";
  const sub = tone === "dark" ? "text-silver-300" : "text-silver-600";

  return (
    <span className="flex min-w-0 items-center gap-3">
      <img
        src={tone === "dark" ? "/logo-aston-putih.png" : "/logo-aston.png"}
        alt="Aston Cirebon Hotel &amp; Convention Center"
        className={`${tinggi} w-auto shrink-0`}
      />
      <span className={`h-8 w-px shrink-0 ${garis}`} aria-hidden="true" />
      <span
        className={`font-display text-[10px] font-medium uppercase leading-[1.35] tracking-brand ${sub}`}
      >
        Guest
        <br />
        Laundry
      </span>
    </span>
  );
}
