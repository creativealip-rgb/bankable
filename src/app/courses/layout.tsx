import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Katalog Kursus Digital | BELAJARIA",
  description: "Eksplorasi 300+ aset digital: video course, ebook, dan audio asset. Filter berdasarkan kategori Bisnis, Programming, Design, dan lainnya.",
  openGraph: {
    title: "Katalog Kursus Digital | BELAJARIA",
    description: "Akses 300+ aset digital terbaik hanya dengan Rp29.000.",
    type: "website",
  },
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
