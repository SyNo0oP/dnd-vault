"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import BattleGrid from "@/app/components/BattleGrid";
import CharacterSheet from "@/app/components/CharacterSheet";
import { getRaceBonus } from "@/lib/dnd-rules";

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
  int?: number;
  wis?: number;
  cha?: number;
  level?: number;
  race?: string;
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

const getPlayerVisionCells = (
  players: Player[],
  gridSize: number,
  offsetX: number,
  offsetY: number,
): Set<string> => {
  const cells = new Set<string>();
  players.forEach((p) => {
    if (p.x === 0 && p.y === 0) return;
    const col = Math.floor((p.x + gridSize * 0.35 - offsetX) / gridSize);
    const row = Math.floor((p.y + gridSize * 0.35 - offsetY) / gridSize);
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        cells.add(`${col + dc},${row + dr}`);
      }
    }
  });
  return cells;
};

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
  const [hoverPos, setHoverPos] = useState<{
    top: number;
    left: number;
  } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedCharacter, setSelectedCharacter] = useState<any | null>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogWrapperRef = useRef<HTMLDivElement>(null);
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentScene =
    gameState.campaign?.acts[gameState.currentAct]?.subActs[
      gameState.currentSubAct
    ];

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

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/sessions?code=${code}`);
        const data = await res.json();
        if (!data.session) return;
        setGameState((prev) => ({
          ...prev,
          players:
            (data.session.players as Player[])?.length > 0
              ? data.session.players
              : prev.players,
          log: data.session.log ?? prev.log,
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

  const buildFallbackPlayer = (
    email: string,
    name?: string | null,
  ): Player => ({
    id: email,
    email,
    name: name ?? "Aventurier",
    class: "Aventurier",
    hp: 20,
    maxHp: 20,
    ac: 10,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (isDM || !authSession?.user?.email || hasRegistered.current) return;
    if (gameState.campaign === null) return;

    const email = authSession.user.email;
    const alreadyIn = gameState.players.some((p) => p.id === email);

    if (alreadyIn) {
      hasRegistered.current = true;
      return;
    }

    const registerPlayer = async () => {
      let newPlayer: Player;
      const activeId = localStorage.getItem("dnd_vault_active_character");
      if (activeId) {
        try {
          const charRes = await fetch(
            `/api/characters?email=${encodeURIComponent(email)}`,
          );
          const chars = await charRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const character = Array.isArray(chars)
            ? chars.find((c: any) => c._id === activeId)
            : null;
          if (character?.stats) {
            const rb = getRaceBonus(character.race ?? "");
            const s = character.stats;
            const dexTotal = (s.dexterite ?? 10) + (rb.dexterite ?? 0);
            newPlayer = {
              id: email,
              email,
              name: character.name ?? authSession.user?.name ?? "Aventurier",
              class: character.class ?? "Aventurier",
              race: character.race,
              level: character.level ?? 1,
              hp: character.hpMax ?? 20,
              maxHp: character.hpMax ?? 20,
              ac: 10 + Math.floor((dexTotal - 10) / 2),
              x: 0,
              y: 0,
              str: (s.force ?? 10) + (rb.force ?? 0),
              dex: dexTotal,
              con: (s.constitution ?? 10) + (rb.constitution ?? 0),
              int: (s.intelligence ?? 10) + (rb.intelligence ?? 0),
              wis: (s.sagesse ?? 10) + (rb.sagesse ?? 0),
              cha: (s.charisme ?? 10) + (rb.charisme ?? 0),
            };
          } else {
            newPlayer = buildFallbackPlayer(email, authSession.user?.name);
          }
        } catch {
          newPlayer = buildFallbackPlayer(email, authSession.user?.name);
        }
      } else {
        newPlayer = buildFallbackPlayer(email, authSession.user?.name);
      }

      try {
        const res = await fetch("/api/sessions", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, newPlayer }),
        });
        if (res.ok) {
          hasRegistered.current = true;
          setGameState((prev) => ({
            ...prev,
            players: [...prev.players, newPlayer],
          }));
        }
      } catch (e) {
        console.error("Erreur inscription joueur:", e);
      }
    };

    registerPlayer();
  }, [code, isDM, authSession, gameState.campaign, gameState.players]);

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
    [code],
  );

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

  const changeSubAct = (subIdx: number) => {
    const update: SessionSyncFields = {
      currentSubAct: subIdx,
      monsters: [],
      fogRevealedCells: [],
    };
    setGameState((prev) => ({ ...prev, ...update }));
    syncToServer(update);
  };

  const updatePlayerHp = (playerId: string, delta: number) => {
    const updatedPlayers = gameState.players.map((p) =>
      p.id === playerId
        ? { ...p, hp: Math.max(0, Math.min(p.maxHp, p.hp + delta)) }
        : p,
    );
    setGameState((prev) => ({ ...prev, players: updatedPlayers }));
    syncToServer({ players: updatedPlayers });
  };

  const applyDamageInput = (playerId: string) => {
    const val = parseInt(dmHpInputs[playerId] ?? "0", 10);
    if (isNaN(val) || val === 0) return;
    const updatedPlayers = gameState.players.map((p) =>
      p.id === playerId ? { ...p, hp: Math.max(0, p.hp - val) } : p,
    );
    setGameState((prev) => ({ ...prev, players: updatedPlayers }));
    setDmHpInputs((prev) => ({ ...prev, [playerId]: "" }));
    syncToServer({ players: updatedPlayers });
  };

  const updateMonsterHp = (idx: number, delta: number) => {
    const updated = activeMonsters.map((m, i) => {
      const maxHp = m.maxHp ?? m.hp ?? 10;
      if (i !== idx) return { ...m, maxHp };
      const newHp = Math.max(0, Math.min(maxHp, (m.hp ?? maxHp) + delta));
      return { ...m, hp: newHp, maxHp };
    });
    setGameState((prev) => ({ ...prev, monsters: updated }));
    syncToServer({ monsters: updated });
  };

  const handleMonstersUpdate = (monsters: Monster[]) => {
    setGameState((prev) => ({ ...prev, monsters }));
    syncToServer({ monsters });
  };

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

  // ── FIX 1 : boutons toujours disponibles si map présente ─────────────────
  const revealAllCells = () => {
    if (!currentScene) return;
    const gs = currentScene.gridSize ?? 50;
    const wrapper = fogWrapperRef.current;
    if (!wrapper) return;
    const cols = Math.ceil(wrapper.clientWidth / gs) + 1;
    const rows = Math.ceil(wrapper.clientHeight / gs) + 1;
    const allCells: string[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        allCells.push(`${c},${r}`);
      }
    }
    setGameState((prev) => ({ ...prev, fogRevealedCells: allCells }));
    syncToServer({ fogRevealedCells: allCells });
  };

  const hideAllCells = () => {
    setGameState((prev) => ({ ...prev, fogRevealedCells: [] }));
    syncToServer({ fogRevealedCells: [] });
  };

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

    const manualRevealed = new Set(gameState.fogRevealedCells);
    // ── FIX 2 : vision joueur toujours calculée ───────────────────────────
    const playerVision = getPlayerVisionCells(gameState.players, gs, ox, oy);

    const isVisible = (col: number, row: number) => {
      const key = `${col},${row}`;
      return manualRevealed.has(key) || playerVision.has(key);
    };

    ctx.fillStyle = isDM ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.9)";

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!isVisible(c, r)) {
          ctx.fillRect(c * gs + ox, r * gs + oy, gs, gs);
        }
      }
    }

    if (isDM && fogEditMode) {
      ctx.strokeStyle = "rgba(245,158,11,0.25)";
      ctx.lineWidth = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.strokeRect(c * gs + ox, r * gs + oy, gs, gs);
        }
      }
    }
  }, [
    gameState.fogRevealedCells,
    gameState.players,
    currentScene,
    fogEditMode,
    isDM,
  ]);

  const rollDice = (d: number, secret: boolean) => {
    const r = Math.floor(Math.random() * d) + 1;
    const entry = secret ? `[SECRET] D${d} : ${r}` : `D${d} : ${r}`;
    if (secret) {
      setGameState((prev) => ({ ...prev, log: [entry, ...prev.log] }));
    } else {
      setGameState((prev) => {
        const newLog = [entry, ...prev.log];
        syncToServer({ log: newLog });
        return { ...prev, log: newLog };
      });
    }
  };

  const activeMonsters =
    gameState.monsters.length > 0
      ? gameState.monsters
      : (currentScene?.monsters ?? []);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
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
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setFogEditMode((f) => !f)}
              className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border transition-all ${
                fogEditMode
                  ? "border-amber-500 text-amber-500 bg-amber-500/10"
                  : "border-white/10 text-slate-500 hover:border-amber-500/50"
              }`}
            >
              {fogEditMode ? "Brouillard ON" : "Brouillard"}
            </button>
            {/* FIX 1 : visible dès qu'il y a une map */}
            {currentScene?.mapUrl && (
              <>
                <button
                  onClick={revealAllCells}
                  className="text-[9px] font-black uppercase px-3 py-2 rounded-xl border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-all"
                >
                  Tout révéler
                </button>
                <button
                  onClick={hideAllCells}
                  className="text-[9px] font-black uppercase px-3 py-2 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
                >
                  Tout cacher
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 border-r border-white/5 bg-slate-900/50 flex flex-col p-6 overflow-y-auto">
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
                      if (hoverTimeout.current)
                        clearTimeout(hoverTimeout.current);
                      setHoveredPlayerId(p.id);
                    }}
                    onMouseLeave={() => {
                      hoverTimeout.current = setTimeout(
                        () => setHoveredPlayerId(null),
                        300,
                      );
                    }}
                    className="bg-slate-950 p-4 rounded-2xl border border-white/5 hover:border-amber-500 transition-all"
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
                    <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          p.maxHp > 0 && p.hp / p.maxHp < 0.25
                            ? "bg-red-500"
                            : p.maxHp > 0 && p.hp / p.maxHp < 0.5
                              ? "bg-yellow-500"
                              : "bg-green-500"
                        }`}
                        style={{
                          width: `${p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0}%`,
                        }}
                      />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => updatePlayerHp(p.id, -1)}
                        className="w-7 h-7 rounded-lg bg-red-500/10 text-red-400 text-xs font-black hover:bg-red-500/30 transition-all"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        placeholder="Dégâts"
                        value={dmHpInputs[p.id] ?? ""}
                        onChange={(e) =>
                          setDmHpInputs((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") applyDamageInput(p.id);
                        }}
                        className="flex-1 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white text-center focus:outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => applyDamageInput(p.id)}
                        className="text-[8px] font-black text-amber-500 uppercase px-2 py-1 bg-amber-500/10 rounded-lg hover:bg-amber-500/30 transition-all"
                      >
                        OK
                      </button>
                      <button
                        onClick={() => updatePlayerHp(p.id, 1)}
                        className="w-7 h-7 rounded-lg bg-green-500/10 text-green-400 text-xs font-black hover:bg-green-500/30 transition-all"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {!isDM &&
            (() => {
              const me = gameState.players.find(
                (p) => p.email === authSession?.user?.email,
              );
              return (
                <>
                  {me && (
                    <div className="mb-6 bg-slate-950 border border-blue-500/30 p-4 rounded-2xl">
                      <p className="text-[10px] font-black text-blue-400 uppercase mb-2">
                        Mon Personnage
                      </p>
                      <p className="font-bold text-white">{me.name}</p>
                      <p className="text-[9px] text-slate-500 uppercase">
                        {me.class}
                      </p>
                      <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            me.maxHp > 0 && me.hp / me.maxHp < 0.25
                              ? "bg-red-500"
                              : me.maxHp > 0 && me.hp / me.maxHp < 0.5
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${me.maxHp > 0 ? Math.max(0, (me.hp / me.maxHp) * 100) : 0}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-amber-500 font-black mt-1">
                        {me.hp}/{me.maxHp} PV — CA {me.ac}
                      </p>
                    </div>
                  )}
                  <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">
                    Aventuriers Connectés
                  </h3>
                  <div className="space-y-3">
                    {gameState.players
                      .filter((p) => p.email !== authSession?.user?.email)
                      .map((p) => (
                        <div
                          key={p.id}
                          className="bg-slate-950 p-3 rounded-xl border border-white/5"
                        >
                          <div className="flex justify-between">
                            <span className="text-sm font-bold text-white">
                              {p.name}
                            </span>
                            <span className="text-xs text-amber-500 font-black">
                              {p.hp}/{p.maxHp} PV
                            </span>
                          </div>
                          <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                p.maxHp > 0 && p.hp / p.maxHp < 0.25
                                  ? "bg-red-500"
                                  : p.maxHp > 0 && p.hp / p.maxHp < 0.5
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                              }`}
                              style={{
                                width: `${p.maxHp > 0 ? Math.max(0, (p.hp / p.maxHp) * 100) : 0}%`,
                              }}
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
                  ),
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
                  <div
                    key={idx}
                    className="bg-slate-950 p-3 rounded-xl border border-white/5"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-white">
                        {m.name}
                      </span>
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

        <section className="flex-1 bg-black relative flex items-center justify-center p-10 overflow-auto scrollbar-hide">
          {currentScene?.mapUrl ? (
            <div ref={fogWrapperRef} className="relative inline-block">
              <BattleGrid
                mapUrl={currentScene.mapUrl}
                gridSize={currentScene.gridSize ?? 50}
                gridType={
                  (currentScene.gridType as "square" | "hex" | "none") ??
                  "square"
                }
                offsetX={currentScene.offsetX ?? 0}
                offsetY={currentScene.offsetY ?? 0}
                opacity={currentScene.opacity ?? 0.3}
                hasFog={currentScene.hasFog ?? false}
                monsters={activeMonsters}
                onUpdateMonsters={isDM ? handleMonstersUpdate : undefined}
                fogRevealedCells={(() => {
                  const manual = gameState.fogRevealedCells.map((cell) => {
                    const [x, y] = cell.split(",").map(Number);
                    return { x, y };
                  });
                  // FIX 2 : vision joueur toujours calculée
                  const vision = getPlayerVisionCells(
                    gameState.players,
                    currentScene.gridSize ?? 50,
                    currentScene.offsetX ?? 0,
                    currentScene.offsetY ?? 0,
                  );
                  const visionArr = [...vision].map((key) => {
                    const [x, y] = key.split(",").map(Number);
                    return { x, y };
                  });
                  return [...manual, ...visionArr];
                })()}
                playerTokens={gameState.players}
                onUpdatePlayerTokens={(updatedTokens) => {
                  const updatedPlayers = gameState.players.map((p) => {
                    const token = updatedTokens.find((t) => t.id === p.id);
                    return token ? { ...p, x: token.x, y: token.y } : p;
                  });
                  setGameState((prev) => ({
                    ...prev,
                    players: updatedPlayers,
                  }));
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
                  zIndex: isDM ? 5 : 20,
                }}
              />
            </div>
          ) : (
            <div className="text-slate-800 font-black uppercase tracking-[2em] text-center select-none">
              Pas de map active
            </div>
          )}
        </section>

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

      {hoveredPlayerId !== null &&
        hoverPos !== null &&
        (() => {
          const p = gameState.players.find((pl) => pl.id === hoveredPlayerId);
          if (!p) return null;
          return (
            <div
              onMouseEnter={() => {
                if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
              }}
              onMouseLeave={() => {
                hoverTimeout.current = setTimeout(
                  () => setHoveredPlayerId(null),
                  300,
                );
              }}
              style={{
                position: "fixed",
                top: hoverPos.top,
                left: hoverPos.left,
                zIndex: 9999,
              }}
              className="w-64 bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-3">
                <div>
                  <p className="font-bold text-white text-sm">{p.name}</p>
                  <p className="text-[9px] text-slate-400 uppercase">
                    Niveau {p.level ?? 1} {p.class}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-amber-500">
                    {p.hp}/{p.maxHp} PV
                  </p>
                  <p className="text-[9px] text-slate-500">CA {p.ac}</p>
                </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    p.hp / p.maxHp < 0.25
                      ? "bg-red-500"
                      : p.hp / p.maxHp < 0.5
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${(p.hp / p.maxHp) * 100}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { label: "FOR", val: p.str },
                  { label: "DEX", val: p.dex },
                  { label: "CON", val: p.con },
                  { label: "INT", val: p.int },
                  { label: "SAG", val: p.wis },
                  { label: "CHA", val: p.cha },
                ].map(({ label, val }) => {
                  const mod = val ? Math.floor((val - 10) / 2) : null;
                  return (
                    <div
                      key={label}
                      className="bg-slate-950 p-2 rounded-xl text-center border border-white/5"
                    >
                      <p className="text-[8px] text-slate-500 uppercase font-black">
                        {label}
                      </p>
                      <p className="text-sm font-black text-white">
                        {val ?? "—"}
                      </p>
                      <p className="text-[9px] text-amber-500 font-bold">
                        {mod !== null ? (mod >= 0 ? `+${mod}` : `${mod}`) : ""}
                      </p>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => {
                  setSelectedCharacter({
                    name: p.name,
                    level: p.level ?? 1,
                    race: p.race ?? "",
                    class: p.class,
                    stats: {
                      force: p.str ?? 10,
                      dexterite: p.dex ?? 10,
                      constitution: p.con ?? 10,
                      intelligence: p.int ?? 10,
                      sagesse: p.wis ?? 10,
                      charisme: p.cha ?? 10,
                    },
                    hpMax: p.maxHp,
                    speed: 9,
                  });
                  setHoveredPlayerId(null);
                }}
                className="w-full py-2 bg-amber-500/10 text-amber-500 rounded-xl text-[9px] font-black uppercase hover:bg-amber-500 hover:text-slate-950 transition-all"
              >
                Voir fiche complète
              </button>
            </div>
          );
        })()}

      {selectedCharacter && (
        <CharacterSheet
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </div>
  );
}
