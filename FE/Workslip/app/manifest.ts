import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Workslip",
    short_name: "Workslip",
    description: "Digitale arbejdssedler for VVS-firmaer.",
    start_url: "/",
    display: "standalone",
    background_color: "#eef1f5",
    theme_color: "#111827",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      }
    ]
  };
}
