import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cuadre — Costeo de recetas e inventario",
    short_name: "Cuadre",
    description:
      "Costeo de recetas, control de inventario y registro de facturas para negocios de food service.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    lang: "es",
    background_color: "#F4ECDF",
    theme_color: "#17332A",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
