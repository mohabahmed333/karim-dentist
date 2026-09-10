import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "The Dental Lounge | Dr. Karim Elshibiny",
    short_name: "Dental Lounge",
    description:
      "Modern laser and cosmetic dentistry with comfort-first care in New Cairo.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f2744",
    icons: [
      {
        src: "/icon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
