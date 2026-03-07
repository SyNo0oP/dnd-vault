'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function CreateCharacter() {
  const { data: session } = useSession();
  const router = useRouter();

  // Dictionnaire des Dés de Vie par classe
  const classHitDice: { [key: string]: number } = {
    "Barbare": 12,
    "Guerrier": 10,
    "Paladin": 10,
    "Ranger": 10,
    "Clerc": 8,
    "Voleur": 8,
    "Moine": 8,
    "Barde": 8,
    "Druide": 8,
    "Sorcier": 8,
    "Magicien": 6,
    "Ensorceleur": 6
  };

  const [char, setChar] = useState({
    name: '',
    race: 'Humain',
    class: 'Guerrier',
    level: 1,
    alignment: 'Neutre Strict',
    stats: { force: 10, dexterite: 10, constitution: 10, intelligence: 10, sagesse: 10, charisme: 10 },
    hpMax: 10,
    speed: 30,
    personality: '',
    ideals: '',
    bonds: '',
    flaws: '',
    features: '',
    equipment: ''
  });

  // Logique de calcul
  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (score: number) => {
    const mod = getMod(score);
    return mod >= 0 ? `+${mod}` : mod;
  };

  // Mise à jour automatique des PV quand la classe ou la Constitution change
  useEffect(() => {
    const baseHD = classHitDice[char.class] || 8;
    const conMod = getMod(char.stats.constitution);
    // Formule : (Dé de Vie max au niv 1) + Modificateur de Constitution
    setChar(prev => ({ ...prev, hpMax: baseHD + conMod }));
  }, [char.class, char.stats.constitution]);

  const masteryBonus = 2; 
  const armorClass = 10 + getMod(char.stats.dexterite);

  const alignments = ["Loyal Bon", "Neutre Bon", "Chaotique Bon", "Loyal Neutre", "Neutre Strict", "Chaotique Neutre", "Loyal Mauvais", "Neutre Mauvais", "Chaotique Mauvais"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/characters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...char, userId: session?.user?.email }),
      });
      if (response.ok) router.push('/characters');
    } catch (error) {
      alert("Erreur lors de la sauvegarde.");
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER : IDENTITÉ AVEC CLASSE ET ALIGNEMENT */}
        <div className="bg-slate-900 p-6 rounded-2xl border-b-4 border-amber-600 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <label className="text-[10px] uppercase font-black text-amber-500 tracking-widest">Nom</label>
            <input 
              type="text" className="w-full bg-transparent text-2xl font-black border-b border-slate-700 outline-none focus:border-amber-500"
              onChange={(e) => setChar({...char, name: e.target.value})}
              required
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">Classe</label>
            <select 
              className="w-full bg-slate-800 border-none rounded p-2 text-sm mt-1 outline-none text-amber-400 font-bold"
              value={char.class}
              onChange={(e) => setChar({...char, class: e.target.value})}
            >
              {Object.keys(classHitDice).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">Race</label>
            <input 
              type="text" className="w-full bg-transparent border-b border-slate-700 py-1 outline-none focus:border-amber-500"
              value={char.race}
              onChange={(e) => setChar({...char, race: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest block">Alignement</label>
            <select 
              className="w-full bg-slate-800 border-none rounded p-2 text-sm mt-1 outline-none"
              onChange={(e) => setChar({...char, alignment: e.target.value})}
            >
              {alignments.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* STATS & MODS */}
          <div className="lg:col-span-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(char.stats).map(([stat, val]) => (
                <div key={stat} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center relative group">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">{stat}</label>
                  <div className="text-3xl font-black text-amber-500">{formatMod(val)}</div>
                  <input 
                    type="number" value={val}
                    className="w-12 bg-slate-800 text-center rounded-full text-xs font-bold py-1 mt-2 border border-slate-700"
                    onChange={(e) => setChar({
                      ...char, stats: {...char.stats, [stat]: parseInt(e.target.value) || 0}
                    })}
                  />
                </div>
              ))}
            </div>
            <div className="bg-slate-900 border border-amber-900/50 p-4 rounded-xl flex items-center justify-between">
              <span className="text-xs font-black uppercase">Bonus de Maîtrise</span>
              <span className="text-xl font-black text-amber-500">+{masteryBonus}</span>
            </div>
          </div>

          {/* COMBAT & PV */}
          <div className="lg:col-span-4 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-900 border-2 border-slate-800 p-4 rounded-2xl text-center">
                <label className="text-[8px] uppercase font-black text-slate-500">CA</label>
                <div className="text-2xl font-black">{armorClass}</div>
              </div>
              <div className="bg-slate-900 border-2 border-slate-800 p-4 rounded-2xl text-center">
                <label className="text-[8px] uppercase font-black text-slate-500">Initiative</label>
                <div className="text-2xl font-black">{formatMod(char.stats.dexterite)}</div>
              </div>
              <div className="bg-slate-900 border-2 border-slate-800 p-4 rounded-2xl text-center">
                <label className="text-[8px] uppercase font-black text-slate-500">Vitesse</label>
                <input 
                   type="number" className="bg-transparent w-full text-center text-xl font-black outline-none" 
                   value={char.speed} onChange={(e) => setChar({...char, speed: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            {/* SECTION PV AUTOMATISÉE */}
            <div className="bg-slate-900 border-2 border-red-900/40 p-6 rounded-3xl relative">
              <label className="text-[10px] uppercase font-black text-red-500 tracking-widest absolute -top-3 left-6 bg-slate-950 px-2">Points de Vie</label>
              <div className="flex items-center justify-between">
                <div className="text-4xl font-black text-white">{char.hpMax}</div>
                <div className="text-right">
                  <div className="text-slate-500 text-[10px] font-black uppercase">Maximum</div>
                  <div className="text-[9px] text-amber-600 font-bold italic">Base {char.class} ({classHitDice[char.class]}) + CON ({getMod(char.stats.constitution)})</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
               <h4 className="text-[10px] font-black uppercase text-amber-500 mb-3 tracking-widest">Capacités & Traits</h4>
               <textarea 
                className="w-full bg-slate-800/50 border border-slate-700 rounded-lg p-3 text-sm h-32 outline-none focus:border-amber-500"
                placeholder="Ex: Vision dans le noir, Second souffle..."
                onChange={(e) => setChar({...char, features: e.target.value})}
               ></textarea>
            </div>
          </div>

          {/* RP & INVENTAIRE */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3 font-serif italic">
              <input type="text" placeholder="Traits de personnalité" className="w-full bg-slate-800 border-none rounded p-2 text-xs" onChange={(e) => setChar({...char, personality: e.target.value})}/>
              <input type="text" placeholder="Idéaux" className="w-full bg-slate-800 border-none rounded p-2 text-xs" onChange={(e) => setChar({...char, ideals: e.target.value})}/>
              <input type="text" placeholder="Liens" className="w-full bg-slate-800 border-none rounded p-2 text-xs" onChange={(e) => setChar({...char, bonds: e.target.value})}/>
              <input type="text" placeholder="Défauts" className="w-full bg-slate-800 border-none rounded p-2 text-xs" onChange={(e) => setChar({...char, flaws: e.target.value})}/>
            </div>
            
            <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-xl">
               <h4 className="text-[10px] font-black uppercase text-amber-700 mb-3">Inventaire</h4>
               <textarea 
                className="w-full bg-transparent border border-amber-900/20 rounded p-2 text-xs h-24 outline-none"
                placeholder="Votre équipement..."
                onChange={(e) => setChar({...char, equipment: e.target.value})}
               ></textarea>
            </div>
          </div>
        </div>

        <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest">
          Inscrire dans la légende
        </button>
      </form>
    </main>
  );
}