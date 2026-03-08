'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";

export default function CreateCampaign() {
  const { data: session } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [config, setConfig] = useState({
    name: '',
    description: '',
    maxPlayers: 5,
    acts: [
      { 
        title: 'Acte 1', 
        subActs: [{ title: 'Scène 1', description: '', mapUrl: '', isLocalMap: false }] 
      }
    ], 
    settings: {
      enemyHPVisible: false,
      gridType: 'square',
      gridSize: 50,
      secretDMDie: true, // Ton paramètre de jets cachés
      mapUrlGlobal: '',
    }
  });

  // --- LOGIQUE DE SUPPRESSION ---
  const removeAct = (index: number) => {
    if (config.acts.length <= 1) return;
    const newActs = config.acts.filter((_, i) => i !== index);
    setConfig({ ...config, acts: newActs });
  };

  const removeSubAct = (aIdx: number, sIdx: number) => {
    if (config.acts[aIdx].subActs.length <= 1) return;
    const newActs = [...config.acts];
    newActs[aIdx].subActs = newActs[aIdx].subActs.filter((_, i) => i !== sIdx);
    setConfig({ ...config, acts: newActs });
  };

  // --- LOGIQUE DES AJOUTS ---
  const addAct = () => {
    setConfig({
      ...config, 
      acts: [...config.acts, { title: `Acte ${config.acts.length + 1}`, subActs: [{ title: 'Scène 1', description: '', mapUrl: '', isLocalMap: false }] }]
    });
  };

  const addSubAct = (actIndex: number) => {
    const newActs = [...config.acts];
    newActs[actIndex].subActs.push({ title: `Scène ${newActs[actIndex].subActs.length + 1}`, description: '', mapUrl: '', isLocalMap: false });
    setConfig({ ...config, acts: newActs });
  };

  const updateSubAct = (actIndex: number, subIndex: number, field: string, value: any) => {
    const newActs = [...config.acts];
    (newActs[actIndex].subActs[subIndex] as any)[field] = value;
    setConfig({ ...config, acts: newActs });
  };

  // --- GESTION UPLOAD ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, aIdx: number, sIdx: number) => {
    const file = e.target.files?.[0];
    if (file) {
      // Ici, on stocke le nom pour l'instant. 
      // En prod, tu ferais un upload vers ton serveur/cloud.
      updateSubAct(aIdx, sIdx, 'mapUrl', file.name);
      updateSubAct(aIdx, sIdx, 'isLocalMap', true);
    }
  };

  const handleSubmit = async () => {
    if (!session?.user?.email) return alert("Connecte-toi d'abord !");
    if (!config.name) return alert("Le nom de la campagne est requis !");

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, creatorEmail: session.user.email, joinCode, createdAt: new Date() }),
      });
      if (res.ok) router.push('/campaigns');
    } catch (error) { console.error(error); }
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-950 text-slate-200 p-4 md:p-8 overflow-y-auto">
      <div className="fixed inset-0 z-0 opacity-20" style={{ backgroundImage: "url('/map3.jpg')", backgroundSize: 'cover' }} />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 pb-20">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase">Configuration <span className="text-amber-500 italic">MJ</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLONNE RÉGLAGES */}
          <div className="space-y-6">
            <section className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
              <h2 className="text-[10px] font-black text-amber-500 uppercase mb-6 tracking-widest">Général & Dés</h2>
              
              <div className="space-y-4">
                <input type="text" placeholder="Nom de la Campagne" className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-amber-500 font-bold" value={config.name} onChange={(e) => setConfig({...config, name: e.target.value})} />
                
                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">Cacher mes jets (MJ)</span>
                        <input type="checkbox" className="w-5 h-5 accent-amber-500" checked={config.settings.secretDMDie} onChange={(e) => setConfig({...config, settings: {...config.settings, secretDMDie: e.target.checked}})} />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-bold">PV Ennemis visibles</span>
                        <input type="checkbox" className="w-5 h-5 accent-amber-500" checked={config.settings.enemyHPVisible} onChange={(e) => setConfig({...config, settings: {...config.settings, enemyHPVisible: e.target.checked}})} />
                    </div>
                </div>

                <select className="w-full bg-slate-800 p-3 rounded-xl text-sm outline-none font-bold text-amber-500" value={config.settings.gridType} onChange={(e) => setConfig({...config, settings: {...config.settings, gridType: e.target.value}})}>
                  <option value="none">Pas de grille</option>
                  <option value="square">Quadrillage Carré</option>
                  <option value="hex">Quadrillage Hexagonal</option>
                </select>
              </div>
            </section>
          </div>

          {/* COLONNE SCÉNARIO (ACTES & SOUS-ACTES) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Progression de l'histoire</h2>
                <button onClick={addAct} className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-2 rounded-xl transition-all">+ AJOUTER UN ACTE</button>
              </div>

              <div className="space-y-12">
                {config.acts.map((act, aIdx) => (
                  <div key={aIdx} className="relative group bg-white/5 p-6 rounded-3xl border border-white/5">
                    <button onClick={() => removeAct(aIdx)} className="absolute top-4 right-4 text-slate-600 hover:text-red-500 text-xs font-bold uppercase transition-colors">Supprimer Acte</button>
                    
                    <input 
                      type="text" 
                      className="bg-transparent text-2xl font-black text-white outline-none focus:text-amber-500 mb-6"
                      value={act.title}
                      onChange={(e) => { const n = [...config.acts]; n[aIdx].title = e.target.value; setConfig({...config, acts: n}); }}
                    />
                    
                    <div className="space-y-4">
                      {act.subActs.map((sub, sIdx) => (
                        <div key={sIdx} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                          <div className="flex justify-between items-center">
                            <input type="text" className="bg-transparent font-bold text-amber-600 outline-none" value={sub.title} onChange={(e) => updateSubAct(aIdx, sIdx, 'title', e.target.value)} />
                            <button onClick={() => removeSubAct(aIdx, sIdx)} className="text-[9px] text-slate-700 hover:text-red-500 font-black uppercase">Supprimer Scène</button>
                          </div>

                          <textarea placeholder="Description de la scène..." className="w-full bg-slate-900/40 p-3 rounded-xl text-xs h-20 outline-none border border-transparent focus:border-amber-500/30 resize-none" value={sub.description} onChange={(e) => updateSubAct(aIdx, sIdx, 'description', e.target.value)} />
                          
                          <div className="flex gap-2">
                            <input type="text" placeholder="URL de la Map" className="flex-1 bg-slate-900/40 p-2 rounded-lg text-[10px] outline-none" value={sub.isLocalMap ? `Fichier : ${sub.mapUrl}` : sub.mapUrl} onChange={(e) => { updateSubAct(aIdx, sIdx, 'mapUrl', e.target.value); updateSubAct(aIdx, sIdx, 'isLocalMap', false); }} />
                            <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg text-[10px] font-black flex items-center transition-colors">
                              📁 IMPORT
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, aIdx, sIdx)} />
                            </label>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => addSubAct(aIdx)} className="text-[10px] font-black text-amber-500/50 hover:text-amber-500 uppercase tracking-[0.2em] w-full py-2 border-2 border-dashed border-white/5 rounded-xl transition-all">+ Nouvelle Scène</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} className="w-full py-6 bg-amber-600 text-slate-950 font-black uppercase tracking-[0.5em] rounded-3xl shadow-2xl hover:bg-white transition-all transform hover:scale-[1.01]">
              LANCER LA CAMPAGNE
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}