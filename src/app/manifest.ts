import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BELAJARIA - Platform Belajar Digital",
    short_name: "BELAJARIA",
    description: "Akses 100+ Ebook, Video Course, dan Asset Digital dengan sekali bayar.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Katalog Kursus",
        url: "/courses",
        icons: [{ src: "/favicon.ico", sizes: "any" }]
      },
      {
        name: "Kursus Saya",
        url: "/my-courses",
        icons: [{ src: "/favicon.ico", sizes: "any" }]
      }
    ]
  };
}

