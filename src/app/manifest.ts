import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Faiza Zone — Fashion, Footwear & Accessories",
    short_name: "Faiza Zone",
    description: "Trending kurti, panjabi, hoodies, sneakers and accessories online store.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e11d48",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
