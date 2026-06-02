import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Sklep firmowy / Company Shop",
  description: "Wewnętrzny sklep sprzętu firmowego",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl">
      <body>
        <LanguageProvider>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </LanguageProvider>
      </body>
    </html>
  );
}
