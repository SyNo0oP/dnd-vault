"use client";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="border-b border-amber-900/50 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-black text-amber-500 tracking-tighter hover:scale-105 transition-transform uppercase"
        >
          ⚔️ D&D VAULT
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium hover:text-amber-400 transition-colors"
          >
            Accueil
          </Link>
          <Link
            href="/characters"
            className="text-sm font-medium hover:text-amber-400 transition-colors"
          >
            Mes Héros
          </Link>

          {/* NOUVEL ONGLET BESTIAIRE */}
          <Link
            href="/bestiary"
            className="text-sm font-medium hover:text-amber-400 transition-colors"
          >
            <span className="text-[10px]"></span> Bestiaire
          </Link>

          <Link
            href="/campaigns"
            className="text-sm font-medium hover:text-amber-400 transition-colors"
          >
            Mes Campagnes
          </Link>

          {session ? (
            <div className="flex items-center gap-3 bg-slate-800/80 py-1.5 px-3 rounded-full border border-amber-600/30 shadow-inner">
              {session.user?.image && (
                <img
                  src={session.user.image}
                  alt="Avatar"
                  className="w-7 h-7 rounded-full border border-amber-500/50 shadow-sm"
                />
              )}
              <span className="text-amber-200 font-bold text-xs uppercase tracking-widest hidden md:block">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut()}
                className="text-[10px] text-slate-500 hover:text-red-400 uppercase font-black ml-2 transition-colors"
              >
                Quitter
              </button>
            </div>
          ) : (
            <button
              onClick={() => signIn("discord")}
              className="bg-[#5865F2] hover:bg-[#4752C4] px-4 py-1.5 rounded-md text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              Discord Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
