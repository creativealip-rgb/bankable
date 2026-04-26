import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BELAJARIA Learning Platform",
    short_name: "BELAJARIA",
    description: "Membership learning platform for digital assets and courses",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f3ff",
    theme_color: "#4F46E5",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}

