"use client";
import { useState, useEffect, useMemo } from "react";

export default function MonsterLibraryModal({
  isOpen,
  onClose,
  onAddMonster,
}: any) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<"srd" | "creations">("srd");
  const [srdMonsters, setSrdMonsters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Tes créations (vides pour le moment)
  const [myCreations] = useState([]);

  // Récupération des monstres depuis l'API officielle au montage
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("https://www.dnd5eapi.co/api/monsters")
        .then((res) => res.json())
        .then((data) => {
          // On formate les données pour qu'elles correspondent à notre structure
          const formatted = data.results.map((m: any) => ({
            id: m.index,
            name: m.name,
            url: m.url, // On gardera l'URL pour fetch les stats au clic
            type: "Créature",
            hp: "?",
            ac: "?",
            cr: "?",
          }));
          setSrdMonsters(formatted);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen]);

  const filteredList = useMemo(() => {
    const activeList = currentTab === "srd" ? srdMonsters : myCreations;
    return activeList.filter((m: any) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, currentTab, srdMonsters, myCreations]);

  // Fonction pour ajouter le monstre (on pourrait fetch ses stats complètes ici avant onAddMonster)
  const handleSelect = async (monster: any) => {
    if (currentTab === "srd") {
      const res = await fetch(`https://www.dnd5eapi.co${monster.url}`);
      const details = await res.json();
      onAddMonster({
        name: details.name,
        hp: details.hit_points,
        ac: details.armor_class[0].value,
        type: details.type,
        cr: details.challenge_rating,
      });
    } else {
      onAddMonster(monster);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-4xl h-[80vh] rounded-[2.5rem] border border-white/10 flex flex-col overflow-hidden shadow-2xl">
        {/* HEADER */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-amber-500 uppercase tracking-tighter italic">
              Bestiaire
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
              Accès à la base de données D&D 5e
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white font-black uppercase text-xs"
          >
            Fermer
          </button>
        </div>

        {/* RECHERCHE */}
        <div className="px-8 py-6 bg-slate-900/50 flex flex-col md:flex-row gap-4">
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => setCurrentTab("srd")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${currentTab === "srd" ? "bg-amber-500 text-slate-950" : "text-slate-500"}`}
            >
              SRD
            </button>
            <button
              onClick={() => setCurrentTab("creations")}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${currentTab === "creations" ? "bg-amber-500 text-slate-950" : "text-slate-500"}`}
            >
              Mes Créations
            </button>
          </div>
          <input
            type="text"
            placeholder="Rechercher un monstre..."
            className="flex-1 bg-slate-950 border border-white/10 rounded-2xl px-5 py-3 text-xs outline-none focus:border-amber-500/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* LISTE */}
        <div className="flex-1 overflow-y-auto p-8 pt-0">
          {isLoading ? (
            <div className="flex justify-center items-center h-full text-amber-500 font-black animate-pulse">
              CHARGEMENT DU GRIMOIRE...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredList.map((monster: any) => (
                <button
                  key={monster.id}
                  onClick={() => handleSelect(monster)}
                  className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl hover:border-amber-500 hover:bg-amber-500/5 text-left transition-all"
                >
                  <h4 className="font-bold text-white uppercase text-sm">
                    {monster.name}
                  </h4>
                  <p className="text-[9px] text-slate-500 font-black mt-1">
                    CLIQUEZ POUR INVOQUER
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
