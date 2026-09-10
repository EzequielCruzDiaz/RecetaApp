import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  applicationName: "RecetApp",
  title: "RecetApp — Costeo de recetas e inventario",
  description:
    "Costeo de recetas, control de inventario y registro de facturas para negocios de food service.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "RecetApp", statusBarStyle: "default" },
  // iOS < 16.4 solo reconoce el meta con prefijo apple-.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#1E2A1F",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={inter.variable}>
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
