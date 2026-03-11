"use client";
import { useState, useEffect } from "react";
import BattleGrid from "./BattleGrid";

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
  // On initialise les états, mais on va aussi les surveiller via useEffect
  const [mapUrl, setMapUrl] = useState<string>("");
  const [settings, setSettings] = useState({
    gridType: "square",
    gridSize: 50,
    opacity: 0.3,
    offsetX: 0,
    offsetY: 0,
  });

  // CRUCIAL : Met à jour les états internes quand on change de scène (initialSettings)
  useEffect(() => {
    if (isOpen && initialSettings) {
      setMapUrl(initialSettings.mapUrl || "");
      setSettings({
        gridType: initialSettings.gridType || "square",
        gridSize: initialSettings.gridSize || 50,
        opacity: initialSettings.opacity || 0.3,
        offsetX: initialSettings.offsetX || 0,
        offsetY: initialSettings.offsetY || 0,
      });
    }
  }, [isOpen, initialSettings]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Libère l'ancienne URL pour éviter les fuites mémoire si nécessaire
      if (mapUrl.startsWith("blob:")) URL.revokeObjectURL(mapUrl);
      setMapUrl(URL.createObjectURL(file));
    }
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
        <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 space-y-6 overflow-y-auto">
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
                setSettings({ ...settings, gridSize: parseInt(e.target.value) })
              }
              className="w-full accent-amber-500"
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
                className="w-full bg-slate-800 p-2 rounded-xl text-xs"
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
                className="w-full bg-slate-800 p-2 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* ZONE DE PREVIEW */}
        <div className="lg:col-span-3 overflow-auto flex items-center justify-center bg-black/40 rounded-3xl border border-dashed border-white/10">
          {mapUrl ? (
            <BattleGrid
              {...settings}
              mapUrl={mapUrl}
              gridType={settings.gridType as "square" | "hex" | "none"}
            />
          ) : (
            <p className="text-slate-600 font-black uppercase italic">
              Aucune image sélectionnée
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
