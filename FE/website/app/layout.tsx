import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Workslip demo",
  description: "Digital 4V05 arbejdsseddel-demo for VVS-firmaer.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body>
        <nav className="nav">
          <div className="nav-logo">Workslip</div>
          <div className="nav-links">
            <a href="#demo" className="nav-link">Demo</a>
            <a href="#features" className="nav-link">Features</a>
            <a href="#contact" className="nav-cta">Kontakt</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
