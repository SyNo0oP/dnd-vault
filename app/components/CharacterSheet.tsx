'use client';

export default function CharacterSheet({ character, onClose }: { character: any, onClose: () => void }) {
  if (!character) return null;

  const getMod = (score: number) => Math.floor((score - 10) / 2);
  const mastery = Math.ceil(1 + (character.level || 1) / 4);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      {/* Background flou pour fermer */}
      <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" onClick={onClose} />

      {/* La Fiche */}
      <div className="relative bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-amber-900/50 rounded-2xl shadow-2xl shadow-black">
        
        {/* Header de la fiche */}
        <div className="sticky top-0 bg-slate-900 border-b border-amber-900/30 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter">{character.name}</h2>
            <p className="text-xs text-slate-400 font-bold uppercase">
              Niveau {character.level} • {character.race} • {character.class}
            </p>
          </div>
          <button onClick={onClose} className="bg-slate-800 hover:bg-red-900/50 p-2 rounded-full transition-colors">
            <span className="text-2xl">✕</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* COLONNE 1 : STATS PRINCIPALES */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(character.stats || {}).map(([stat, val]: [string, any]) => (
                <div key={stat} className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-black text-slate-500">{stat}</p>
                  <p className="text-2xl font-black text-white">{val}</p>
                  <p className="text-xs font-bold text-amber-500">{getMod(val) >= 0 ? `+${getMod(val)}` : getMod(val)}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-xl">
              <p className="text-[10px] font-black text-amber-600 uppercase mb-2">Maîtrise & Perception</p>
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-xl font-black text-white">+{mastery}</p>
                  <p className="text-[8px] uppercase text-slate-500 font-bold">Bonus</p>
                </div>
                <div>
                  <p className="text-xl font-black text-white">{10 + getMod(character.stats.sagesse)}</p>
                  <p className="text-[8px] uppercase text-slate-500 font-bold">Perc. Passive</p>
                </div>
              </div>
            </div>
          </div>

          {/* COLONNE 2 : COMBAT & ÉQUIPEMENT */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black text-red-500 uppercase">PV MAX</p>
                <p className="text-3xl font-black text-white">{character.hpMax}</p>
              </div>
              <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl text-center">
                <p className="text-[10px] font-black text-blue-500 uppercase">VITESSE</p>
                <p className="text-3xl font-black text-white">{character.speed}m</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl h-64 overflow-y-auto">
              <p className="text-[10px] font-black text-amber-500 uppercase mb-2">Inventaire</p>
              <p className="text-xs text-slate-300 italic whitespace-pre-line leading-relaxed">
                {character.equipment || "Aucun équipement"}
              </p>
            </div>
          </div>

          {/* COLONNE 3 : RP & TRAITS */}
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl h-40 overflow-y-auto">
              <p className="text-[10px] font-black text-amber-500 uppercase mb-2">Capacités & Traits</p>
              <p className="text-[11px] text-slate-300 leading-tight">
                {character.features || "Aucune capacité enregistrée."}
              </p>
            </div>

            <div className="bg-slate-800/30 p-4 rounded-xl space-y-3">
              <p className="text-[10px] font-black text-slate-500 uppercase">Background & RP</p>
              <div>
                <p className="text-[9px] text-amber-700 font-bold uppercase">Personnalité</p>
                <p className="text-[11px] text-slate-400">{character.personality || "..."}</p>
              </div>
              <div>
                <p className="text-[9px] text-amber-700 font-bold uppercase">Idéal</p>
                <p className="text-[11px] text-slate-400">{character.ideals || "..."}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/50 text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">
           Créé le {new Date(character.createdAt).toLocaleDateString('fr-FR')}
        </div>
      </div>
    </div>
  );
}