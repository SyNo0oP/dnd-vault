'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function CreateCharacter() {
  const [name, setName] = useState("");
  const [stats, setStats] = useState({
    Force: 10, Dextérité: 10, Constitution: 10,
    Intelligence: 10, Sagesse: 10, Charisme: 10
  });

  return (
    <main className="min-h-screen bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Bouton Retour */}
        <Link href="/" className="text-amber-500 hover:text-amber-400 mb-8 inline-block font-bold">
          ← Retour au Menu
        </Link>

        <div className="bg-slate-900 border-2 border-amber-900/50 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-black text-amber-500 uppercase tracking-widest mb-8 border-b border-amber-900/30 pb-4">
            Forger un nouveau Héros
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Colonne Gauche : Identité */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nom du Personnage</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-amber-200 focus:border-amber-500 outline-none"
                  placeholder="Ex: Valerius le Brave"
                />
              </div>
              <button className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-900/20">
                SAUVEGARDER LE HÉROS
              </button>
            </div>

            {/* Colonne Droite : Stats (Sur 2 colonnes) */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 flex flex-col items-center">
                  <span className="text-[10px] font-black text-amber-600 uppercase mb-2">{key}</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setStats({...stats, [key]: Math.max(0, value - 1)})}
                      className="w-8 h-8 rounded-full bg-slate-700 hover:bg-red-900 transition-colors"
                    >-</button>
                    <span className="text-2xl font-bold w-8 text-center">{value}</span>
                    <button 
                      onClick={() => setStats({...stats, [key]: Math.min(30, value + 1)})}
                      className="w-8 h-8 rounded-full bg-slate-700 hover:bg-green-900 transition-colors"
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}