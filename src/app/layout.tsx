import type { Metadata } from "next";
import "./globals.css";
import { MainNav } from "./main-nav";

export const metadata: Metadata = {
  title: "Bankable | Sekali Bayar Akses Semua",
  description: "Dengan Rp29.000 saat daftar, dapatkan akses penuh ke 100 ebook, 100 video course, dan 100 voice SFX.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MainNav />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
