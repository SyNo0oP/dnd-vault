'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from "next-auth/react";
import Link from 'next/link';

function CreateCharacterForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  // --- DONNÉES DE RÈGLES (TES DONNÉES EXACTES) ---
  const raceData: { [key: string]: { stats: { [key: string]: number }, speed: number, languages: string[] } } = {
    "Humain": { stats: { force: 1, dexterite: 1, constitution: 1, intelligence: 1, sagesse: 1, charisme: 1 }, speed: 9, languages: ["Commun", "Une langue au choix"] },
    "Elfe": { stats: { dexterite: 2 }, speed: 9, languages: ["Commun", "Elfique"] },
    "Nain": { stats: { constitution: 2 }, speed: 7.5, languages: ["Commun", "Nain"] },
    "Halfelin": { stats: { dexterite: 2 }, speed: 7.5, languages: ["Commun", "Halfelin"] },
    "Demi-Orc": { stats: { force: 2, constitution: 1 }, speed: 9, languages: ["Commun", "Orc"] },
    "Drakéide": { stats: { force: 2, charisme: 1 }, speed: 9, languages: ["Commun", "Draconique"] },
    "Gnome": { stats: { intelligence: 2 }, speed: 7.5, languages: ["Commun", "Gnome"] },
    "Tieffelin": { stats: { intelligence: 1, charisme: 2 }, speed: 9, languages: ["Commun", "Infernal"] }
  };

  const classData: { [key: string]: { hd: number, skills: number, options: string[], equipment: string } } = {
    "Barbare": { hd: 12, skills: 2, options: ["Athlétisme", "Dressage", "Intimidation", "Nature", "Perception", "Survie"], equipment: "Hache à deux mains, 2 hachettes, Pack d'explorateur, 4 javelots" },
    "Guerrier": { hd: 10, skills: 2, options: ["Acrobaties", "Athlétisme", "Dressage", "Histoire", "Intimidation", "Intuition", "Perception", "Survie"], equipment: "Cotte de mailles, Épée longue, Bouclier, Arc long (20 flèches), Pack d'explorateur" },
    "Paladin": { hd: 10, skills: 2, options: ["Athlétisme", "Intimidation", "Intuition", "Médecine", "Persuasion", "Religion"], equipment: "Épée longue, Bouclier, 5 javelots, Pack d'ecclésiastique, Symbole sacré" },
    "Ranger": { hd: 10, skills: 3, options: ["Athlétisme", "Discrétion", "Dressage", "Investigation", "Nature", "Perception", "Perspicacité", "Survie"], equipment: "Armure d'écailles, 2 épées courtes, Arc long (20 flèches), Pack d'explorateur" },
    "Clerc": { hd: 8, skills: 2, options: ["Histoire", "Intuition", "Médecine", "Persuasion", "Religion"], equipment: "Masse, Cuirasse, Bouclier, Arbalète légère, Pack d'ecclésiastique, Symbole sacré" },
    "Voleur": { hd: 8, skills: 4, options: ["Acrobaties", "Athlétisme", "Discrétion", "Escamotage", "Intimidation", "Intuition", "Investigation", "Perception", "Perspicacité", "Persuasion", "Représentation"], equipment: "Rapière, Arc court (20 flèches), Pack de cambrioleur, Armure de cuir, 2 dagues, Outils de voleur" },
    "Magicien": { hd: 6, skills: 2, options: ["Arcanes", "Histoire", "Intuition", "Investigation", "Médecine", "Religion"], equipment: "Bâton, Sacoche à composantes, Grimoire, Pack d'érudit, Dague" }
  };

  const backgrounds: { [key: string]: string[] } = {
    "Soldat": ["Athlétisme", "Intimidation"], "Criminel": ["Discrétion", "Escamotage"],
    "Noble": ["Histoire", "Persuasion"], "Sage": ["Arcanes", "Histoire"],
    "Héros du Peuple": ["Dressage", "Survie"], "Sauvageon": ["Athlétisme", "Survie"]
  };

  const allSkills = [
    { name: "Acrobaties", stat: "dexterite" }, { name: "Arcanes", stat: "intelligence" },
    { name: "Athlétisme", stat: "force" }, { name: "Discrétion", stat: "dexterite" },
    { name: "Dressage", stat: "sagesse" }, { name: "Escamotage", stat: "dexterite" },
    { name: "Histoire", stat: "intelligence" }, { name: "Intimidation", stat: "charisme" },
    { name: "Intuition", stat: "sagesse" }, { name: "Investigation", stat: "intelligence" },
    { name: "Médecine", stat: "sagesse" }, { name: "Nature", stat: "intelligence" },
    { name: "Perception", stat: "sagesse" }, { name: "Perspicacité", stat: "sagesse" },
    { name: "Persuasion", stat: "charisme" }, { name: "Religion", stat: "intelligence" },
    { name: "Représentation", stat: "charisme" }, { name: "Survie", stat: "sagesse" }
  ];

  const [char, setChar] = useState({
    name: '', race: 'Humain', class: 'Guerrier', level: 1, background: 'Soldat', alignment: 'Neutre Strict',
    stats: { force: 8, dexterite: 8, constitution: 8, intelligence: 8, sagesse: 8, charisme: 8 },
    classProficiencies: [] as string[],
    hpMax: 10, speed: 9, personality: '', ideals: '', bonds: '', flaws: '', 
    features: '', equipment: '', tools: '', languages: ''
  });

  useEffect(() => {
    if (editId && session?.user?.email) {
      fetch(`/api/characters?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          const toEdit = Array.isArray(data) ? data.find((c: any) => c._id === editId) : null;
          if (toEdit) setChar(toEdit);
        })
        .catch(err => console.error(err));
    }
  }, [editId, session]);

  const getRaceBonus = (statName: string) => raceData[char.race]?.stats[statName] || 0;
  const getTotalStat = (statName: string) => (char.stats as any)[statName] + getRaceBonus(statName);
  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const formatMod = (score: number) => {
    const mod = getMod(score);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };
  const masteryBonus = Math.ceil(1 + char.level / 4);
  const getPointCost = (val: number) => {
    if (val <= 13) return val - 8;
    if (val === 14) return 7;
    if (val === 15) return 9;
    return 0;
  };
  const pointsRemaining = 27 - Object.values(char.stats).reduce((acc, val) => acc + getPointCost(val), 0);
  const backgroundSkills = backgrounds[char.background] || [];
  const totalProficiencies = [...new Set([...backgroundSkills, ...char.classProficiencies])];
  const maxClassSkills = classData[char.class]?.skills || 2;
  const passivePerception = 10 + (totalProficiencies.includes("Perception") ? masteryBonus : 0) + getMod(getTotalStat("sagesse"));

  useEffect(() => {
    const baseHD = classData[char.class]?.hd || 8;
    const conMod = getMod(getTotalStat("constitution"));
    const avgHitDie = (baseHD / 2) + 1;
    const totalHP = baseHD + conMod + Math.max(0, (avgHitDie + conMod) * (char.level - 1));
    setChar(prev => ({ 
      ...prev, 
      hpMax: totalHP, 
      speed: raceData[char.race]?.speed || 9,
      languages: prev.languages || raceData[char.race]?.languages.join(", ")
    }));
  }, [char.class, char.stats.constitution, char.race, char.level]);

  const updateStat = (stat: string, newVal: number) => {
    if (newVal < 8 || newVal > 15) return;
    setChar(prev => ({ ...prev, stats: { ...prev.stats, [stat]: newVal } }));
  };
  const toggleClassSkill = (skillName: string) => {
    if (backgroundSkills.includes(skillName)) return;
    setChar(prev => {
      const isSelected = prev.classProficiencies.includes(skillName);
      if (!isSelected && prev.classProficiencies.length >= maxClassSkills) return prev;
      return { ...prev, classProficiencies: isSelected ? prev.classProficiencies.filter(s => s !== skillName) : [...prev.classProficiencies, skillName] };
    });
  };
  const generateStartingEquipment = () => setChar(prev => ({ ...prev, equipment: classData[char.class].equipment }));

  const handleSubmit = async () => {
    if (!session?.user?.email) return alert("Connecte-toi !");
    const method = editId ? 'PUT' : 'POST';
    const url = editId ? `/api/characters?id=${editId}` : '/api/characters';
    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...char, userId: session.user.email, updatedAt: new Date() }),
      });
      if (response.ok) router.push('/characters');
    } catch (error) { console.error(error); }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-200 p-4 md:p-8 flex items-center justify-center">
      
      {/* 1. ANIMATION CSS IMMERSIVE */}
      <style jsx global>{`
        @keyframes cocZoom {
          0% { transform: scale(2.5) translateY(-10%); filter: blur(12px); opacity: 0; }
          100% { transform: scale(1) translateY(0); filter: blur(0); opacity: 1; }
        }
        .animate-create-coc {
          animation: cocZoom 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 2. LE FOND : TON IMAGE DE CRÉATION */}
      <div 
        className="absolute inset-0 z-0 animate-create-coc"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(2,6,23,0.6), rgba(2,6,23,0.9)), url('/map3.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 3. LE CONTENU (Z-10) */}
      <div className="relative z-10 max-w-[1400px] w-full mx-auto space-y-6">
        {/* Header Translucide */}
        <div className="bg-slate-900/80 backdrop-blur-md p-6 rounded-2xl border-b-4 border-amber-600 shadow-2xl grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="md:col-span-1">
            <label className="text-[10px] uppercase font-black text-amber-500 block mb-1">Nom du Héros</label>
            <input type="text" className="w-full bg-transparent text-xl font-black border-b border-slate-700 outline-none focus:border-amber-500 placeholder:text-slate-800 text-white" placeholder="Nom..." value={char.name || ''} onChange={(e) => setChar({...char, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-3 gap-2 md:col-span-2">
            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Niveau</label>
              <input type="number" min="1" max="20" className="w-full bg-slate-800 rounded p-2 text-xs font-bold outline-none text-white" value={char.level} onChange={(e) => setChar({...char, level: parseInt(e.target.value) || 1})} />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Race</label>
              <select className="w-full bg-slate-800 rounded p-2 text-xs outline-none text-white" value={char.race} onChange={(e) => setChar({...char, race: e.target.value})}>
                {Object.keys(raceData).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-slate-500 block mb-1">Classe</label>
              <select className="w-full bg-slate-800 rounded p-2 text-xs text-amber-400 font-bold outline-none" value={char.class} onChange={(e) => setChar({...char, class: e.target.value, classProficiencies: []})}>
                {Object.keys(classData).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center justify-around bg-slate-950/50 rounded-xl p-2 border border-slate-800 md:col-span-2">
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">PV Max</p>
                <p className="text-xl font-black text-red-500">{char.hpMax}</p>
                <p className="text-[9px] text-slate-600 font-bold uppercase">{char.level}d{classData[char.class].hd}</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Maîtrise</p>
                <p className="text-xl font-black text-blue-400">+{masteryBonus}</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">CA</p>
                <p className="text-xl font-black text-amber-500">{10 + getMod(getTotalStat("dexterite"))}</p>
             </div>
             <div className="text-center">
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Vitesse</p>
                <p className="text-xl font-black text-white">{char.speed}m</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* STATS */}
          <div className="bg-slate-900/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-3 shadow-xl hover:border-amber-600/30 transition-colors">
            <h3 className="text-[10px] font-black uppercase text-amber-500 tracking-widest text-center mb-4 italic">Attributs (Budget 27)</h3>
            <p className={`text-center text-xl font-black mb-4 ${pointsRemaining < 0 ? 'text-red-500' : 'text-white'}`}>{pointsRemaining} <span className="text-xs text-slate-500 uppercase">Pts</span></p>
            {Object.entries(char.stats).map(([stat, val]) => (
              <div key={stat} className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[9px] uppercase font-black text-slate-400">{stat}</span>
                  <span className="text-[9px] text-amber-600 font-bold italic">+{getRaceBonus(stat)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateStat(stat, val - 1)} className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center hover:bg-red-600 transition-colors text-white">-</button>
                    <span className="text-md font-black w-5 text-center text-white">{val}</span>
                    <button type="button" onClick={() => updateStat(stat, val + 1)} className="w-6 h-6 bg-slate-800 rounded flex items-center justify-center hover:bg-green-600 transition-colors text-white">+</button>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-black text-white leading-none block">{getTotalStat(stat)}</span>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">{formatMod(getTotalStat(stat))}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* COMPÉTENCES */}
          <div className="bg-slate-900/60 backdrop-blur-md p-5 rounded-2xl border border-slate-800 space-y-4 shadow-xl">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                <p className="text-[8px] uppercase font-black text-slate-500 tracking-widest">Sagesse Passive</p>
                <p className="text-2xl font-black text-amber-500">{passivePerception}</p>
            </div>
            <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1 custom-scrollbar">
              {allSkills.map(s => {
                const isOption = classData[char.class].options.includes(s.name);
                const isBG = backgroundSkills.includes(s.name);
                const isChecked = totalProficiencies.includes(s.name);
                const bonus = (isChecked ? masteryBonus : 0) + getMod(getTotalStat(s.stat));
                return (
                  <div key={s.name} className={`flex items-center gap-2 p-1.5 rounded border transition-all ${isBG ? 'border-amber-600/30 bg-amber-600/5' : isOption ? 'border-slate-800 bg-slate-950/40' : 'border-transparent opacity-20'}`}>
                    <input type="checkbox" checked={isChecked} disabled={isBG || !isOption} onChange={() => toggleClassSkill(s.name)} className="w-3 h-3 accent-amber-500" />
                    <span className={`text-[10px] font-black w-6 ${isChecked ? 'text-amber-500' : 'text-slate-600'}`}>{bonus >= 0 ? `+${bonus}` : bonus}</span>
                    <span className="text-[10px] flex-1 truncate uppercase font-medium">{s.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DIVERS */}
          <div className="space-y-4">
            <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-800 space-y-3 shadow-lg">
                <div>
                  <label className="text-[9px] font-black uppercase text-amber-500 mb-1 block">Outils</label>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[11px] h-14 outline-none text-slate-400 resize-none focus:border-amber-600" value={char.tools || ''} onChange={(e) => setChar({...char, tools: e.target.value})} placeholder="Dés, Luth..."></textarea>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-amber-500 mb-1 block">Langues</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[11px] outline-none text-slate-400 focus:border-amber-600" value={char.languages || ''} onChange={(e) => setChar({...char, languages: e.target.value})} />
                </div>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-lg">
               <label className="text-[9px] font-black uppercase text-amber-500 mb-1 block tracking-widest">Capacités</label>
               <textarea className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[11px] h-48 outline-none text-slate-300 resize-none focus:border-amber-600" value={char.features || ''} onChange={(e) => setChar({...char, features: e.target.value})} placeholder="Vos traits..."></textarea>
            </div>
          </div>

          {/* INVENTAIRE */}
          <div className="space-y-4">
             <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex justify-between items-center mb-2">
                    <label className="text-[9px] font-black uppercase text-amber-500">Équipement</label>
                    <button type="button" onClick={generateStartingEquipment} className="text-[8px] bg-amber-600/10 text-amber-500 px-2 py-1 rounded hover:bg-amber-600 hover:text-slate-950 transition-all uppercase font-black">Pack de départ</button>
                </div>
                <textarea className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[11px] h-32 italic text-amber-200/60 outline-none resize-none focus:border-amber-600" value={char.equipment || ''} onChange={(e) => setChar({...char, equipment: e.target.value})}></textarea>
             </div>
             <div className="bg-slate-900/60 backdrop-blur-md p-4 rounded-xl border border-slate-800 space-y-3 shadow-lg">
                {['personality', 'ideals', 'bonds', 'flaws'].map(f => (
                  <div key={f}>
                    <label className="text-[8px] uppercase font-bold text-amber-700/60 block mb-1">{f}</label>
                    <textarea className="w-full bg-slate-800/20 border-b border-slate-700 text-[11px] h-12 resize-none outline-none p-1 focus:border-amber-500 text-slate-300" value={(char as any)[f] || ''} onChange={(e) => setChar({...char, [f]: e.target.value})}></textarea>
                  </div>
                ))}
             </div>
          </div>
        </div>

        <button 
          type="button"
          onClick={handleSubmit}
          disabled={pointsRemaining < 0 || char.classProficiencies.length < maxClassSkills || !char.name}
          className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.4em] transition-all duration-300 ${
            pointsRemaining < 0 || char.classProficiencies.length < maxClassSkills || !char.name
            ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50'
            : 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-2xl shadow-amber-900/40 transform active:scale-95'
          }`}
        >
          {pointsRemaining < 0 ? "Budget points dépassé" : !char.name ? "Nom requis" : editId ? "Enregistrer les modifications" : "Graver la Légende"}
        </button>
      </div>

      {/* 4. VIGNETTE SOMBRE */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)] z-[1]"></div>
    </main>
  );
}

export default function CreateCharacter() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-black animate-pulse uppercase tracking-[0.5em]">Grimoire en chargement...</div>}>
      <CreateCharacterForm />
    </Suspense>
  );
}