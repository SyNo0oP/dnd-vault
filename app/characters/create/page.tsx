'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";

export default function CreateCharacter() {
  const { data: session } = useSession();
  const [name, setName] = useState("");
  const [stats, setStats] = useState({
    Force: 10, Dextérité: 10, Constitution: 10,
    Intelligence: 10, Sagesse: 10, Charisme: 10
  });

  const handleSave = () => {
    if (!session) {
      alert("⚠️ Tu dois être connecté avec Discord pour sauvegarder ton héros !");
      return;
    }
    
    const characterData = {
      ownerEmail: session.user?.email,
      name: name || "Aventurier sans nom",
      stats: stats,
      level: 1,
      hp: 10 + Math.floor((stats.Constitution - 10) / 2)
    };

    console.log("Données prêtes pour la base de données :", characterData);
    alert(`Bravo ${session.user?.name} ! ${name} est prêt à être envoyé dans le grimoire (prochaine étape : la BDD).`);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="text-amber-500 hover:text-amber-400 mb-8 inline-block font-bold transition-transform hover:-translate-x-1">
          ← Retour au Menu
        </Link>

        <div className="bg-slate-900 border-2 border-amber-900/50 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Décoration en fond */}
          <div className="absolute top-0 right-0 p-4 text-6xl opacity-10 pointer-events-none">🐉</div>

          <h1 className="text-3xl font-black text-amber-500 uppercase tracking-widest mb-8 border-b border-amber-900/30 pb-4">
            Forger un nouveau Héros
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Colonne Gauche : Identité */}
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase mb-3 tracking-widest">Nom du Personnage</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-xl p-4 text-amber-100 focus:border-amber-500 focus:bg-slate-700 outline-none transition-all placeholder:text-slate-600 font-bold"
                  placeholder="Ex: Valerius le Brave"
                />
              </div>

              <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded-xl">
                <p className="text-xs text-amber-600 font-bold uppercase mb-1 text-center">Propriétaire</p>
                <p className="text-center font-mono text-sm text-slate-300">
                  {session ? session.user?.name : "Non connecté"}
                </p>
              </div>

              <button 
                onClick={handleSave}
                className="w-full py-5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl transition-all shadow-lg shadow-amber-900/30 active:scale-95 uppercase tracking-tighter"
              >
                💾 Sauvegarder dans le Grimoire
              </button>
            </div>

            {/* Colonne Droite : Stats */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(stats).map(([key, value]) => (
                <div key={key} className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 flex items-center justify-between hover:bg-slate-800 transition-colors group">
                  <div>
                    <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter block mb-1">{key}</span>
                    <span className="text-3xl font-black text-slate-100">{value}</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setStats({...stats, [key]: Math.max(0, value - 1)})}
                      className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-red-900 text-white font-bold transition-all flex items-center justify-center border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
                    >-</button>
                    <button 
                      onClick={() => setStats({...stats, [key]: Math.min(30, value + 1)})}
                      className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-green-900 text-white font-bold transition-all flex items-center justify-center border-b-4 border-slate-900 active:border-b-0 active:translate-y-1"
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