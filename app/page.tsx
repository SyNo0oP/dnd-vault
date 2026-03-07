'use client';
import { useState } from 'react';

export default function Home() {
  const [name, setName] = useState("Aventurier");
  const [hp, setHp] = useState(20);
  
  // On crée un objet pour stocker toutes nos stats d'un coup
  const [stats, setStats] = useState({
    Force: 10,
    Dextérité: 10,
    Constitution: 10,
    Intelligence: 10,
    Sagesse: 10,
    Charisme: 10
  });

  const rollD20 = (statName: string, value: number) => {
    const result = Math.floor(Math.random() * 20) + 1;
    const bonus = Math.floor((value - 10) / 2); // Calcul du modificateur D&D
    alert(`Jet de ${statName} : ${result} (Dé) + ${bonus} (Mod) = ${result + bonus}`);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-serif">
      <div className="max-w-4xl mx-auto border-2 border-amber-900 bg-slate-900 p-6 rounded-lg shadow-2xl">
        
        {/* EN-TÊTE RE-STYLYSÉ */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-amber-800 pb-6 gap-4">
          <input 
            type="text" 
            placeholder="Nom du héros..."
            onChange={(e) => setName(e.target.value)}
            className="bg-slate-800 text-2xl border-2 border-amber-900/50 rounded px-4 py-2 focus:border-amber-500 outline-none w-full md:w-auto italic text-amber-200"
          />
          <div className="flex items-center gap-4 bg-red-950/30 p-3 rounded-lg border border-red-900">
            <span className="font-bold text-red-500">PV: {hp}</span>
            <button onClick={() => setHp(hp - 1)} className="bg-red-900 px-2 rounded">-</button>
            <button onClick={() => setHp(hp + 1)} className="bg-green-900 px-2 rounded">+</button>
          </div>
        </header>

        {/* GRILLE DES STATISTIQUES */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(stats).map(([key, value]) => (
            <div key={key} className="bg-slate-800 p-4 rounded border border-slate-700 hover:border-amber-600 transition-all group">
              <label className="block text-amber-500 font-bold text-sm uppercase mb-2">{key}</label>
              <div className="flex items-center justify-between gap-2">
                <input 
                  type="number" 
                  value={value}
                  onChange={(e) => setStats({...stats, [key]: parseInt(e.target.value) || 0})}
                  className="w-16 bg-slate-900 border border-slate-600 rounded p-1 text-center text-xl font-bold"
                />
                <button 
                  onClick={() => rollD20(key, value)}
                  className="bg-amber-700 hover:bg-amber-600 text-xs p-2 rounded-full transform active:scale-90 transition-transform"
                  title="Lancer le dé"
                >
                  🎲
                </button>
              </div>
              <div className="text-[10px] text-slate-500 mt-2 italic text-center">
                Modificateur: {Math.floor((value - 10) / 2) >= 0 ? '+' : ''}{Math.floor((value - 10) / 2)}
              </div>
            </div>
          ))}
        </div>

        <footer className="mt-8 text-center text-slate-500 text-sm italic">
          Propulsé par la magie de Next.js pour {name}
        </footer>
      </div>
    </main>
  );
}