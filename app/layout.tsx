import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "VERITAS · Laundry Aston Cirebon",
  description:
    "Sistem pelacakan laundry tamu Hotel Aston Cirebon — bukti foto, tanda tangan, serah terima vendor, dan verifikasi HK Leader.",
  applicationName: "VERITAS Laundry",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#24408F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="font-sans antialiased">
        <AuthProvider>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}
