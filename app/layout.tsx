import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
  variable: "--font-display",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  applicationName: "Cuadre",
  title: "Cuadre — Costeo de recetas e inventario",
  description:
    "Costeo de recetas, control de inventario y registro de facturas para negocios de food service.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Cuadre", statusBarStyle: "default" },
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#17332A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${fraunces.variable} ${manrope.variable}`}>
      <body>
        <AuthGate>
          <StoreProvider>
            <AppShell>{children}</AppShell>
          </StoreProvider>
        </AuthGate>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
