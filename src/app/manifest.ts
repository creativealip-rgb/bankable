import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bankable Learning Platform",
    short_name: "Bankable",
    description: "Membership learning platform for digital assets and courses",
    start_url: "/",
    display: "standalone",
    background_color: "#f6fbff",
    theme_color: "#22d3ee",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "48x48",
        type: "image/x-icon",
      },
    ],
  };
}

