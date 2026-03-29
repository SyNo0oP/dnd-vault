"use client";
import { useState, useEffect } from "react";

interface MonsterSheetProps {
  monster: { name: string; hp?: number; maxHp?: number; ac?: number };
  onClose: () => void;
}

interface SrdData {
  name: string;
  type: string;
  size: string;
  alignment: string;
  armor_class: { value: number }[];
  hit_points: number;
  speed: Record<string, string>;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  challenge_rating: number;
  actions?: { name: string; desc: string }[];
  special_abilities?: { name: string; desc: string }[];
}

export default function MonsterSheet({ monster, onClose }: MonsterSheetProps) {
  const [srd, setSrd] = useState<SrdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const slug = monster.name.toLowerCase().replace(/ /g, "-");
    fetch(`https://www.dnd5eapi.co/api/monsters/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setSrd(data);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [monster.name]);

  const getMod = (score: number) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  };

  const hp = monster.hp ?? srd?.hit_points ?? 0;
  const maxHp = monster.maxHp ?? monster.hp ?? srd?.hit_points ?? 0;
  const ac = monster.ac ?? (srd?.armor_class?.[0]?.value ?? 0);
  const hpRatio = maxHp > 0 ? hp / maxHp : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
      <div
        className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-amber-900/50 rounded-2xl shadow-2xl shadow-black">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-amber-900/30 p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-black text-amber-500 uppercase tracking-tighter">
              {monster.name}
            </h2>
            {srd && (
              <p className="text-xs text-slate-400 font-bold uppercase">
                {srd.size} {srd.type} — {srd.alignment}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-red-900/50 p-2 rounded-full transition-colors"
          >
            <span className="text-2xl">&#x2715;</span>
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-amber-500 font-black animate-pulse uppercase">
            Chargement du grimoire...
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* COLONNE 1 : Combat */}
            <div className="space-y-4">
              {/* PV / CA / Vitesse */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-950/20 border border-red-900/30 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-black text-red-500 uppercase">
                    PV
                  </p>
                  <p className="text-3xl font-black text-white">
                    {hp}/{maxHp}
                  </p>
                  <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        hpRatio < 0.25
                          ? "bg-red-500"
                          : hpRatio < 0.5
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${hpRatio * 100}%` }}
                    />
                  </div>
                </div>
                <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-black text-blue-500 uppercase">
                    CA
                  </p>
                  <p className="text-3xl font-black text-white">{ac}</p>
                </div>
              </div>

              {srd?.speed && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <p className="text-[10px] font-black text-amber-500 uppercase mb-2">
                    Vitesse
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(srd.speed).map(([type, val]) => (
                      <span
                        key={type}
                        className="text-xs text-slate-300 bg-slate-800 px-2 py-1 rounded-lg"
                      >
                        {type}: {val}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {srd && (
                <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-xl text-center">
                  <p className="text-[10px] font-black text-amber-600 uppercase mb-1">
                    Indice de Danger (CR)
                  </p>
                  <p className="text-2xl font-black text-white">
                    {srd.challenge_rating}
                  </p>
                </div>
              )}
            </div>

            {/* COLONNE 2 : Stats */}
            <div className="space-y-4">
              {srd ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "FOR", val: srd.strength },
                    { label: "DEX", val: srd.dexterity },
                    { label: "CON", val: srd.constitution },
                    { label: "INT", val: srd.intelligence },
                    { label: "SAG", val: srd.wisdom },
                    { label: "CHA", val: srd.charisma },
                  ].map(({ label, val }) => (
                    <div
                      key={label}
                      className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center"
                    >
                      <p className="text-[10px] uppercase font-black text-slate-500">
                        {label}
                      </p>
                      <p className="text-2xl font-black text-white">{val}</p>
                      <p className="text-xs font-bold text-amber-500">
                        {getMod(val)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl text-center">
                  <p className="text-xs text-slate-500 italic">
                    Donn&eacute;es compl&egrave;tes non disponibles pour ce
                    monstre custom
                  </p>
                </div>
              )}
            </div>

            {/* COLONNE 3 : Actions & Capacites */}
            <div className="space-y-4">
              {srd?.special_abilities && srd.special_abilities.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl max-h-52 overflow-y-auto">
                  <p className="text-[10px] font-black text-amber-500 uppercase mb-3">
                    Capacit&eacute;s sp&eacute;ciales
                  </p>
                  <div className="space-y-3">
                    {srd.special_abilities.map((a, i) => (
                      <div key={i}>
                        <p className="text-xs font-bold text-white">{a.name}</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-1">
                          {a.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {srd?.actions && srd.actions.length > 0 && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl max-h-60 overflow-y-auto">
                  <p className="text-[10px] font-black text-amber-500 uppercase mb-3">
                    Actions
                  </p>
                  <div className="space-y-3">
                    {srd.actions.map((a, i) => (
                      <div key={i}>
                        <p className="text-xs font-bold text-white">{a.name}</p>
                        <p className="text-[11px] text-slate-400 leading-tight mt-1">
                          {a.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {notFound && (
                <div className="bg-slate-800/30 border border-slate-700 p-4 rounded-xl text-center">
                  <p className="text-[10px] text-slate-500 font-black uppercase">
                    Monstre custom
                  </p>
                  <p className="text-xs text-slate-400 mt-2 italic">
                    Donn&eacute;es compl&egrave;tes non disponibles pour ce
                    monstre custom
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
