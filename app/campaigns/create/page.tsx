"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import MapConfigModal from "@/app/components/MapConfigModal";

// Factory pour créer une nouvelle instance de scène unique (évite les problèmes de référence)
const createNewSubAct = (index: number) => ({
  title: `Scène ${index}`,
  description: "",
  mapUrl: "",
  gridType: "square",
  gridSize: 50,
  opacity: 0.3,
  offsetX: 0,
  offsetY: 0,
});

function CreateCampaignForm() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePath, setActivePath] = useState<{
    aIdx: number;
    sIdx: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    name: "",
    description: "",
    maxPlayers: 5,
    acts: [
      {
        title: "Acte 1",
        subActs: [createNewSubAct(1)],
      },
    ],
    settings: {
      enemyHPVisible: false,
      gridType: "square",
      gridSize: 50,
      secretDMDie: true,
      mapUrlGlobal: "",
    },
  });

  useEffect(() => {
    if (editId) {
      fetch(`/api/campaigns/detail?id=${editId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data) setConfig(data);
        })
        .catch((err) => console.error("Erreur de chargement:", err));
    }
  }, [editId]);

  const removeAct = (index: number) => {
    if (config.acts.length <= 1) return;
    const newActs = config.acts.filter((_, i) => i !== index);
    setConfig({ ...config, acts: newActs });
  };

  const removeSubAct = (aIdx: number, sIdx: number) => {
    if (config.acts[aIdx].subActs.length <= 1) return;
    const newActs = [...config.acts];
    newActs[aIdx].subActs = newActs[aIdx].subActs.filter((_, i) => i !== sIdx);
    setConfig({ ...config, acts: newActs });
  };

  const addAct = () => {
    setConfig({
      ...config,
      acts: [
        ...config.acts,
        {
          title: `Acte ${config.acts.length + 1}`,
          subActs: [createNewSubAct(1)], // Utilisation de la factory pour un objet neuf
        },
      ],
    });
  };

  const addSubAct = (actIndex: number) => {
    const newActs = [...config.acts];
    // On pousse un nouvel objet unique retourné par la factory
    newActs[actIndex].subActs.push(
      createNewSubAct(newActs[actIndex].subActs.length + 1),
    );
    setConfig({ ...config, acts: newActs });
  };

  const updateSubAct = (
    actIndex: number,
    subIndex: number,
    field: string,
    value: any,
  ) => {
    const newActs = [...config.acts];
    (newActs[actIndex].subActs[subIndex] as any)[field] = value;
    setConfig({ ...config, acts: newActs });
  };

  const handleSubmit = async () => {
    if (!session?.user?.email) return alert("Connecte-toi d'abord !");
    if (!config.name) return alert("Le nom de la campagne est requis !");

    setLoading(true);
    const method = editId ? "PATCH" : "POST";
    const payload = editId
      ? { ...config, id: editId }
      : {
          ...config,
          creatorEmail: session.user.email,
          joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
          createdAt: new Date(),
        };

    try {
      const res = await fetch("/api/campaigns", {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/campaigns");
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full bg-slate-950 text-slate-200 p-4 md:p-8 overflow-y-auto">
      <div
        className="fixed inset-0 z-0 opacity-20"
        style={{ backgroundImage: "url('/map3.jpg')", backgroundSize: "cover" }}
      />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 pb-20">
        <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
          {editId ? "Modifier" : "Configuration"}{" "}
          <span className="text-amber-500 italic">MJ</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            <section className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
              <h2 className="text-[10px] font-black text-amber-500 uppercase mb-6 tracking-widest">
                Général & Dés
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Nom de la Campagne"
                  className="w-full bg-slate-950 border border-slate-800 p-3 rounded-xl outline-none focus:border-amber-500 font-bold"
                  value={config.name}
                  onChange={(e) =>
                    setConfig({ ...config, name: e.target.value })
                  }
                />

                <div className="p-4 bg-slate-950/50 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">
                      Cacher mes jets (MJ)
                    </span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-amber-500"
                      checked={config.settings.secretDMDie}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            secretDMDie: e.target.checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold">
                      PV Ennemis visibles
                    </span>
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-amber-500"
                      checked={config.settings.enemyHPVisible}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          settings: {
                            ...config.settings,
                            enemyHPVisible: e.target.checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  Progression de l'histoire
                </h2>
                <button
                  onClick={addAct}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black px-4 py-2 rounded-xl transition-all"
                >
                  + AJOUTER UN ACTE
                </button>
              </div>

              <div className="space-y-12">
                {config.acts.map((act, aIdx) => (
                  <div
                    key={aIdx}
                    className="relative group bg-white/5 p-6 rounded-3xl border border-white/5"
                  >
                    <button
                      onClick={() => removeAct(aIdx)}
                      className="absolute top-4 right-4 text-slate-600 hover:text-red-500 text-xs font-bold uppercase transition-colors"
                    >
                      Supprimer Acte
                    </button>

                    <input
                      type="text"
                      className="bg-transparent text-2xl font-black text-white outline-none focus:text-amber-500 mb-6"
                      value={act.title}
                      onChange={(e) => {
                        const n = [...config.acts];
                        n[aIdx].title = e.target.value;
                        setConfig({ ...config, acts: n });
                      }}
                    />

                    <div className="space-y-4">
                      {act.subActs.map((sub, sIdx) => (
                        <div
                          key={sIdx}
                          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4"
                        >
                          <div className="flex justify-between items-center">
                            <input
                              type="text"
                              className="bg-transparent font-bold text-amber-600 outline-none"
                              value={sub.title}
                              onChange={(e) =>
                                updateSubAct(
                                  aIdx,
                                  sIdx,
                                  "title",
                                  e.target.value,
                                )
                              }
                            />
                            <button
                              onClick={() => removeSubAct(aIdx, sIdx)}
                              className="text-[9px] text-slate-700 hover:text-red-500 font-black uppercase"
                            >
                              Supprimer Scène
                            </button>
                          </div>

                          <textarea
                            placeholder="Description de la scène..."
                            className="w-full bg-slate-900/40 p-3 rounded-xl text-xs h-20 outline-none border border-transparent focus:border-amber-500/30 resize-none"
                            value={sub.description}
                            onChange={(e) =>
                              updateSubAct(
                                aIdx,
                                sIdx,
                                "description",
                                e.target.value,
                              )
                            }
                          />

                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setActivePath({ aIdx, sIdx });
                                setIsModalOpen(true);
                              }}
                              className="flex-1 bg-amber-500/10 border border-amber-500/50 text-amber-500 p-3 rounded-xl text-[10px] font-black uppercase hover:bg-amber-500 hover:text-slate-950 transition-all"
                            >
                              {sub.mapUrl
                                ? "⚙️ Modifier la Map"
                                : "🖼️ Ajouter une Map"}
                            </button>
                            {sub.mapUrl && (
                              <div className="text-[10px] text-green-500 font-bold flex items-center gap-1 uppercase">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Configurée
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addSubAct(aIdx)}
                        className="text-[10px] font-black text-amber-500/50 hover:text-amber-500 uppercase tracking-[0.2em] w-full py-2 border-2 border-dashed border-white/5 rounded-xl transition-all"
                      >
                        + Nouvelle Scène
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-6 bg-amber-600 text-slate-950 font-black uppercase tracking-[0.5em] rounded-3xl shadow-2xl hover:bg-white transition-all transform hover:scale-[1.01]"
            >
              {loading
                ? "Incrantation..."
                : editId
                  ? "Enregistrer les modifications"
                  : "Lancer la campagne"}
            </button>
          </div>
        </div>
      </div>

      <MapConfigModal
        isOpen={isModalOpen}
        initialSettings={
          activePath
            ? config.acts[activePath.aIdx].subActs[activePath.sIdx]
            : null
        }
        onClose={() => setIsModalOpen(false)}
        onSave={(mapSettings) => {
          if (activePath) {
            const newActs = [...config.acts];
            // On s'assure de fusionner dans une nouvelle copie de l'objet subAct
            newActs[activePath.aIdx].subActs[activePath.sIdx] = {
              ...newActs[activePath.aIdx].subActs[activePath.sIdx],
              ...mapSettings,
            };
            setConfig({ ...config, acts: newActs });
          }
          setIsModalOpen(false);
        }}
      />
    </main>
  );
}

export default function CreateCampaign() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-amber-500 font-black uppercase">
          Chargement du Grimoire...
        </div>
      }
    >
      <CreateCampaignForm />
    </Suspense>
  );
}
