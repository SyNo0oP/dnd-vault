"use client";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BattleGrid from "@/app/components/BattleGrid";

export default function GameSession({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = React.use(params);
  const searchParams = useSearchParams();
  const role = searchParams.get("role");
  const isDM = role === "dm";

  const [gameState, setGameState] = useState({
    currentAct: 0,
    currentSubAct: 0,
    campaign: null as any,
    players: [] as any[],
    monsters: [] as any[],
    fogRevealedCells: [] as string[],
    log: ["La session commence..."],
  });

  // Chargement initial
  useEffect(() => {
    fetch(`/api/sessions?code=${code}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session && data.campaign) {
          setGameState((prev) => ({
            ...prev,
            campaign: data.campaign,
            currentAct: data.session.currentAct ?? 0,
            currentSubAct: data.session.currentSubAct ?? 0,
            monsters: data.session.monsters ?? [],
            fogRevealedCells: data.session.fogRevealedCells ?? [],
            players: data.session.players ?? [],
            log: data.session.log ?? ["La session commence..."],
          }));
        }
      })
      .catch((err) => console.error("Erreur chargement session:", err));
  }, [code]);

  // Polling toutes les 2s — joueurs reçoivent passivement, MJ est source de vérité
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions?code=${code}`);
        const data = await res.json();
        if (!data.session) return;
        if (isDM) return;
        setGameState((prev) => ({
          ...prev,
          currentAct: data.session.currentAct ?? prev.currentAct,
          currentSubAct: data.session.currentSubAct ?? prev.currentSubAct,
          monsters: data.session.monsters ?? prev.monsters,
          fogRevealedCells: data.session.fogRevealedCells ?? prev.fogRevealedCells,
          players:
            (data.session.players as any[])?.length > 0
              ? data.session.players
              : prev.players,
          log: data.session.log ?? prev.log,
        }));
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [code, isDM]);

  const currentScene =
    gameState.campaign?.acts[gameState.currentAct]?.subActs[
      gameState.currentSubAct
    ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      {/* BARRE CONDUCTRICE MJ */}
      <header className="h-16 border-b border-white/10 bg-slate-900/90 flex items-center px-6 gap-8 z-50">
        <div className="bg-amber-500 text-slate-950 px-4 py-1 rounded-full text-[10px] font-black uppercase">
          SESSION: {code}
        </div>

        {isDM && gameState.campaign && (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {gameState.campaign.acts.map((act: any, idx: number) => (
              <button
                key={idx}
                onClick={() =>
                  setGameState({
                    ...gameState,
                    currentAct: idx,
                    currentSubAct: 0,
                  })
                }
                className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all border ${gameState.currentAct === idx ? "border-amber-500 text-amber-500 bg-amber-500/5" : "border-white/5 text-slate-500"}`}
              >
                {act.title}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ASIDE GAUCHE : JOUEURS ET SCÈNES */}
        <aside className="w-80 border-r border-white/5 bg-slate-900/50 flex flex-col p-6">
          <section className="mb-10">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6">
              Aventuriers Connectés
            </h3>
            <div className="space-y-4">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  className="group relative bg-slate-950 p-4 rounded-2xl border border-white/5 hover:border-amber-500 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-white">{p.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">
                        {p.class}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-500">
                        {p.hp}/{p.maxHp} PV
                      </p>
                      <p className="text-[8px] text-slate-600 font-black">
                        CA {p.ac}
                      </p>
                    </div>
                  </div>

                  {/* MINI FICHE AU HOVER */}
                  <div className="absolute left-full ml-4 top-0 w-64 bg-slate-900 border border-amber-500/30 p-4 rounded-2xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-[100] shadow-2xl">
                    <p className="text-[10px] font-black text-amber-500 uppercase mb-3">
                      Statistiques de {p.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-slate-950 p-2 rounded-lg text-center text-[10px]">
                        <p className="text-slate-500">FOR</p>{" "}
                        <p className="font-black">{p.str}</p>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg text-center text-[10px]">
                        <p className="text-slate-500">DEX</p>{" "}
                        <p className="font-black">{p.dex}</p>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-lg text-center text-[10px]">
                        <p className="text-slate-500">CON</p>{" "}
                        <p className="font-black">{p.con}</p>
                      </div>
                    </div>
                    <button className="w-full mt-4 py-2 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase hover:bg-amber-500 hover:text-slate-950">
                      Voir fiche complète
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {isDM && gameState.campaign && (
            <section className="flex-1 overflow-y-auto">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">
                Déroulement de l'Acte
              </h3>
              <div className="space-y-2 border-l border-white/10 ml-2">
                {gameState.campaign.acts[gameState.currentAct].subActs.map(
                  (sub: any, idx: number) => (
                    <button
                      key={idx}
                      onClick={() =>
                        setGameState({ ...gameState, currentSubAct: idx })
                      }
                      className={`block w-full text-left pl-6 py-2 text-[10px] font-bold uppercase relative transition-all ${gameState.currentSubAct === idx ? "text-amber-500" : "text-slate-500"}`}
                    >
                      <div
                        className={`absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${gameState.currentSubAct === idx ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-slate-800"}`}
                      />
                      {sub.title}
                    </button>
                  ),
                )}
              </div>
            </section>
          )}
        </aside>

        {/* CENTRE : MAP */}
        <section className="flex-1 bg-black relative flex items-center justify-center p-10 overflow-auto scrollbar-hide">
          {currentScene?.mapUrl ? (
            <BattleGrid
              mapUrl={currentScene.mapUrl}
              gridSize={currentScene.gridSize}
              gridType={currentScene.gridType as any}
              offsetX={currentScene.offsetX}
              offsetY={currentScene.offsetY}
              opacity={currentScene.opacity}
              monsters={currentScene.monsters}
              onUpdateMonsters={(m) => {}} // À synchroniser plus tard
            />
          ) : (
            <div className="text-slate-800 font-black uppercase tracking-[2em] text-center select-none">
              Pas de map active
            </div>
          )}
        </section>

        {/* DROITE : LOG & DÉS */}
        <aside className="w-72 border-l border-white/5 bg-slate-900/50 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto space-y-3">
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">
              Log de Combat
            </h3>
            {gameState.log.map((l, i) => (
              <p
                key={i}
                className="text-[10px] text-slate-400 leading-relaxed border-l border-amber-500/20 pl-3"
              >
                {l}
              </p>
            ))}
          </div>
          <div className="p-6 bg-slate-950 border-t border-white/5 grid grid-cols-3 gap-2">
            {[4, 6, 8, 10, 12, 20].map((d) => (
              <button
                key={d}
                onClick={() => {
                  const r = Math.floor(Math.random() * d) + 1;
                  setGameState((p) => ({
                    ...p,
                    log: [`D${d} : Résultat ${r}`, ...p.log],
                  }));
                }}
                className="bg-slate-900 border border-white/5 rounded-xl aspect-square flex items-center justify-center text-[10px] font-black hover:border-amber-500 hover:text-amber-500 transition-all"
              >
                D{d}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
