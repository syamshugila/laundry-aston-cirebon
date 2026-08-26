// Kumpulan ikon garis sederhana (tanpa library luar, supaya aplikasi tetap ringan).
type Props = { name: IconName; className?: string };

export type IconName =
  | "dashboard"
  | "list"
  | "plus"
  | "clock"
  | "truck"
  | "box"
  | "check"
  | "shield"
  | "alert"
  | "camera"
  | "pen"
  | "chart"
  | "database"
  | "users"
  | "settings"
  | "logout"
  | "menu"
  | "close"
  | "search"
  | "chevron"
  | "wifi"
  | "lock"
  | "print"
  | "trash";

const P: Record<IconName, string> = {
  dashboard: "M4 4h7v7H4V4Zm9 0h7v4h-7V4ZM4 13h7v7H4v-7Zm9-1h7v8h-7v-8Z",
  list: "M4 6h16M4 12h16M4 18h10",
  plus: "M12 5v14M5 12h14",
  clock: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  truck: "M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6ZM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
  box: "M3 8l9-4 9 4-9 4-9-4Zm0 0v8l9 4 9-4V8",
  check: "M4 12.5 9 17.5 20 6.5",
  shield: "M12 3l8 3v6c0 5-3.4 8-8 9-4.6-1-8-4-8-9V6l8-3Zm-3 9 2 2 4-4",
  alert: "M12 9v4m0 3h.01M10.3 4.3 2.6 17.6A2 2 0 0 0 4.3 20.6h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0Z",
  camera: "M4 8h3l2-2h6l2 2h3v11H4V8Zm8 8.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  pen: "M4 20h4L20 8l-4-4L4 16v4Z",
  chart: "M4 20V10m5 10V4m5 16v-7m5 7V8",
  database: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3Zm8 3v12c0 1.7-3.6 3-8 3s-8-1.3-8-3V6",
  users: "M16 19v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 17.5V19M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm10 8v-1.5a3.5 3.5 0 0 0-2.6-3.4M16 4.6a3.5 3.5 0 0 1 0 6.8",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5a8 8 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a8 8 0 0 0-2.1-1.2L15 3H9l-.5 2.7a8 8 0 0 0-2.1 1.2l-2.3-1-2 3.4 2 1.5A8 8 0 0 0 4 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1c.6.5 1.4.9 2.1 1.2L9 21h6l.5-2.7a8 8 0 0 0 2.1-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z",
  logout: "M15 4h4v16h-4M11 16l4-4-4-4M15 12H4",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6 6 18",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21",
  chevron: "M9 6l6 6-6 6",
  wifi: "M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01M2 9a15 15 0 0 1 20 0",
  lock: "M6 11h12v9H6v-9Zm3 0V7.5a3 3 0 0 1 6 0V11",
  print: "M7 9V4h10v5M7 18H5v-6h14v6h-2M7 15h10v5H7v-5Z",
  trash: "M4 7h16M9 7V5h6v2m-8 0 1 13h8l1-13",
};

export default function Icon({ name, className = "h-5 w-5" }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={P[name]} />
    </svg>
  );
}
