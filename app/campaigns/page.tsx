"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Campaign {
  _id: string;
  name: string;
  description: string;
  joinCode: string;
}

export default function MyCampaigns() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/campaigns?email=${session.user.email}`)
        .then((res) => res.json())
        .then((data) => {
          setCampaigns(data);
          setLoading(false);
        });
    }
  }, [session]);

  const deleteCampaign = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette campagne ?")) return;

    const res = await fetch("/api/campaigns", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    if (res.ok) {
      setCampaigns(campaigns.filter((c) => c._id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-black text-amber-500 uppercase tracking-tighter">
            Mes Campagnes
          </h1>
          <Link
            href="/campaigns/create"
            className="bg-amber-500 text-slate-950 font-black py-3 px-8 rounded-2xl hover:bg-amber-400 transition-all uppercase"
          >
            Nouvelle Aventure
          </Link>
        </div>

        {loading ? (
          <p className="text-amber-500/50 font-black animate-pulse">
            CHARGEMENT DU GRIMOIRE...
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign._id}
                className="bg-slate-900 border-2 border-slate-800 p-6 rounded-3xl hover:border-amber-500/50 transition-all group"
              >
                <h2 className="text-2xl font-black text-amber-500 uppercase mb-2">
                  {campaign.name}
                </h2>
                <p className="text-slate-400 mb-4 line-clamp-2">
                  {campaign.description}
                </p>
                <div className="text-xs font-mono text-slate-500 mb-6 uppercase tracking-widest">
                  Code:{" "}
                  <span className="text-white bg-slate-800 px-2 py-1 rounded">
                    {campaign.joinCode}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-white font-black py-2 rounded-xl transition-all uppercase text-sm font-medium">
                    Lancer
                  </button>

                  {/* NOUVEAU BOUTON MODIFIER */}
                  <Link
                    href={`/campaigns/create?id=${campaign._id}`}
                    className="px-4 bg-slate-800 text-amber-500 hover:bg-amber-500 hover:text-slate-950 rounded-xl transition-all flex items-center justify-center"
                  >
                    <span className="text-xs font-bold uppercase">
                      Modifier
                    </span>
                  </Link>

                  <button
                    onClick={() => deleteCampaign(campaign._id)}
                    className="px-4 border-2 border-red-900/50 text-red-900 hover:bg-red-600 hover:text-white rounded-xl transition-all font-black"
                  >
                    X
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl">
            <p className="text-slate-500 font-black uppercase">
              Aucune épopée en cours...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
