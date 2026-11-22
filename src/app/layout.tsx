import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BabiCourse – Suivi des livreurs",
  description: "Suivez vos livreurs en direct sur la carte, jusqu'à la destination.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ea580c" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning : certaines extensions Chrome ajoutent des attributs à <html>/<body>
    // avant le chargement de la page, ce qui déclenchait une fausse erreur.
    <html lang="fr" className={`${geistSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col font-sans" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
