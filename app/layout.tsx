import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import Shell from "@/components/Shell";

export const metadata: Metadata = {
  title: "Aston Cirebon · Guest Laundry",
  description:
    "Sistem pelacakan laundry tamu Hotel Aston Cirebon — bukti foto, hitung ganda, serah terima vendor, dan verifikasi HK Leader.",
  applicationName: "Aston Cirebon Laundry",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#001C5A",
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
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap"
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
