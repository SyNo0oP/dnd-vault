"use client";
import { useState, useEffect, useMemo } from "react";

export default function BestiaryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState<"srd" | "creations">("srd");
  const [srdMonsters, setSrdMonsters] = useState<any[]>([]);
  const [myCreations, setMyCreations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonster, setSelectedMonster] = useState<any>(null);

  // États pour la création d'un monstre
  const [isCreating, setIsCreating] = useState(false);
  const [newMonster, setNewMonster] = useState({
    name: "",
    hp: "",
    ac: "",
    cr: "",
    type: "Créature",
    image: "",
  });

  // 1. CHARGEMENT : API + LocalStorage
  useEffect(() => {
    // Fetch API SRD
    fetch("https://www.dnd5eapi.co/api/monsters")
      .then((res) => res.json())
      .then((data) => {
        setSrdMonsters(data.results);
        setIsLoading(false);
      });

    // Charger les créations sauvegardées
    const saved = localStorage.getItem("dnd_vault_creations");
    if (saved) {
      setMyCreations(JSON.parse(saved));
    }
  }, []);

  // 2. SAUVEGARDE : Dès que la liste "myCreations" change
  useEffect(() => {
    // On ne sauvegarde que si le chargement initial est terminé pour éviter d'écraser par du vide
    if (!isLoading) {
      localStorage.setItem("dnd_vault_creations", JSON.stringify(myCreations));
    }
  }, [myCreations, isLoading]);

  const filteredList = useMemo(() => {
    const activeList = currentTab === "srd" ? srdMonsters : myCreations;
    return activeList.filter((m: any) =>
      m.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [searchTerm, currentTab, srdMonsters, myCreations]);

  const handleOpenDetails = async (monster: any) => {
    if (currentTab === "srd") {
      const res = await fetch(`https://www.dnd5eapi.co${monster.url}`);
      const details = await res.json();
      setSelectedMonster(details);
    } else {
      setSelectedMonster(monster);
    }
  };

  // GESTION DE L'IMAGE (Conversion en texte pour stockage)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMonster({ ...newMonster, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const monsterToAdd = {
      ...newMonster,
      id: Date.now().toString(),
    };
    setMyCreations([...myCreations, monsterToAdd]);
    setIsCreating(false);
    setNewMonster({
      name: "",
      hp: "",
      ac: "",
      cr: "",
      type: "Créature",
      image: "",
    });
  };

  const deleteMonster = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Supprimer définitivement ce monstre de vos archives ?")) {
      setMyCreations(myCreations.filter((m) => m.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <main className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase italic text-amber-500 tracking-tighter">
              Bestiaire
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">
              Indice de Dangerosité (CR) : Mesure la puissance du monstre par
              rapport au niveau du groupe.
            </p>
          </div>

          {currentTab === "creations" && (
            <button
              onClick={() => setIsCreating(true)}
              className="bg-amber-500 text-slate-950 px-6 py-2 rounded-full font-black uppercase text-[10px] hover:scale-105 transition-all shadow-lg shadow-amber-500/20"
            >
              + Créer un Monstre
            </button>
          )}
        </div>

        {/* RECHERCHE & TABS */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-slate-900/40 p-3 rounded-2xl border border-white/5">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setCurrentTab("srd")}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${currentTab === "srd" ? "bg-amber-500 text-slate-950" : "text-slate-500"}`}
            >
              Base SRD
            </button>
            <button
              onClick={() => setCurrentTab("creations")}
              className={`px-6 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${currentTab === "creations" ? "bg-amber-500 text-slate-950" : "text-slate-500"}`}
            >
              Mes Créations ({myCreations.length})
            </button>
          </div>
          <input
            type="text"
            placeholder="Filtrer par nom..."
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 text-xs outline-none focus:border-amber-500/50 transition-all"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* GRID DES MONSTRES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredList.map((monster: any) => (
            <div
              key={monster.index || monster.id}
              onClick={() => handleOpenDetails(monster)}
              className="bg-slate-900 border border-white/5 p-6 rounded-[2rem] hover:border-amber-500/50 transition-all hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
            >
              <h3 className="font-bold text-white group-hover:text-amber-500 transition-colors">
                {monster.name}
              </h3>
              <p className="text-[8px] text-slate-600 mt-2 font-black uppercase tracking-widest italic">
                {currentTab === "creations"
                  ? `CR ${monster.cr} • PV ${monster.hp}`
                  : "Fiche API 5e"}
              </p>

              {currentTab === "creations" && (
                <button
                  onClick={(e) => deleteMonster(monster.id, e)}
                  className="absolute top-4 right-4 text-red-500/50 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="text-[8px] font-black uppercase tracking-tighter">
                    Suppr.
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* MODALE DE CRÉATION */}
        {isCreating && (
          <div className="fixed inset-0 z-[400] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
            <form
              onSubmit={handleCreateSubmit}
              className="bg-slate-900 border border-amber-500/30 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative"
            >
              <h2 className="text-2xl font-black text-amber-500 uppercase italic mb-8">
                Nouvelle Créature
              </h2>

              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">
                    Identité
                  </label>
                  <input
                    required
                    placeholder="Nom du monstre"
                    className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500"
                    onChange={(e) =>
                      setNewMonster({ ...newMonster, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      PV
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="10"
                      className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500"
                      onChange={(e) =>
                        setNewMonster({ ...newMonster, hp: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      CA
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="15"
                      className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500"
                      onChange={(e) =>
                        setNewMonster({ ...newMonster, ac: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">
                      Danger (CR)
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="1/2"
                      className="bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-amber-500"
                      onChange={(e) =>
                        setNewMonster({ ...newMonster, cr: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">
                    Portrait
                  </label>
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-amber-500/40 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      className="text-[10px] text-slate-500"
                      onChange={handleImageChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  type="submit"
                  className="flex-1 bg-amber-500 text-slate-950 py-3 rounded-xl font-black uppercase text-xs"
                >
                  Invoquer dans les archives
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 text-slate-500 font-bold uppercase text-[10px]"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODALE DE DÉTAILS */}
        {selectedMonster && (
          <div
            className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedMonster(null)}
          >
            <div
              className="bg-slate-900 border border-amber-500/30 w-full max-w-2xl p-8 rounded-[3rem] shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedMonster(null)}
                className="absolute top-8 right-8 text-slate-500 hover:text-white font-black text-xs uppercase tracking-widest"
              >
                Fermer
              </button>

              <div className="flex gap-8 items-start">
                {selectedMonster.image && (
                  <img
                    src={selectedMonster.image}
                    className="w-32 h-32 rounded-3xl object-cover border border-white/10"
                    alt="Monster"
                  />
                )}
                <div className="flex-1">
                  <h2 className="text-3xl font-black text-amber-500 uppercase italic mb-2 tracking-tighter">
                    {selectedMonster.name}
                  </h2>
                  <p className="text-slate-400 text-xs italic mb-8 uppercase tracking-widest">
                    {selectedMonster.size || "Moyenne"} {selectedMonster.type} —{" "}
                    {selectedMonster.alignment || "Neutre"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-center">
                  <div className="text-amber-500 font-black text-xl">
                    {selectedMonster.armor_class?.[0]?.value ||
                      selectedMonster.ac}
                  </div>
                  <div className="text-[8px] font-bold text-slate-600 uppercase">
                    CA
                  </div>
                </div>
                <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-center">
                  <div className="text-amber-500 font-black text-xl">
                    {selectedMonster.hit_points || selectedMonster.hp}
                  </div>
                  <div className="text-[8px] font-bold text-slate-600 uppercase">
                    PV
                  </div>
                </div>
                <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl text-center">
                  <div className="text-amber-500 font-black text-xl">
                    {selectedMonster.challenge_rating || selectedMonster.cr}
                  </div>
                  <div className="text-[8px] font-bold text-slate-600 uppercase">
                    CR (Danger)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
