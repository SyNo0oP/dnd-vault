"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BattleGrid from "@/app/components/BattleGrid";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Player {
  id: string;
  name: string;
  email?: string;
  class: string;
  hp: number;
  maxHp: number;
  ac: number;
  x: number;
  y: number;
  str?: number;
  dex?: number;
  con?: number;
}

interface Monster {
  name: string;
  x: number;
  y: number;
  hp?: number;
  maxHp?: number;
}

interface SubAct {
  title: string;
  mapUrl?: string;
  gridSize?: number;
  gridType?: string;
  offsetX?: number;
  offsetY?: number;
  opacity?: number;
  hasFog?: boolean;
  monsters?: Monster[];
}

interface Act {
  title: string;
  subActs: SubAct[];
}

interface Campaign {
  acts: Act[];
}

interface GameState {
  currentAct: number;
  currentSubAct: number;
  campaign: Campaign | null;
  players: Player[];
  monsters: Monster[];
  fogRevealedCells: string[];
  log: string[];
}

interface SessionSyncFields {
  currentAct?: number;
  currentSubAct?: number;
  monsters?: Monster[];
  fogRevealedCells?: string[];
  players?: Player[];
  log?: string[];
}

// ─── Composant ────────────────────────────────────────────────────────────────

export default function GameSession({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = React.use(params);
  const searchParams = useSearchParams();
  const isDM = searchParams.get("role") === "dm";
  const { data: authSession } = useSession();
  const hasRegistered = useRef(false);

  const [gameState, setGameState] = useState<GameState>({
    currentAct: 0,
    currentSubAct: 0,
    campaign: null,
    players: [],
    monsters: [],
    fogRevealedCells: [],
    log: ["La session commence..."],
  });

  const [dmHpInputs, setDmHpInputs] = useState<Record<string, string>>({});
  const [fogEditMode, setFogEditMode] = useState(false);
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ top: number; left: number } | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogWrapperRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Déclaré tôt pour être accessible dans les hooks
  const currentScene =
    gameState.campaign?.acts[gameState.currentAct]?.subActs[
      gameState.currentSubAct
    ];

  // ── Chargement initial ────────────────────────────────────────────────────

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

  // ── Polling 2s (joueurs uniquement) ───────────────────────────────────────

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions?code=${code}`);
        const data = await res.json();
        if (!data.session) return;
        setGameState((prev) => ({
          ...prev,
          // MJ et joueurs reçoivent players + log (pour voir les dés des autres)
          players:
            (data.session.players as Player[])?.length > 0
              ? data.session.players
              : prev.players,
          log: data.session.log ?? prev.log,
          // Joueurs seulement : scène active et brouillard viennent du serveur
          ...(isDM
            ? {}
            : {
                currentAct: data.session.currentAct ?? prev.currentAct,
                currentSubAct: data.session.currentSubAct ?? prev.currentSubAct,
                monsters: data.session.monsters ?? prev.monsters,
                fogRevealedCells:
                  data.session.fogRevealedCells ?? prev.fogRevealedCells,
              }),
        }));
      } catch (e) {
        console.error("Polling error:", e);
      }
    }, 2000);
    return () => clearInterval(poll);
  }, [code, isDM]);

  // ── Auto-inscription joueur ───────────────────────────────────────────────

  useEffect(() => {
    if (isDM || !authSession?.user?.email || hasRegistered.current) return;
    if (gameState.campaign === null) return; // attendre le chargement initial

    const email = authSession.user.email;
    const alreadyIn = gameState.players.some((p) => p.id === email);

    if (alreadyIn) {
      hasRegistered.current = true;
      return;
    }

    const newPlayer: Player = {
      id: email,
      email,
      name: authSession.user.name ?? "Aventurier",
      class: "Aventurier",
      hp: 20,
      maxHp: 20,
      ac: 10,
      x: 0,
      y: 0,
    };

    fetch("/api/sessions", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, newPlayer }),
    }).then((res) => {
      if (res.ok) {
        hasRegistered.current = true;
        setGameState((prev) => ({ ...prev, players: [...prev.players, newPlayer] }));
      }
    }).catch((e) => console.error("Erreur inscription joueur:", e));
  }, [code, isDM, authSession, gameState.campaign, gameState.players]);

  // ── syncToServer ──────────────────────────────────────────────────────────

  const syncToServer = useCallback(
    async (fields: SessionSyncFields) => {
      try {
        await fetch("/api/sessions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, ...fields }),
        });
      } catch (e) {
        console.error("Erreur sync:", e);
      }
    },
    [code]
  );

  // ── Action 1 : Changer d'acte ─────────────────────────────────────────────

  const changeAct = (actIdx: number) => {
    const update: SessionSyncFields = {
      currentAct: actIdx,
      currentSubAct: 0,
      monsters: [],
      fogRevealedCells: [],
    };
    setGameState((prev) => ({ ...prev, ...update }));
    syncToServer(update);
  };

  // ── Action 1 suite : Changer de sous-acte ────────────────────────────────

  const changeSubAct = (subIdx: number) => {
    const update: SessionSyncFields = {
      currentSubAct: subIdx,
      monsters: [],
      fogRevealedCells: [],
    };
    setGameState((prev) => ({ ...prev, ...update }));
    syncToServer(update);
  };

  // ── Action 2 : Modifier PV ────────────────────────────────────────────────

  const updatePlayerHp = (playerId: string, delta: number) => {
    const updatedPlayers = gameState.players.map((p) =>
      p.id === playerId
        ? { ...p, hp: Math.max(0, Math.min(p.maxHp, p.hp + delta)) }
        : p
    );
    setGameState((prev) => ({ ...prev, players: updatedPlayers }));
    syncToServer({ players: updatedPlayers });
  };

  const applyDamageInput = (playerId: string) => {
    const val = parseInt(dmHpInputs[playerId] ?? "0", 10);
    if (isNaN(val) || val === 0) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === playerId ? { ...p, hp: Math.max(0, p.hp - val) } : p
    );
    setGameState((prev) => ({ ...prev, players: updatedPlayers }));
    setDmHpInputs((prev) => ({ ...prev, [playerId]: "" }));
    syncToServer({ players: updatedPlayers });
  };

  // ── Action 2b : Modifier PV monstre ──────────────────────────────────────

  const updateMonsterHp = (idx: number, delta: number) => {
    // Initialise maxHp pour tous les monstres au premier appel
    const updated = activeMonsters.map((m, i) => {
      const maxHp = m.maxHp ?? m.hp ?? 10;
      if (i !== idx) return { ...m, maxHp };
      const newHp = Math.max(0, Math.min(maxHp, (m.hp ?? maxHp) + delta));
      return { ...m, hp: newHp, maxHp };
    });
    setGameState((prev) => ({ ...prev, monsters: updated }));
    syncToServer({ monsters: updated });
  };

  // ── Action 3 : Déplacer tokens ────────────────────────────────────────────

  const handleMonstersUpdate = (monsters: Monster[]) => {
    setGameState((prev) => ({ ...prev, monsters }));
    syncToServer({ monsters });
  };

  // ── Action 4 : Brouillard de guerre ───────────────────────────────────────

  const toggleFogCell = (col: number, row: number) => {
    const key = `${col},${row}`;
    const updated = gameState.fogRevealedCells.includes(key)
      ? gameState.fogRevealedCells.filter((k) => k !== key)
      : [...gameState.fogRevealedCells, key];
    setGameState((prev) => ({ ...prev, fogRevealedCells: updated }));
    syncToServer({ fogRevealedCells: updated });
  };

  const handleFogCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDM || !fogEditMode || !currentScene) return;
    const canvas = fogCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gs = currentScene.gridSize ?? 50;
    const ox = currentScene.offsetX ?? 0;
    const oy = currentScene.offsetY ?? 0;
    const col = Math.floor((x - ox) / gs);
    const row = Math.floor((y - oy) / gs);
    toggleFogCell(col, row);
  };

  // ── Dessin du brouillard ──────────────────────────────────────────────────

  useEffect(() => {
    const canvas = fogCanvasRef.current;
    const wrapper = fogWrapperRef.current;
    if (!canvas || !wrapper || !currentScene) return;

    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gs = currentScene.gridSize ?? 50;
    const ox = currentScene.offsetX ?? 0;
    const oy = currentScene.offsetY ?? 0;
    const cols = Math.ceil(canvas.width / gs) + 1;
    const rows = Math.ceil(canvas.height / gs) + 1;

    // Couleur du brouillard selon le rôle
    ctx.fillStyle = isDM ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.9)";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!gameState.fogRevealedCells.includes(`${c},${r}`)) {
          ctx.fillRect(c * gs + ox, r * gs + oy, gs, gs);
        }
      }
    }

    // Grille de guidage en mode édition MJ
    if (isDM && fogEditMode) {
      ctx.strokeStyle = "rgba(245,158,11,0.25)";
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.strokeRect(c * gs + ox, r * gs + oy, gs, gs);
        }
      }
    }
  }, [gameState.fogRevealedCells, currentScene, fogEditMode, isDM]);

  // ── Action 5 : Dés ───────────────────────────────────────────────────────

  const rollDice = (d: number, secret: boolean) => {
    const r = Math.floor(Math.random() * d) + 1;
    const entry = secret ? `[SECRET] D${d} : ${r}` : `D${d} : ${r}`;
    if (secret) {
      // Local uniquement, pas syncé
      setGameState((prev) => ({ ...prev, log: [entry, ...prev.log] }));
    } else {
      // Envoyé dans le log partagé
      setGameState((prev) => {
        const newLog = [entry, ...prev.log];
        syncToServer({ log: newLog });
        return { ...prev, log: newLog };
      });
    }
  };

  // Tokens : priorité aux positions live, fallback sur défauts campagne
  const activeMonsters =
    gameState.monsters.length > 0
      ? gameState.monsters
      : currentScene?.monsters ?? [];

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/10 bg-slate-900/90 flex items-center px-6 gap-8 z-50">
        <div className="bg-amber-500 text-slate-950 px-4 py-1 rounded-full text-[10px] font-black uppercase">
          SESSION: {code}
        </div>

        {isDM && gameState.campaign && (
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {gameState.campaign.acts.map((act, idx) => (
              <button
                key={idx}
                onClick={() => changeAct(idx)}
                className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl transition-all border ${
                  gameState.currentAct === idx
                    ? "border-amber-500 text-amber-500 bg-amber-500/5"
                    : "border-white/5 text-slate-500"
                }`}
              >
                {act.title}
              </button>
            ))}
          </div>
        )}

        {isDM && (
          <button
            onClick={() => setFogEditMode((f) => !f)}
            className={`ml-auto text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${
              fogEditMode
                ? "border-amber-500 text-amber-500 bg-amber-500/10"
                : "border-white/10 text-slate-500 hover:border-amber-500/50"
            }`}
          >
            {fogEditMode ? "Brouillard ON" : "Brouillard"}
          </button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── ASIDE GAUCHE ───────────────────────────────────────────────── */}
        <aside className="w-80 border-r border-white/5 bg-slate-900/50 flex flex-col p-6 overflow-y-auto">

          {/* ── VUE MJ ──────────────────────────────────────────────────── */}
          {isDM && (
          <section className="mb-10">
            <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-6">
              Aventuriers Connectés
            </h3>
            <div className="space-y-4">
              {gameState.players.map((p) => (
                <div
                  key={p.id}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setHoverPos({ top: rect.top, left: rect.right + 16 });
                    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
                    setHoveredPlayerId(p.id);
                  }}
                  onMouseLeave={() => {
                    hoverTimeout.current = setTimeout(() => setHoveredPlayerId(null), 300);
                  }}
                  className="bg-slate-950 p-4 rounded-2xl border border-white/5 hover:border-amber-500 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-bold text-sm text-white">{p.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">{p.class}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-black text-amber-500">{p.hp}/{p.maxHp} PV</p>
                      <p className="text-[8px] text-slate-600 font-black">CA {p.ac}</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        p.maxHp > 0 && p.hp / p.maxHp < 0.25 ? "bg-red-500"
                        : p.maxHp > 0 && p.hp / p.maxHp < 0.5 ? "bg-yellow-500"
                        : "bg-green-500"
                      }`}
                      style={{ width: `${p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button onClick={() => updatePlayerHp(p.id, -1)} className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 text-xs font-black hover:bg-red-500/30 transition-all">−</button>
                    <input
                      type="number"
                      placeholder="Dégâts"
                      value={dmHpInputs[p.id] ?? ""}
                      onChange={(e) => setDmHpInputs((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") applyDamageInput(p.id); }}
                      className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white text-center focus:outline-none focus:border-amber-500"
                    />
                    <button onClick={() => applyDamageInput(p.id)} className="text-[8px] font-black text-amber-500 uppercase px-2 py-1 bg-amber-500/10 rounded-lg hover:bg-amber-500/30 transition-all">OK</button>
                    <button onClick={() => updatePlayerHp(p.id, 1)} className="w-7 h-7 rounded-lg bg-green-500/10 text-green-400 text-xs font-black hover:bg-green-500/30 transition-all">+</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
          )}

          {/* ── VUE JOUEUR ──────────────────────────────────────────────── */}
          {!isDM && (() => {
            const me = gameState.players.find((p) => p.email === authSession?.user?.email);
            return (
              <>
                {me && (
                  <div className="mb-6 bg-slate-950 border border-blue-500/30 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-blue-400 uppercase mb-2">Mon Personnage</p>
                    <p className="font-bold text-white">{me.name}</p>
                    <p className="text-[9px] text-slate-500 uppercase">{me.class}</p>
                    <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          me.maxHp > 0 && me.hp / me.maxHp < 0.25 ? "bg-red-500"
                          : me.maxHp > 0 && me.hp / me.maxHp < 0.5 ? "bg-yellow-500"
                          : "bg-green-500"
                        }`}
                        style={{ width: `${me.maxHp > 0 ? Math.max(0, (me.hp / me.maxHp) * 100) : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-amber-500 font-black mt-1">{me.hp}/{me.maxHp} PV — CA {me.ac}</p>
                  </div>
                )}
                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">
                  Aventuriers Connectés
                </h3>
                <div className="space-y-3">
                  {gameState.players
                    .filter((p) => p.email !== authSession?.user?.email)
                    .map((p) => (
                      <div key={p.id} className="bg-slate-950 p-3 rounded-xl border border-white/5">
                        <div className="flex justify-between">
                          <span className="text-sm font-bold text-white">{p.name}</span>
                          <span className="text-xs text-amber-500 font-black">{p.hp}/{p.maxHp} PV</span>
                        </div>
                        <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              p.maxHp > 0 && p.hp / p.maxHp < 0.25 ? "bg-red-500"
                              : p.maxHp > 0 && p.hp / p.maxHp < 0.5 ? "bg-yellow-500"
                              : "bg-green-500"
                            }`}
                            style={{ width: `${p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </>
            );
          })()}


          {isDM && gameState.campaign && (
            <section className="flex-1">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6 italic">
                Déroulement de l'Acte
              </h3>
              <div className="space-y-2 border-l border-white/10 ml-2">
                {gameState.campaign.acts[gameState.currentAct]?.subActs.map(
                  (sub, idx) => (
                    <button
                      key={idx}
                      onClick={() => changeSubAct(idx)}
                      className={`block w-full text-left pl-6 py-2 text-[10px] font-bold uppercase relative transition-all ${
                        gameState.currentSubAct === idx
                          ? "text-amber-500"
                          : "text-slate-500"
                      }`}
                    >
                      <div
                        className={`absolute left-[-5px] top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                          gameState.currentSubAct === idx
                            ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            : "bg-slate-800"
                        }`}
                      />
                      {sub.title}
                    </button>
                  )
                )}
              </div>
            </section>
          )}

          {isDM && activeMonsters.length > 0 && (
            <section className="mt-6">
              <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">
                Monstres
              </h3>
              <div className="space-y-2">
                {activeMonsters.map((m, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white">{m.name}</span>
                      <span className="text-xs text-amber-500 font-black">
                        {m.hp ?? "?"} PV
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateMonsterHp(idx, -1)}
                        className="w-6 h-6 bg-red-900/50 hover:bg-red-600 rounded text-white text-xs font-black transition-colors"
                      >
                        −
                      </button>
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-500 rounded-full transition-all"
                          style={{
                            width: `${Math.max(0, ((m.hp ?? 0) / (m.maxHp ?? m.hp ?? 1)) * 100)}%`,
                          }}
                        />
                      </div>
                      <button
                        onClick={() => updateMonsterHp(idx, 1)}
                        className="w-6 h-6 bg-green-900/50 hover:bg-green-600 rounded text-white text-xs font-black transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* ── CENTRE : MAP ────────────────────────────────────────────────── */}
        <section className="flex-1 bg-black relative flex items-center justify-center p-10 overflow-auto scrollbar-hide">
          {currentScene?.mapUrl ? (
            <div ref={fogWrapperRef} className="relative inline-block">
              <BattleGrid
                mapUrl={currentScene.mapUrl}
                gridSize={currentScene.gridSize ?? 50}
                gridType={(currentScene.gridType as "square" | "hex" | "none") ?? "square"}
                offsetX={currentScene.offsetX ?? 0}
                offsetY={currentScene.offsetY ?? 0}
                opacity={currentScene.opacity ?? 0.3}
                hasFog={currentScene.hasFog ?? false}
                monsters={activeMonsters}
                onUpdateMonsters={isDM ? handleMonstersUpdate : undefined}
                fogRevealedCells={gameState.fogRevealedCells.map((cell) => {
                  const [x, y] = cell.split(",").map(Number);
                  return { x, y };
                })}
                playerTokens={gameState.players}
                onUpdatePlayerTokens={(updatedTokens) => {
                  const updatedPlayers = gameState.players.map((p) => {
                    const token = updatedTokens.find((t) => t.id === p.id);
                    return token ? { ...p, x: token.x, y: token.y } : p;
                  });
                  setGameState((prev) => ({ ...prev, players: updatedPlayers }));
                  syncToServer({ players: updatedPlayers });
                }}
                isDM={isDM}
              />
              <canvas
                ref={fogCanvasRef}
                onClick={handleFogCanvasClick}
                className="absolute inset-0 w-full h-full"
                style={{
                  pointerEvents: isDM && fogEditMode ? "auto" : "none",
                  cursor: isDM && fogEditMode ? "crosshair" : "default",
                }}
              />
            </div>
          ) : (
            <div className="text-slate-800 font-black uppercase tracking-[2em] text-center select-none">
              Pas de map active
            </div>
          )}
        </section>

        {/* ── ASIDE DROITE : LOG & DÉS ───────────────────────────────────── */}
        <aside className="w-72 border-l border-white/5 bg-slate-900/50 flex flex-col">
          <div className="flex-1 p-6 overflow-y-auto space-y-3">
            <h3 className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-4">
              Log de Combat
            </h3>
            {gameState.log.map((l, i) => (
              <p
                key={i}
                className={`text-[10px] leading-relaxed border-l pl-3 ${
                  l.startsWith("[SECRET]")
                    ? "text-amber-500/60 border-amber-500/40 italic"
                    : "text-slate-400 border-amber-500/20"
                }`}
              >
                {l}
              </p>
            ))}
          </div>

          {/* Dés partagés */}
          <div className="p-4 bg-slate-950 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-3">
              {isDM ? "Dés publics" : "Dés partagés"}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[4, 6, 8, 10, 12, 20].map((d) => (
                <button
                  key={d}
                  onClick={() => rollDice(d, false)}
                  className="bg-slate-900 border border-white/5 rounded-xl aspect-square flex items-center justify-center text-[10px] font-black hover:border-amber-500 hover:text-amber-500 transition-all"
                >
                  D{d}
                </button>
              ))}
            </div>
          </div>

          {/* Dés secrets MJ */}
          {isDM && (
            <div className="p-4 bg-slate-950 border-t border-amber-500/10">
              <p className="text-[9px] font-black text-amber-500/50 uppercase tracking-widest mb-3">
                Dés secrets MJ
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[4, 6, 8, 10, 12, 20].map((d) => (
                  <button
                    key={d}
                    onClick={() => rollDice(d, true)}
                    className="bg-slate-900 border border-amber-500/20 rounded-xl aspect-square flex items-center justify-center text-[10px] font-black hover:border-amber-500 hover:text-amber-500 transition-all"
                  >
                    D{d}
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

      </div>

      {/* ── MINI FICHE JOUEUR (portail fixe, hors aside) ────────────────── */}
      {hoveredPlayerId !== null && hoverPos !== null && (() => {
        const p = gameState.players.find((pl) => pl.id === hoveredPlayerId);
        if (!p) return null;
        return (
          <div
            onMouseEnter={() => { if (hoverTimeout.current) clearTimeout(hoverTimeout.current); }}
            onMouseLeave={() => { hoverTimeout.current = setTimeout(() => setHoveredPlayerId(null), 300); }}
            style={{ position: "fixed", top: hoverPos.top, left: hoverPos.left, zIndex: 9999 }}
            className="w-64 bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-2xl"
          >
            <p className="text-[10px] font-black text-amber-500 uppercase mb-3">
              Statistiques de {p.name}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {(["str", "dex", "con"] as const).map((stat) => (
                <div key={stat} className="bg-slate-950 p-2 rounded-lg text-center text-[10px]">
                  <p className="text-slate-500 uppercase">{stat}</p>
                  <p className="font-black">{p[stat] ?? "—"}</p>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase hover:bg-amber-500 hover:text-slate-950 transition-all">
              Voir fiche complète
            </button>
          </div>
        );
      })()}
    </div>
  );
}
