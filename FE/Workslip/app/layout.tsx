import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workslip - Digitale arbejdssedler",
  description: "Mobil PWA-demo til compliance-gated arbejdssedler for VVS-firmaer.",
  applicationName: "Workslip",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Workslip",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#111827"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body>{children}</body>
    </html>
  );
}
