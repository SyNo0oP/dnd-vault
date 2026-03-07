import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "D&D Vault - Ton Grimoire Numérique",
  description: "Gère tes personnages et tes parties de JDR",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        {/* BARRE DE NAVIGATION */}
        <nav className="border-b border-amber-900/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="text-xl font-bold text-amber-500 tracking-tighter cursor-pointer">
              ⚔️ D&D VAULT
            </div>
            
            <div className="flex items-center gap-6">
              <a href="/" className="text-sm hover:text-amber-400 transition-colors">Accueil</a>
              <a href="/characters" className="text-sm hover:text-amber-400 transition-colors">Mes Héros</a>
              
              {/* BOUTON DISCORD (Simulation pour l'instant) */}
              <button className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] px-4 py-1.5 rounded-md text-sm font-bold transition-all">
                <span>Se connecter avec Discord</span>
              </button>
            </div>
          </div>
        </nav>

        {children}
      </body>
    </html>
  );
}