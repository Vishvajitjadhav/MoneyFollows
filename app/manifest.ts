import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MoneyFollows",
    short_name: "MoneyFollows",
    description: "Follow your money. Track expenses, income, investments and savings in seconds.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FAFAFA",
    theme_color: "#FAFAFA",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Add expense", short_name: "Add", url: "/?add=expense", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "History", url: "/history" },
      { name: "Analysis", url: "/analysis" },
    ],
  };
}
