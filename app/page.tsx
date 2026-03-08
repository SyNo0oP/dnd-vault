'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-8">
      
      {/* 1. L'ANIMATION */}
      <style jsx global>{`
        @keyframes cocZoom {
          0% { transform: scale(2); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-map-coc {
          animation: cocZoom 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 2. LE FOND (Utilise l'image du dossier public) */}
      <div 
        className="absolute inset-0 animate-map-coc"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(2,6,23,0.5), rgba(2,6,23,0.8)), url('/map.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          zIndex: 0
        }}
      />

      {/* 3. LE CONTENU (Forcé au premier plan) */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tighter drop-shadow-2xl">
            VOTRE AVENTURE <span className="text-amber-500 italic block md:inline">START HERE</span>
          </h1>
          <p className="text-slate-200 text-xl max-w-lg mx-auto font-bold">
            L'outil ultime pour les Maîtres du Jeu et les joueurs passionnés.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* CARTE : CRÉER UN PERSO */}
          <div className="group relative p-8 bg-slate-900/40 backdrop-blur-xl border-2 border-white/10 rounded-3xl hover:border-amber-500 transition-all shadow-2xl">
            <div className="text-5xl mb-4">👤</div>
            <h2 className="text-2xl font-bold text-amber-500 mb-2 uppercase">Forger un Héros</h2>
            <p className="text-slate-200 text-sm mb-6">Créez une fiche complète en quelques minutes.</p>
            <Link href="/characters">
              <button className="w-full py-4 bg-amber-600 text-slate-950 rounded-xl font-black uppercase hover:bg-amber-500 transition-colors">
                COMMENCER LA CRÉATION
              </button>
            </Link>
          </div>

          {/* CARTE : CRÉER UNE PARTIE */}
          <div className="group relative p-8 bg-slate-900/40 backdrop-blur-xl border-2 border-white/10 rounded-3xl hover:border-amber-500 transition-all shadow-2xl">
            <div className="text-5xl mb-4">🏰</div>
            <h2 className="text-2xl font-bold text-amber-500 mb-2 uppercase">Lancer une Quête</h2>
            <p className="text-slate-200 text-sm mb-6">Gérez le combat et vos amis en temps réel.</p>
            <Link href="/campaigns/create">
              <button className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black uppercase tracking-[0.3em] rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(217,119,6,0.3)]">
                NOUVELLE PARTIE
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* VIGNETTE SOMBRES SUR LES BORDS */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,1)] z-[1]"></div>
    </main>
  );
}