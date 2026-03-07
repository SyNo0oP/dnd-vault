'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from "next-auth/react";

export default function MyCharacters() {
  const { data: session } = useSession();
  // On précise <any[]> pour que TS arrête de râler sur le map
  const [heroes, setHeroes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHeroes = async () => {
    if (session?.user?.email) {
      try {
        const res = await fetch(`/api/characters?email=${session.user.email}`);
        if (!res.ok) throw new Error("Erreur serveur");
        const data = await res.json();
        setHeroes(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Erreur de chargement:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce héros ?")) return;

    try {
      const res = await fetch(`/api/characters?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHeroes((prev) => prev.filter((h) => h._id !== id));
      }
    } catch (error) {
      alert("Erreur lors de la suppression");
    }
  };

  useEffect(() => {
    if (session) fetchHeroes();
  }, [session]);

  if (!session) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-950 p-8">
        <div className="text-center p-12 border-2 border-dashed border-slate-800 rounded-3xl">
          <p className="text-slate-500 font-bold uppercase tracking-widest">Connexion requise</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-4 md:p-12 text-slate-100">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-end mb-12 border-b border-amber-900/30 pb-6">
          <div>
            <h1 className="text-4xl font-black text-amber-500 uppercase tracking-tighter">Mes Héros</h1>
            <p className="text-slate-400 font-medium italic">Effectif de la guilde : {heroes.length}</p>
          </div>
          <Link href="/characters/create">
            <button className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black px-6 py-3 rounded-xl transition-all shadow-lg shadow-amber-900/20 uppercase text-[10px] tracking-widest active:scale-95">
              + Invoquer un Héros
            </button>
          </Link>
        </header>

        {loading ? (
          <div className="text-center py-20 text-amber-500 animate-pulse font-black uppercase tracking-widest">
            Lecture du grimoire...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {heroes.map((hero) => (
              <div key={hero._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-amber-600/50 transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-600 text-slate-950 font-black px-4 py-1 rounded-bl-xl text-[10px]">
                  LVL {hero.level || 1}
                </div>

                <h3 className="text-2xl font-black text-amber-200 mb-1">{hero.name}</h3>
                
                {/* On vérifie que hero.stats existe avant de faire le Object.entries */}
                <div className="grid grid-cols-3 gap-2 mb-6 mt-4">
                  {hero.stats && Object.entries(hero.stats).map(([stat, val]: any) => (
                    <div key={stat} className="bg-slate-800/50 p-2 rounded-lg text-center border border-slate-700/50">
                      <p className="text-[8px] uppercase text-slate-500 font-black mb-1">{stat.substring(0,3)}</p>
                      <p className="text-sm font-bold text-slate-200">{val}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 border-t border-slate-800 pt-4 mt-2">
                  <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black py-2 rounded-lg transition-colors border border-slate-700 uppercase">
                    Fiche Détails
                  </button>
                  <button 
                    onClick={() => handleDelete(hero._id)}
                    className="p-2 bg-red-950/20 hover:bg-red-600 text-red-600 hover:text-white rounded-lg transition-all border border-red-900/30"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}