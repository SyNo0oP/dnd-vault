"use client";
import { useState, useEffect } from "react";
import Navbar from "@/app/components/Navbar";

interface MonsterReference {
  index: string;
  name: string;
  url: string;
}

export default function MonsterLibrary() {
  const [monsters, setMonsters] = useState<MonsterReference[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // On récupère la liste simplifiée au chargement
  useEffect(() => {
    fetch("https://www.dnd5eapi.co/api/monsters")
      .then((res) => res.json())
      .then((data) => {
        setMonsters(data.results);
        setLoading(false);
      });
  }, []);

  const filteredMonsters = monsters.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200">
      <Navbar />
      <div className="max-w-7xl mx-auto p-8">
        <header className="mb-12">
          <h1 className="text-6xl font-black text-white uppercase tracking-tighter">
            Bestiaire <span className="text-amber-500 italic">Arcane</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">
            Explorez les créatures du multivers et importez-les dans vos scènes.
          </p>
        </header>

        {/* BARRE DE RECHERCHE */}
        <div className="sticky top-20 z-20 mb-8">
          <input
            type="text"
            placeholder="Rechercher un monstre (ex: Dragon, Beholder...)"
            className="w-full bg-slate-900 border border-white/10 p-5 rounded-2xl text-xl outline-none focus:border-amber-500 shadow-2xl backdrop-blur-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-amber-500" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMonsters.slice(0, 20).map((monster) => (
              <MonsterCard key={monster.index} monsterUrl={monster.url} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

// COMPOSANT CARTE (On le définit ici pour l'instant ou dans un fichier séparé)
function MonsterCard({ monsterUrl }: { monsterUrl: string }) {
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    fetch(`https://www.dnd5eapi.co${monsterUrl}`)
      .then((res) => res.json())
      .then((data) => setDetails(data));
  }, [monsterUrl]);

  if (!details)
    return <div className="h-32 bg-slate-900/50 animate-pulse rounded-2xl" />;

  return (
    <div className="group bg-slate-900 border border-white/5 p-4 rounded-3xl hover:border-amber-500/50 transition-all hover:-translate-y-1 shadow-xl">
      <div className="flex flex-col items-center text-center">
        {/* LE TOKEN 2D (Généré automatiquement) */}
        <div className="relative w-24 h-24 mb-4">
          <div className="absolute inset-0 bg-amber-500 rounded-full animate-pulse opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="w-full h-full rounded-full border-4 border-amber-600 overflow-hidden bg-slate-800 shadow-inner flex items-center justify-center">
            {details.image ? (
              <img
                src={`https://www.dnd5eapi.co${details.image}`}
                alt={details.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-4xl">👾</span>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-600 text-slate-950 text-[10px] font-black px-2 py-1 rounded-lg">
            CR {details.challenge_rating}
          </div>
        </div>

        <h3 className="text-lg font-bold text-white leading-tight uppercase tracking-tight">
          {details.name}
        </h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          {details.size} • {details.type}
        </p>

        <div className="grid grid-cols-2 gap-2 w-full mt-4">
          <div className="bg-slate-950 p-2 rounded-xl border border-white/5">
            <p className="text-[8px] text-amber-500 font-black uppercase">PV</p>
            <p className="text-sm font-bold">{details.hit_points}</p>
          </div>
          <div className="bg-slate-950 p-2 rounded-xl border border-white/5">
            <p className="text-[8px] text-amber-500 font-black uppercase">CA</p>
            <p className="text-sm font-bold">{details.armor_class[0].value}</p>
          </div>
        </div>

        <button className="w-full mt-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-slate-950 rounded-xl text-[10px] font-black uppercase transition-all">
          Ajouter au scénario
        </button>
      </div>
    </div>
  );
}
