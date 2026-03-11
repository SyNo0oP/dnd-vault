"use client";
import { useState, useEffect } from "react";
import BattleGrid from "./BattleGrid";
import MonsterLibraryModal from "./MonsterLibraryModal";

interface MapConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  initialSettings?: any;
}

export default function MapConfigModal({
  isOpen,
  onClose,
  onSave,
  initialSettings,
}: MapConfigModalProps) {
  const [mapUrl, setMapUrl] = useState<string>("");
  const [isMonsterModalOpen, setIsMonsterModalOpen] = useState(false);

  // Initialisation complète des réglages
  const [settings, setSettings] = useState({
    gridType: "square",
    gridSize: 50,
    opacity: 0.3,
    offsetX: 0,
    offsetY: 0,
    hasFog: false,
    monsters: [] as any[],
  });

  // Synchronisation avec les données de la scène active
  useEffect(() => {
    if (isOpen && initialSettings) {
      setMapUrl(initialSettings.mapUrl || "");
      setSettings({
        gridType: initialSettings.gridType || "square",
        gridSize: initialSettings.gridSize || 50,
        opacity: initialSettings.opacity || 0.3,
        offsetX: initialSettings.offsetX || 0,
        offsetY: initialSettings.offsetY || 0,
        hasFog: initialSettings.hasFog || false,
        monsters: initialSettings.monsters || [],
      });
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (mapUrl.startsWith("blob:")) URL.revokeObjectURL(mapUrl);
      setMapUrl(URL.createObjectURL(file));
    }
  };

  // Ajoute un monstre avec des coordonnées par défaut (0,0)
  const addMonsterToSettings = (monster: any) => {
    setSettings({
      ...settings,
      monsters: [
        ...settings.monsters,
        { ...monster, x: settings.offsetX + 20, y: settings.offsetY + 20 },
      ],
    });
    setIsMonsterModalOpen(false);
  };

  const removeMonster = (index: number) => {
    const newMonsters = settings.monsters.filter((_, i) => i !== index);
    setSettings({ ...settings, monsters: newMonsters });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl p-4 md:p-8 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter">
          Configuration de la Map
        </h2>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold uppercase text-xs"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave({ ...settings, mapUrl })}
            className="bg-amber-500 text-slate-950 px-6 py-2 rounded-xl font-black uppercase text-xs hover:bg-white transition-all"
          >
            Valider la configuration
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 overflow-hidden">
        {/* PANNEAU DE CONTRÔLE */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 space-y-6 overflow-y-auto shadow-2xl">
          {/* IMAGE */}
          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
              Image de la Scène
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="text-xs text-slate-400 w-full"
            />
          </div>

          {/* GRILLE */}
          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
              Grille
            </label>
            <select
              className="w-full bg-slate-800 p-2 rounded-xl text-xs font-bold outline-none"
              value={settings.gridType}
              onChange={(e) =>
                setSettings({ ...settings, gridType: e.target.value as any })
              }
            >
              <option value="square">Carrée</option>
              <option value="hex">Hexagonale</option>
              <option value="none">Aucune</option>
            </select>
          </div>

          {/* BROUILLARD */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-2xl">
              <span className="text-[10px] font-black text-amber-500 uppercase">
                Brouillard de Guerre
              </span>
              <input
                type="checkbox"
                checked={settings.hasFog}
                onChange={(e) =>
                  setSettings({ ...settings, hasFog: e.target.checked })
                }
                className="w-4 h-4 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* TAILLE ET OFFSETS */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
                Taille : {settings.gridSize}px
              </label>
              <input
                type="range"
                min="20"
                max="150"
                value={settings.gridSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    gridSize: parseInt(e.target.value),
                  })
                }
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
                  Offset X
                </label>
                <input
                  type="number"
                  value={settings.offsetX}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      offsetX: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 p-2 rounded-xl text-xs border border-white/5 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
                  Offset Y
                </label>
                <input
                  type="number"
                  value={settings.offsetY}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      offsetY: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-slate-800 p-2 rounded-xl text-xs border border-white/5 outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* LISTE DES MONSTRES */}
          <div className="pt-4 border-t border-white/5">
            <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
              Monstres sur la map
            </label>
            <button
              onClick={() => setIsMonsterModalOpen(true)}
              className="w-full bg-amber-500/10 border border-amber-500/30 text-amber-500 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 hover:text-slate-950 transition-all shadow-lg"
            >
              + Ajouter depuis le Bestiaire
            </button>

            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {settings.monsters.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950 p-3 rounded-xl text-[10px] flex justify-between items-center border border-white/5 group"
                >
                  <span className="font-bold text-white group-hover:text-amber-500 transition-colors">
                    {m.name}
                  </span>
                  <button
                    onClick={() => removeMonster(idx)}
                    className="text-red-500 uppercase font-black hover:text-white transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ZONE DE PREVIEW INTERACTIVE */}
        <div className="lg:col-span-3 overflow-auto flex items-center justify-center bg-black/40 rounded-3xl border border-dashed border-white/10 relative scrollbar-hide">
          {mapUrl ? (
            <div className="p-10">
              <BattleGrid
                {...settings}
                mapUrl={mapUrl}
                gridType={settings.gridType as "square" | "hex" | "none"}
                // ICI : On lie la mise à jour des positions des monstres
                onUpdateMonsters={(newMonsters) =>
                  setSettings({ ...settings, monsters: newMonsters })
                }
              />

              {settings.hasFog && (
                <div className="absolute top-6 right-6 pointer-events-none">
                  <span className="bg-indigo-600/90 text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-2xl backdrop-blur-md border border-white/10">
                    Brouillard de guerre actif
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-5xl opacity-20">🗺️</div>
              <p className="text-slate-600 font-black uppercase italic tracking-widest">
                Aucune image sélectionnée
              </p>
            </div>
          )}
        </div>
      </div>

      <MonsterLibraryModal
        isOpen={isMonsterModalOpen}
        onClose={() => setIsMonsterModalOpen(false)}
        onAddMonster={addMonsterToSettings}
      />
    </div>
  );
}
