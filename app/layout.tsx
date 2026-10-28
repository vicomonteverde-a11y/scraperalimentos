import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

export const metadata: Metadata = {
  title: "Scraper Alimentos · Deal Sourcing",
  description:
    "Originación por sucesión - PyMEs alimenticias en CABA, GBA y hasta 200 km de Pilar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-bg text-text antialiased">
        <div className="relative z-10">
          <Nav />
          <main className="mx-auto max-w-7xl px-6 pb-24 pt-8 md:px-10">
            {children}
          </main>
          <footer className="border-t border-border/50 py-8 text-center text-xs text-muted">
            <span className="font-serif italic">scraperalimentos</span>
            {" · "}
            <span className="tabular">CABA · GBA · 200 km de Pilar</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
