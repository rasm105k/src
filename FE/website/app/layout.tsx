import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Landing page",
  description: "Mød ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav className="nav">
          <div className="nav-logo">Landing page</div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#contact" className="nav-cta">Get Started</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
