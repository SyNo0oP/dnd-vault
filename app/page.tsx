'use client';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-[calc(100-64px)] flex flex-col items-center justify-center p-8 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]">
      <div className="text-center mb-16">
        <h1 className="text-6xl font-black text-slate-100 mb-4 tracking-tighter">
          VOTRE AVENTURE <span className="text-amber-500 italic text-7xl">START HERE</span>
        </h1>
        <p className="text-slate-400 text-xl max-w-lg mx-auto">
          L'outil ultime pour les Maîtres du Jeu et les joueurs passionnés.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* CARTE : CRÉER UN PERSO */}
        <div className="group relative p-8 bg-slate-900 border-2 border-slate-800 rounded-2xl hover:border-amber-500 transition-all cursor-pointer">
          <div className="text-4xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-amber-500 mb-2">Forger un Héros</h2>
          <p className="text-slate-400 text-sm mb-6">Utilisez notre éditeur guidé pour créer une fiche complète en quelques minutes.</p>
          <button className="w-full py-3 bg-amber-600 rounded-xl font-bold group-hover:bg-amber-500 transition-colors">
            Commencer la création
          </button>
        </div>

        {/* CARTE : CRÉER UNE PARTIE */}
        <div className="group relative p-8 bg-slate-900 border-2 border-slate-800 rounded-2xl hover:border-amber-500 transition-all cursor-pointer">
          <div className="text-4xl mb-4">🏰</div>
          <h2 className="text-2xl font-bold text-amber-500 mb-2">Lancer une Quête</h2>
          <p className="text-slate-400 text-sm mb-6">Créez une table de jeu, invitez vos amis et gérez le combat en temps réel.</p>
          <button className="w-full py-3 border-2 border-amber-600 text-amber-500 rounded-xl font-bold group-hover:bg-amber-600 group-hover:text-white transition-all">
            Nouvelle Partie
          </button>
        </div>
      </div>
    </main>
  );
}