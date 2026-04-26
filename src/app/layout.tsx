import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "./main-nav";
import { Footer } from "./footer";
import { BottomNav } from "./bottom-nav";
import { ToastProvider } from "./toast-provider";

export const metadata: Metadata = {
  title: "BELAJARIA | Sekali Bayar Akses Semua",
  description: "Dengan Rp29.000 saat daftar, dapatkan akses penuh ke 100 ebook, 100 video course, dan 100 voice SFX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ToastProvider>
          <MainNav />
          <main>
            {children}
          </main>
          <Footer />
          <BottomNav />
        </ToastProvider>
      </body>
    </html>
  );
}
