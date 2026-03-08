'use client';
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';

export default function MyCharacters() {
  const { data: session } = useSession();
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.email) {
      fetch(`/api/characters?email=${session.user.email}`)
        .then(res => res.json())
        .then(data => {
          setCharacters(data);
          setLoading(false);
        });
    }
  }, [session]);

  const deleteCharacter = async (id: string) => {
    if (!confirm("Voulez-vous vraiment effacer cette légende ?")) return;
    const res = await fetch(`/api/characters?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      setCharacters(characters.filter((c: any) => c._id !== id));
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-slate-950 flex flex-col items-center p-4 md:p-8">
      
      {/* 1. L'ANIMATION "CLASH OF CLANS" */}
      <style jsx global>{`
        @keyframes cocZoom {
          0% { 
            transform: scale(2.2) translateY(-5%); 
            filter: blur(10px);
            opacity: 0;
          }
          100% { 
            transform: scale(1) translateY(0); 
            filter: blur(0);
            opacity: 1;
          }
        }
        .animate-heroes-coc {
          animation: cocZoom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* 2. LE FOND : IMAGE map3.jpg */}
      <div 
        className="absolute inset-0 z-0 animate-heroes-coc"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(2,6,23,0.4), rgba(2,6,23,0.8)), url('/map2.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* 3. LE CONTENU (Z-10) */}
      <div className="relative z-10 w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
            MES <span className="text-amber-500 italic">HÉROS</span>
          </h1>
          <Link href="/characters/create">
            <button className="px-6 py-3 bg-amber-600 text-slate-950 font-black uppercase tracking-widest rounded-xl hover:bg-amber-500 transition-all shadow-xl transform active:scale-95">
              + NOUVEAU
            </button>
          </Link>
        </div>

        {loading ? (
          <p className="text-amber-500 font-black animate-pulse text-center uppercase tracking-widest">Lecture du Grimoire...</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.map((c: any) => (
              <div key={c._id} className="group bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-white/10 hover:border-amber-500 transition-all shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase truncate w-40">{c.name}</h2>
                    <p className="text-amber-500 font-bold text-xs uppercase">{c.race} {c.class}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase">Niveau</p>
                    <p className="text-xl font-black text-white">{c.level}</p>
                  </div>
                </div>

                {/* Barre de PV visuelle */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6 flex justify-between items-center">
                   <span className="text-[10px] font-black text-slate-500 uppercase">PV Max</span>
                   <span className="text-lg font-black text-red-500">{c.hpMax}</span>
                </div>

                <div className="flex gap-2">
                  <Link href={`/characters/create?id=${c._id}`} className="flex-1">
                    <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">
                      Modifier
                    </button>
                  </Link>
                  <button 
                    onClick={() => deleteCharacter(c._id)}
                    className="px-4 py-3 bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl transition-all"
                  >
                    🗑️
                  </button>
                </div>
                
                {/* Effet au survol */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-500/0 to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIGNETTE SOMBRE SUR LES BORDURES */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,0,0,1)] z-[1]"></div>
    </main>
  );
}