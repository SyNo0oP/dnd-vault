'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";

// Données de test (en attendant la BDD)
const INITIAL_HEROES = [
  { id: '1', name: 'Valerius', class: 'Guerrier', level: 5, hp: 45, stats: { Force: 18, Dextérité: 12, Constitution: 16, Intelligence: 8, Sagesse: 10, Charisme: 14 } },
  { id: '2', name: 'Lumina', class: 'Clerc', level: 3, hp: 28, stats: { Force: 10, Dextérité: 10, Constitution: 14, Intelligence: 12, Sagesse: 18, Charisme: 14 } },
];

export default function MyCharacters() {
  const { data: session } = useSession();
  const [heroes, setHeroes] = useState(INITIAL_HEROES);

  const deleteHero = (id: string) => {
    if(confirm("Es-tu sûr de vouloir bannir ce héros à jamais ?")) {
      setHeroes(heroes.filter(h => h.id !== id));
    }
  };

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
        <div className="text-center p-12 border-2 border-dashed border-slate-800 rounded-3xl">
          <h2 className="text-2xl font-bold text-slate-500 mb-4">Accès Restreint</h2>
          <p className="text-slate-600 mb-6">Connecte-toi avec Discord pour voir tes aventuriers.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-end mb-12 border-b border-amber-900/30 pb-6">
          <div>
            <h1 className="text-4xl font-black text-amber-500 uppercase tracking-tighter">Mes Héros</h1>
            <p className="text-slate-400 font-medium">Gestion de ta guilde personnelle</p>
          </div>
          <Link href="/characters/create">
            <button className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-900/20 uppercase text-sm tracking-widest">
              + Nouveau Héros
            </button>
          </Link>
        </header>

        {heroes.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800">
            <p className="text-slate-500 italic">Aucun héros n'a encore rejoint ta taverne...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroes.map((hero) => (
              <div key={hero.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-600/50 transition-all group relative overflow-hidden">
                {/* Badge Niveau */}
                <div className="absolute top-0 right-0 bg-amber-600 text-slate-950 font-black px-4 py-1 rounded-bl-xl text-xs">
                  LVL {hero.level}
                </div>

                <h3 className="text-2xl font-black text-amber-200 mb-1">{hero.name}</h3>
                <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mb-4">{hero.class}</p>
                
                {/* Mini Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {Object.entries(hero.stats).slice(0, 6).map(([stat, val]) => (
                    <div key={stat} className="bg-slate-800/50 p-2 rounded text-center border border-slate-700/50">
                      <p className="text-[8px] uppercase text-slate-500 font-bold leading-none mb-1">{stat.substring(0,3)}</p>
                      <p className="text-sm font-bold">{val}</p>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2 border-t border-slate-800 pt-4">
                  <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 rounded-lg transition-colors border border-slate-700">
                    Modifier
                  </button>
                  <button 
                    onClick={() => deleteHero(hero.id)}
                    className="px-3 bg-red-950/30 hover:bg-red-900 text-red-500 hover:text-white rounded-lg transition-all border border-red-900/30"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}