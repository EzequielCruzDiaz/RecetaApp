import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/components/StoreProvider";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  applicationName: "RecetarioRD",
  title: "RecetarioRD — Costeo de recetas e inventario",
  description:
    "Costeo de recetas, control de inventario y registro de facturas para negocios de food service.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "RecetarioRD", statusBarStyle: "default" },
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
    <html lang="es" className={poppins.variable}>
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
