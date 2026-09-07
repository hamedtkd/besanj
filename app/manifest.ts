import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "بسنج",
    short_name: "بسنج",
    description:
      "بسنج؛ دفتر شخصی استعلام قیمت برای ثبت، مقایسه و تصمیم‌گیری بین چند فروشنده یا ارائه‌دهنده.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#f8fafc",
    theme_color: "#2563eb",
    lang: "fa",
    dir: "rtl",
    categories: ["shopping", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
