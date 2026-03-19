"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayHub() {
  const [gameCode, setGameCode] = useState("");
  const [isSelectingCampaign, setIsSelectingCampaign] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const openCampaignSelector = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();

      // DEBUG : Pour vérifier la structure dans la console F12
      console.log("Data from Mongo:", data);

      if (Array.isArray(data)) {
        setMyCampaigns(data);
      } else {
        setMyCampaigns([]);
      }
    } catch (error) {
      console.error("Erreur API:", error);
    } finally {
      setLoading(false);
      setIsSelectingCampaign(true);
    }
  };

  const handleLaunchGame = async (campaign: any) => {
    setLoading(true);
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
      // ON CRÉE LA SESSION DANS MONGODB
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode,
          campaignId: campaign._id || campaign.id,
          status: "active",
          currentAct: 0,
          currentSubAct: 0,
        }),
      });

      router.push(
        `/play/${newCode}?role=dm&campaignId=${campaign._id || campaign.id}`,
      );
    } catch (error) {
      console.error("Erreur creation session:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameCode.length === 6) {
      router.push(`/play/${gameCode.toUpperCase()}?role=player`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-5xl font-black italic text-amber-500 uppercase tracking-tighter">
            Session Live
          </h1>
        </div>

        <div className="grid gap-6">
          {/* MJ */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-amber-500/20 shadow-2xl relative overflow-hidden">
            {loading && (
              <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />
            )}
            <h2 className="text-lg font-black uppercase mb-4 tracking-tight">
              Héberger
            </h2>
            <button
              onClick={openCampaignSelector}
              disabled={loading}
              className="w-full bg-amber-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-xs hover:bg-white transition-all disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Démarrer le Serveur"}
            </button>
          </div>

          <div className="relative py-4 flex items-center justify-center">
            <span className="text-slate-700 font-black text-[10px] uppercase">
              OU
            </span>
          </div>

          {/* JOUEUR */}
          <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
            <h2 className="text-lg font-black uppercase mb-4 tracking-tight">
              Rejoindre
            </h2>
            <form onSubmit={handleJoinGame} className="space-y-4">
              <input
                type="text"
                placeholder="CODE : ABCDEF"
                maxLength={6}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 text-center font-black outline-none focus:border-amber-500 transition-all uppercase placeholder:text-slate-800"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              />
              <button className="w-full bg-white/5 py-4 rounded-2xl font-black uppercase text-xs hover:bg-white hover:text-slate-950 transition-all">
                Entrer dans la partie
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODALE DE SÉLECTION */}
      {isSelectingCampaign && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6 text-white">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl">
            <h2 className="text-3xl font-black text-amber-500 uppercase italic mb-6">
              Sélectionner une Campagne
            </h2>

            <div className="grid gap-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
              {myCampaigns.length > 0 ? (
                myCampaigns.map((camp) => (
                  <button
                    key={camp._id || camp.id}
                    onClick={() => handleLaunchGame(camp)}
                    className="flex justify-between items-center p-6 bg-slate-950 border border-white/5 rounded-2xl hover:border-amber-500 transition-all group text-left"
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-white group-hover:text-amber-500 italic uppercase">
                        {camp.name || "Campagne sans nom"}
                      </span>
                      <span className="text-[8px] text-slate-600 font-bold uppercase">
                        {camp.acts?.length || 0} ACTES - {camp.maxPlayers || 0}{" "}
                        JOUEURS
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 uppercase italic">
                      Lancer la quête →
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-10 text-center">
                  <p className="text-slate-500 uppercase font-black text-xs">
                    Aucune campagne trouvée dans votre coffre-fort.
                  </p>
                  <p className="text-[9px] text-slate-700 mt-2 uppercase italic">
                    Vérifiez que vous êtes bien connecté.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSelectingCampaign(false)}
              className="mt-8 text-slate-500 text-[10px] font-black uppercase hover:text-red-500 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
