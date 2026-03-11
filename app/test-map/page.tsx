"use client";
import { useState } from "react";
import BattleGrid from "@/app/components/BattleGrid";

export default function TestMapPage() {
  const [mapUrl, setMapUrl] = useState<string>("/map3.jpg");
  const [settings, setSettings] = useState({
    gridType: "square" as "square" | "hex" | "none",
    gridSize: 50,
    opacity: 0.3,
    offsetX: 0,
    offsetY: 0,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setMapUrl(URL.createObjectURL(file));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-black uppercase text-amber-500 mb-8">
        🛠️ Laboratoire de Cartographie
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* PANNEAU DE CONTRÔLE */}
        <div className="bg-slate-900 p-6 rounded-3xl border border-white/10 space-y-6 h-fit">
          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
              Importer une Map
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="text-xs text-slate-400"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
              Type de Grille
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
              max="200"
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
                Décalage X
              </label>
              <input
                type="number"
                value={settings.offsetX}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    offsetX: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-800 p-2 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
                Décalage Y
              </label>
              <input
                type="number"
                value={settings.offsetY}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    offsetY: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-800 p-2 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-amber-500 uppercase mb-2">
              Opacité
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.opacity}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  opacity: parseFloat(e.target.value),
                })
              }
              className="w-full accent-amber-500"
            />
          </div>
        </div>

        {/* AFFICHAGE DE LA MAP */}
        <div className="lg:col-span-3">
          <BattleGrid {...settings} mapUrl={mapUrl} />
        </div>
      </div>
    </main>
  );
}
