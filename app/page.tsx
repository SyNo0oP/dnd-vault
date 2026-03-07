'use client'; // Obligatoire pour rendre la page interactive (boutons, formulaires)
import { useState } from 'react';

export default function Home() {
  // --- NOS VARIABLES MAGIQUES (Le State) ---
  const [name, setName] = useState("Aventurier Anonyme");
  const [hp, setHp] = useState(20);
  const [level, setLevel] = useState(1);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 font-serif">
      <div className="max-w-2xl mx-auto border-2 border-amber-900 bg-slate-900 p-8 rounded-lg shadow-2xl">
        
        {/* TITRE & NOM */}
        <header className="text-center mb-10 border-b border-amber-800 pb-6">
          <h1 className="text-4xl font-bold text-amber-500 uppercase tracking-widest mb-4">
            Feuille de Personnage
          </h1>
          <input 
            type="text" 
            placeholder="Nom du héros..."
            onChange={(e) => setName(e.target.value)}
            className="bg-transparent text-2xl text-center border-b border-slate-700 focus:border-amber-500 outline-none w-full italic text-amber-200"
          />
        </header>

        {/* INFOS RAPIDES (HP & NIVEAU) */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          
          {/* SECTION POINTS DE VIE */}
          <div className="flex flex-col items-center p-4 bg-slate-800 rounded-md border border-red-900">
            <span className="text-red-500 font-bold uppercase text-xs mb-2 text-center">Points de Vie</span>
            <div className="text-4xl font-bold mb-4">{hp}</div>
            <div className="flex gap-2">
              <button 
                onClick={() => setHp(hp - 1)}
                className="px-3 py-1 bg-red-900 hover:bg-red-700 rounded transition-colors"
              >
                -1
              </button>
              <button 
                onClick={() => setHp(hp + 1)}
                className="px-3 py-1 bg-green-900 hover:bg-green-700 rounded transition-colors"
              >
                +1
              </button>
            </div>
          </div>

          {/* SECTION NIVEAU */}
          <div className="flex flex-col items-center p-4 bg-slate-800 rounded-md border border-amber-900">
            <span className="text-amber-500 font-bold uppercase text-xs mb-2 text-center">Niveau</span>
            <div className="text-4xl font-bold mb-4">{level}</div>
            <button 
              onClick={() => setLevel(level + 1)}
              className="px-6 py-1 bg-amber-700 hover:bg-amber-600 rounded font-bold transition-all uppercase text-xs"
            >
              Level Up !
            </button>
          </div>

        </div>

        {/* RÉSUMÉ */}
        <footer className="mt-8 pt-6 border-t border-slate-800 text-center text-slate-400">
          <p>L'illustre <span className="text-amber-400 font-bold">{name}</span> est prêt pour l'aventure.</p>
        </footer>
      </div>
    </main>
  );
}